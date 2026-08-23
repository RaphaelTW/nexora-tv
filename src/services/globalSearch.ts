import { readCache, writeCache } from './cache';
import type { Channel } from '@/types/iptv';

const ENDPOINTS = {
  channels: 'https://iptv-org.github.io/api/channels.json',
  streams: 'https://iptv-org.github.io/api/streams.json',
  logos: 'https://iptv-org.github.io/api/logos.json'
};
const CACHE_KEY = 'global-channel-index';
const CACHE_TTL = 24 * 60 * 60 * 1000;

type ApiChannel = { id: string; name: string; country: string; categories?: string[]; is_nsfw?: boolean };
type ApiStream = { channel: string | null; title: string; url: string; referrer?: string | null; user_agent?: string | null; quality?: string | null };
type ApiLogo = { channel: string; url: string; in_use?: boolean };
let pending: Promise<Channel[]> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { signal: controller.signal, headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json() as T;
  } finally { clearTimeout(timeout); }
}

async function buildIndex() {
  const cached = await readCache<Channel[]>(CACHE_KEY, CACHE_TTL);
  if (cached?.data?.length) return cached.data;
  const [channels, streams, logos] = await Promise.all([
    fetchJson<ApiChannel[]>(ENDPOINTS.channels),
    fetchJson<ApiStream[]>(ENDPOINTS.streams),
    fetchJson<ApiLogo[]>(ENDPOINTS.logos)
  ]);
  const metadata = new Map(channels.filter((item) => !item.is_nsfw).map((item) => [item.id, item]));
  const logoMap = new Map<string, string>();
  logos.forEach((logo) => { if (logo.in_use || !logoMap.has(logo.channel)) logoMap.set(logo.channel, logo.url); });
  const result = new Map<string, Channel>();
  for (const stream of streams) {
    if (!stream.channel) continue;
    const meta = metadata.get(stream.channel);
    if (!meta) continue;
    const existing = result.get(stream.channel);
    if (existing) {
      if (stream.url !== existing.url && !(existing.alternativeUrls || []).includes(stream.url)) existing.alternativeUrls = [...(existing.alternativeUrls || []), stream.url];
      continue;
    }
    result.set(stream.channel, {
      id: stream.channel,
      name: meta.name || stream.title,
      countryCode: meta.country,
      group: meta.categories?.join(', ') || 'Geral',
      logo: logoMap.get(stream.channel),
      quality: stream.quality || undefined,
      url: stream.url,
      referrer: stream.referrer || undefined,
      userAgent: stream.user_agent || undefined
    });
  }
  const index = [...result.values()].sort((a, b) => a.name.localeCompare(b.name));
  await writeCache(CACHE_KEY, index);
  return index;
}

export function loadGlobalChannelIndex() {
  pending ||= buildIndex().finally(() => { pending = null; });
  return pending;
}

export function searchGlobalChannels(channels: Channel[], query: string, limit = 40) {
  const q = query.trim().toLocaleLowerCase('pt-BR');
  if (q.length < 2) return [];
  return channels.filter((channel) => `${channel.name} ${channel.countryCode} ${channel.group || ''}`.toLocaleLowerCase('pt-BR').includes(q)).slice(0, limit);
}
