import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Channel } from '@/types/iptv';
import { filterUnavailableChannels } from './channelUtils';
import { getChannelSources } from './iptv';
import { probeStream } from './streamProbe';

const KEY = 'nexora:unavailable-channels';
const HIDDEN_FOR_MS = 6 * 60 * 60 * 1000;

type UnavailableMap = Record<string, number>;

async function readUnavailable(): Promise<UnavailableMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as UnavailableMap; } catch { return {}; }
}

export async function markChannelUnavailable(channel: Channel) {
  await markChannelSourceUnavailable(channel, channel.url);
}

export async function markChannelSourceUnavailable(channel: Channel, url: string) {
  const unavailable = await readUnavailable();
  unavailable[`${channel.id}|${url}`] = Date.now();
  await AsyncStorage.setItem(KEY, JSON.stringify(unavailable));
}

export async function removeUnavailableChannels(channels: Channel[]) {
  const unavailable = await readUnavailable();
  const now = Date.now();
  const active = Object.fromEntries(Object.entries(unavailable).filter(([, time]) => now - time < HIDDEN_FOR_MS));
  if (Object.keys(active).length !== Object.keys(unavailable).length) {
    await AsyncStorage.setItem(KEY, JSON.stringify(active));
  }
  return filterUnavailableChannels(channels, active, now, HIDDEN_FOR_MS);
}

// Keep the probe small and non-destructive: some broadcasters reject HEAD
// requests even though playback works. A 403 is hidden only after playback
// itself confirms it in useChannelPlayback.
export async function checkCatalogHealth(channels: Channel[], maxProbes = 8) {
  const candidates = channels.slice(0, maxProbes).map(channel => ({ channel, source: getChannelSources(channel)[0] })).filter((item): item is { channel: Channel; source: NonNullable<typeof item.source> } => Boolean(item.source));
  const statuses = await Promise.all(candidates.map(async ({ channel, source }) => ({ id: channel.id, url: source.url, status: await probeStream(source.url) })));
  const statusBySource = new Map(statuses.map(result => [`${result.id}|${result.url}`, result.status]));
  return channels.map(channel => {
    const status = statusBySource.get(`${channel.id}|${channel.url}`);
    return status ? { ...channel, probeStatus: status === 'forbidden' ? 'offline' : status } : channel;
  });
}
