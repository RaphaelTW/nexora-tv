import { useCallback, useEffect, useState } from 'react';
import { fetchCountryChannels } from '@/services/iptv';
import { readCache, writeCache } from '@/services/cache';
import type { Channel } from '@/types/iptv';
import { removeUnavailableChannels } from '@/services/channelHealth';
import { recordPerformance } from '@/services/performance';

export function useCountryChannels(code: string) {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (foreground = true) => {
    if (foreground) setRefreshing(true);
    setError(null);
    try {
      const latest = await fetchCountryChannels(code);
      const available = await removeUnavailableChannels(latest);
      setChannels(available);
      await writeCache(`country:${code.toUpperCase()}`, latest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível carregar a playlist');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [code]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setChannels([]);
    (async () => {
      const startedAt = Date.now();
      const cached = await readCache<Channel[]>(`country:${code.toUpperCase()}`, 6 * 60 * 60 * 1000);
      if (!active) return;
      if (cached?.data) {
        setChannels(cached.data);
        setLoading(false);
      }
      if (!cached?.data) await refresh(true);
      await recordPerformance(`country:${code}`, startedAt);
    })();
    return () => { active = false; };
  }, [code, refresh]);

  return { channels, loading, refreshing, error, refresh: () => refresh(true) };
}
