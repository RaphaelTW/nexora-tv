import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CacheEnvelope } from '@/types/iptv';

export const CACHE_PREFIX = 'nexora:';

export async function readCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as CacheEnvelope<T>;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, data: T) {
  const value: CacheEnvelope<T> = { savedAt: Date.now(), data };
  await AsyncStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
}

export async function removeAllNexoraData() {
  const keys = await AsyncStorage.getAllKeys();
  const ours = keys.filter((key) => key.startsWith(CACHE_PREFIX));
  if (ours.length) await AsyncStorage.multiRemove(ours);
}
