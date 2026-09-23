import type { Channel } from '@/types/iptv';
import { readCache, writeCache } from './cache';
import { fetchCountryChannels, getChannelSources } from './iptv';

export const PROVIDER_REFRESH_MS = 15 * 60 * 1000;
const pending = new Map<string, Promise<Channel[]>>();

export async function refreshProviderCatalog(code: string, force = false): Promise<Channel[]> {
  const country = code.toUpperCase();
  const cached = await readCache<Channel[]>(`providers:v2:${country}`);
  if (!force && cached?.data.length && Date.now() - cached.savedAt < PROVIDER_REFRESH_MS) return cached.data;
  const existing = pending.get(country);
  if (existing) return existing;
  const request = (async () => {
    try {
      const channels = await fetchCountryChannels(country, cached?.data);
      if (!channels.length) throw new Error('O catálogo retornou vazio.');
      await writeCache(`providers:v2:${country}`, channels);
      await writeCache(`country:${country}`, channels);
      return channels;
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
}

export async function preferredSource(channel: Channel) {
  const saved = await readCache<string>(`working-source:${channel.countryCode}:${channel.id}`, 24 * 60 * 60 * 1000);
  return getChannelSources(channel).find(source => source.url === saved?.data)?.url;
}
