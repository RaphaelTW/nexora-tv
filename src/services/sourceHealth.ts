import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChannelSource } from '@/types/iptv';
import type { PlaybackFailureKind } from './playbackDiagnostics';

const KEY = 'nexora:source-health';
const MAX_ENTRIES = 120;

export type SourceHealth = { successes: number; failures: number; lastSuccessAt?: number; lastFailureAt?: number; lastFailureKind?: PlaybackFailureKind };
type HealthMap = Record<string, SourceHealth>;

function key(source: ChannelSource) { return `${source.provider}|${source.url}`; }

async function readHealth(): Promise<HealthMap> {
  try { return JSON.parse((await AsyncStorage.getItem(KEY)) || '{}') as HealthMap; } catch { return {}; }
}

async function writeHealth(health: HealthMap) {
  const entries = Object.entries(health).sort(([, left], [, right]) => Math.max(right.lastSuccessAt || 0, right.lastFailureAt || 0) - Math.max(left.lastSuccessAt || 0, left.lastFailureAt || 0)).slice(0, MAX_ENTRIES);
  await AsyncStorage.setItem(KEY, JSON.stringify(Object.fromEntries(entries)));
}

export async function recordSourceSuccess(source: ChannelSource) {
  const health = await readHealth();
  const previous = health[key(source)] || { successes: 0, failures: 0 };
  health[key(source)] = { ...previous, successes: previous.successes + 1, lastSuccessAt: Date.now() };
  await writeHealth(health);
}

export async function recordSourceFailure(source: ChannelSource, kind: PlaybackFailureKind) {
  const health = await readHealth();
  const previous = health[key(source)] || { successes: 0, failures: 0 };
  health[key(source)] = { ...previous, failures: previous.failures + 1, lastFailureAt: Date.now(), lastFailureKind: kind };
  await writeHealth(health);
}

export async function preferredHealthySource(sources: ChannelSource[]) {
  const health = await readHealth();
  return [...sources].sort((left, right) => {
    const leftHealth = health[key(left)] || { successes: 0, failures: 0 };
    const rightHealth = health[key(right)] || { successes: 0, failures: 0 };
    const leftScore = leftHealth.successes * 3 - leftHealth.failures * 2 + ((leftHealth.lastSuccessAt || 0) > (leftHealth.lastFailureAt || 0) ? 1 : 0);
    const rightScore = rightHealth.successes * 3 - rightHealth.failures * 2 + ((rightHealth.lastSuccessAt || 0) > (rightHealth.lastFailureAt || 0) ? 1 : 0);
    return rightScore - leftScore;
  })[0]?.url;
}
