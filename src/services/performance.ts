import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nexora:performance';
type Metric = { at: number; name: string; durationMs: number; memoryMb?: number };

export async function recordPerformance(name: string, startedAt: number) {
  const memory = typeof performance !== 'undefined' ? (performance as typeof performance & { memory?: { usedJSHeapSize: number } }).memory : undefined;
  const metric: Metric = { at: Date.now(), name, durationMs: Date.now() - startedAt, memoryMb: memory ? Math.round(memory.usedJSHeapSize / 1024 / 1024) : undefined };
  const raw = await AsyncStorage.getItem(KEY);
  let metrics: Metric[] = [];
  try { metrics = raw ? JSON.parse(raw) as Metric[] : []; } catch { /* ignore corrupt metrics */ }
  await AsyncStorage.setItem(KEY, JSON.stringify([metric, ...metrics].slice(0, 50)));
}
