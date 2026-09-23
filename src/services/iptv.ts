import type { Channel, Country } from '@/types/iptv';

export const IPTV_ENDPOINTS = {
  tdt: 'https://www.tdtchannels.com/lists/tv.m3u8',
  freeTv: 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8',
  countries: 'https://iptv-org.github.io/api/countries.json',
  categories: 'https://iptv-org.github.io/api/categories.json',
  countryPlaylist: (code: string) =>
    `https://iptv-org.github.io/iptv/countries/${code.toLowerCase()}.m3u`
} as const;

const TIMEOUT_MS = 15000;

async function fetchText(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json,text/plain,*/*' }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchCountries(): Promise<Country[]> {
  const text = await fetchText(IPTV_ENDPOINTS.countries);
  const countries = JSON.parse(text) as Country[];
  return countries
    .filter((item) => item.code && item.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

let freeTvRequest: Promise<string> | undefined;
let freeTvExpires = 0;
function fetchFreeTv() {
  if (!freeTvRequest || Date.now() > freeTvExpires) {
    freeTvExpires = Date.now() + 15 * 60 * 1000;
    freeTvRequest = fetchText(IPTV_ENDPOINTS.freeTv).catch((error) => {
      freeTvRequest = undefined;
      throw error;
    });
  }
  return freeTvRequest;
}

export async function fetchCountryChannels(code: string, previous: Channel[] = []): Promise<Channel[]> {
  const country = code.toUpperCase();
  const results = await Promise.allSettled([
    fetchText(IPTV_ENDPOINTS.countryPlaylist(code)).then(text => parseM3U(text, country)),
    fetchFreeTv().then(text => parseM3U(text, country, 'Free-TV', true))
  ]);
  if (results.every(result => result.status === 'rejected')) throw new Error('Não foi possível carregar as fontes públicas. Tente novamente.');
  const providers = ['IPTV-org', 'Free-TV'];
  const channels = mergeChannels(results.flatMap((result, index) => result.status === 'fulfilled' ? result.value : previous.flatMap(channel => {
    const sources = getChannelSources(channel).filter(source => source.provider === providers[index]);
    return sources.length ? [{ ...channel, ...sources[0], sources, alternativeUrls: sources.slice(1).map(source => source.url) }] : [];
  })));
  if (country !== 'ES') return channels;
  try {
    const extra = parseM3U(await fetchText(IPTV_ENDPOINTS.tdt), country, 'TDTChannels');
    return mergeChannels([...channels, ...matchAdditionalSources(channels, extra)]);
  } catch { return channels; }
}

// Match only an unambiguous name already present in this country's catalog.
export function matchAdditionalSources(channels: Channel[], extras: Channel[]) {
  const name = (value: string) => value.toLowerCase().replace(/\s*\(\d+p\)/g, '').replace(/\s+/g, ' ').trim();
  return extras.flatMap(extra => {
    const matches = channels.filter(channel => name(channel.name) === name(extra.name));
    return matches.length === 1 ? [{ ...extra, id: matches[0].id, countryCode: matches[0].countryCode }] : [];
  });
}

export function getChannelSources(channel: Channel) {
  return [...new Set([channel.url, ...(channel.alternativeUrls || []), ...(channel.sources || []).map(source => source.url)])].map(url =>
    channel.sources?.find(source => source.url === url) || {
      url, provider: new URL(url).hostname,
      referrer: url === channel.url ? channel.referrer : undefined,
      userAgent: url === channel.url ? channel.userAgent : undefined
    });
}

export function mergeChannels(channels: Channel[]): Channel[] {
  const merged = new Map<string, Channel>();
  for (const channel of channels) {
    const key = `${channel.countryCode}|${channel.id}`;
    const existing = merged.get(key);
    const sources = getChannelSources(channel);
    if (!existing) {
      merged.set(key, { ...channel, sources });
      continue;
    }
    existing.sources = [...existing.sources!, ...sources.filter(source => !existing.sources!.some(item => item.url === source.url))];
    existing.alternativeUrls = existing.sources.filter(source => source.url !== existing.url).map(source => source.url);
  }
  return [...merged.values()];
}

export function isPublicStream(url: string) {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol) && !parsed.username && !parsed.password
      && ![...parsed.searchParams.keys()].some(key => /^(username|password|user|pass)$/i.test(key))
      && /\.(m3u8|mpd|mp4|ts)$/i.test(parsed.pathname);
  } catch { return false; }
}

function stableHash(input: string) {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}

function parseAttributes(line: string) {
  const attrs: Record<string, string> = {};
  const regex = /([\w-]+)="([^"]*)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(line))) attrs[match[1]] = match[2];
  return attrs;
}

export function parseM3U(content: string, countryCode: string, provider = 'IPTV-org', filterCountry = false): Channel[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const output: Channel[] = [];
  let pending: {
    name: string;
    attrs: Record<string, string>;
    referrer?: string;
    userAgent?: string;
  } | null = null;

  for (const line of lines) {
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      const attrs = parseAttributes(line);
      const comma = line.lastIndexOf(',');
      const name = comma >= 0 ? line.slice(comma + 1).trim() : attrs['tvg-name'] || 'Canal';
      pending = { name, attrs };
      continue;
    }
    if (!pending) continue;
    if (line.startsWith('#EXTVLCOPT:http-referrer=')) {
      pending.referrer = line.split('=').slice(1).join('=').trim();
      continue;
    }
    if (line.startsWith('#EXTVLCOPT:http-user-agent=')) {
      pending.userAgent = line.split('=').slice(1).join('=').trim();
      continue;
    }
    if (line.startsWith('#')) continue;

    const url = line;
    if (!isPublicStream(url) || (filterCountry && pending.attrs['tvg-country']?.toUpperCase() !== countryCode.toUpperCase())) {
      pending = null;
      continue;
    }
    const tvgId = pending.attrs['tvg-id'];
    const id = tvgId || `${countryCode}-${stableHash(`${pending.name}|${url}`)}`;
    output.push({
      id,
      name: pending.name || pending.attrs['tvg-name'] || 'Canal',
      countryCode,
      logo: pending.attrs['tvg-logo'] || undefined,
      group: pending.attrs['group-title'] || 'Geral',
      quality: pending.attrs['quality'] || undefined,
      url,
      sources: [{ url, provider, referrer: pending.referrer, userAgent: pending.userAgent }],
      referrer: pending.referrer,
      userAgent: pending.userAgent
    });
    pending = null;
  }

  return mergeChannels(output);
}
