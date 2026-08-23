import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Channel } from '@/types/iptv';

const KEY = 'nexora:unavailable-channels';
const HIDDEN_FOR_MS = 6 * 60 * 60 * 1000;

type UnavailableMap = Record<string, number>;

async function readUnavailable(): Promise<UnavailableMap> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return {};
  try { return JSON.parse(raw) as UnavailableMap; } catch { return {}; }
}

export async function markChannelUnavailable(channel: Channel) {
  const unavailable = await readUnavailable();
  unavailable[`${channel.id}|${channel.url}`] = Date.now();
  await AsyncStorage.setItem(KEY, JSON.stringify(unavailable));
}

export async function removeUnavailableChannels(channels: Channel[]) {
  const unavailable = await readUnavailable();
  const now = Date.now();
  const active = Object.fromEntries(Object.entries(unavailable).filter(([, time]) => now - time < HIDDEN_FOR_MS));
  if (Object.keys(active).length !== Object.keys(unavailable).length) {
    await AsyncStorage.setItem(KEY, JSON.stringify(active));
  }
  return channels.filter((channel) => !active[`${channel.id}|${channel.url}`]);
}
