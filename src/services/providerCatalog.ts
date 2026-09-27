import type { Channel } from '@/types/iptv';
import { readCache, writeCache } from './cache';
import { fetchCountryChannels, getChannelSources } from './iptv';

export const PROVIDER_REFRESH_MS = 15 * 60 * 1000;
const pending = new Map<string, Promise<Channel[]>>();
const WORKING_SOURCES_KEY = 'working-sources';

function sourceKey(channel: Channel) { return `${channel.countryCode}:${channel.id}`; }

export async function prioritizeKnownSources(channels: Channel[]) {
  const known = await readCache<Record<string, string>>(WORKING_SOURCES_KEY, 24 * 60 * 60 * 1000);
  if (!known?.data) return channels;
  return channels.map(channel => {
    const preferred = known.data[sourceKey(channel)];
    const sources = getChannelSources(channel);
    const active = sources.find(source => source.url === preferred);
    if (!active) return channel;
    const ordered = [active, ...sources.filter(source => source.url !== active.url)];
    return { ...channel, ...active, sources: ordered, alternativeUrls: ordered.slice(1).map(source => source.url) };
  });
}

export async function refreshProviderCatalog(code: string, force = false): Promise<Channel[]> {
  const country = code.toUpperCase();
  const cached = await readCache<Channel[]>(`providers:v2:${country}`);
  if (!force && cached?.data.length && Date.now() - cached.savedAt < PROVIDER_REFRESH_MS) return prioritizeKnownSources(cached.data);
  const existing = pending.get(country);
  if (existing) return existing;
  const request = (async () => {
    try {
      const channels = await fetchCountryChannels(country, cached?.data);
      if (!channels.length) throw new Error('O catálogo retornou vazio.');
      const prioritized = await prioritizeKnownSources(channels);
      await writeCache(`providers:v2:${country}`, prioritized);
      await writeCache(`country:${country}`, prioritized);
      return prioritized;
    } catch (error) {
      if (cached?.data.length) return cached.data;
      throw error;
    } finally { pending.delete(country); }
  })();
  pending.set(country, request);
  return request;
}

export async function refreshChannelSources(channel: Channel, force = false) {
  const channels = await refreshProviderCatalog(channel.countryCode, force);
  const latest = channels.find(item => item.id === channel.id);
  return latest ? { ...channel, ...latest } : channel;
}

export async function rememberWorkingSource(channel: Channel, url: string) {
  await writeCache(`working-source:${channel.countryCode}:${channel.id}`, url);
  const known = await readCache<Record<string, string>>(WORKING_SOURCES_KEY, 24 * 60 * 60 * 1000);
  await writeCache(WORKING_SOURCES_KEY, { ...(known?.data || {}), [sourceKey(channel)]: url });
}

export async function preferredSource(channel: Channel) {
  const saved = await readCache<string>(`working-source:${channel.countryCode}:${channel.id}`, 24 * 60 * 60 * 1000);
  return getChannelSources(channel).find(source => source.url === saved?.data)?.url;
}
