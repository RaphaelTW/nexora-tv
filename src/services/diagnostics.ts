import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'nexora:diagnostics';
export type Diagnostic = { at: string; area: string; message: string };

export async function recordDiagnostic(area: string, error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const sanitized = message.replace(/https?:\/\/\S+/gi, '[url]').slice(0, 300);
  const raw = await AsyncStorage.getItem(KEY);
  let previous: Diagnostic[] = [];
  try { previous = raw ? JSON.parse(raw) as Diagnostic[] : []; } catch { /* ignore corrupt local log */ }
  const next = [{ at: new Date().toISOString(), area, message: sanitized }, ...previous].slice(0, 30);
  await AsyncStorage.setItem(KEY, JSON.stringify(next));
}

export async function getDiagnostics() {
  const raw = await AsyncStorage.getItem(KEY);
  try { return raw ? JSON.parse(raw) as Diagnostic[] : []; } catch { return []; }
}
