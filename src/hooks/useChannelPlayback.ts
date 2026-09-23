import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Channel } from '@/types/iptv';
import { getChannelSources } from '@/services/iptv';
import { nextAvailableSource } from '@/services/playback';
import { preferredSource, PROVIDER_REFRESH_MS, refreshChannelSources, rememberWorkingSource } from '@/services/providerCatalog';

export function useChannelPlayback(initial: Channel) {
  const [channel, setChannel] = useState(initial);
  const [url, setUrl] = useState(initial.url);
  const [retryToken, setRetryToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Conectando…');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const failed = useRef(new Set<string>());
  const recovering = useRef(false);
  const refreshedAfterFailure = useRef(false);
  const playing = useRef(false);
  const alive = useRef(true);
  const generation = useRef(0);
  const current = useRef({ channel, url });
  current.current = { channel, url };

  const select = (nextUrl: string) => {
    generation.current += 1;
    recovering.current = false;
    playing.current = false;
    setUrl(nextUrl);
    setError(null);
    setStatus('Conectando…');
    setRetryToken(value => value + 1);
  };

  useEffect(() => {
    alive.current = true;
    const initialGeneration = generation.current;
    void preferredSource(initial).then(preferred => {
      if (alive.current && preferred && !playing.current && !recovering.current && generation.current === initialGeneration) select(preferred);
    }).catch(() => {});
    const update = () => {
      void refreshChannelSources(current.current.channel).then(latest => {
        if (!alive.current) return;
        setChannel(latest);
        setUpdatedAt(Date.now());
      }).catch(() => {});
    };
    update();
    const timer = setInterval(update, PROVIDER_REFRESH_MS);
    const subscription = AppState.addEventListener('change', state => { if (state === 'active') update(); });
    return () => { alive.current = false; clearInterval(timer); subscription.remove(); };
  }, [initial.id, initial.countryCode]);

  const handleError = async (message: string) => {
    if (recovering.current) return;
    recovering.current = true;
    playing.current = false;
    const requestGeneration = generation.current;
    failed.current.add(url);
    let latest = current.current.channel;
    let next = nextAvailableSource(getChannelSources(latest), failed.current);
    if (!next && !refreshedAfterFailure.current) {
      refreshedAfterFailure.current = true;
      setStatus('Atualizando fontes…');
      latest = await refreshChannelSources(latest, true).catch(() => latest);
      if (!alive.current || generation.current !== requestGeneration) return;
      setChannel(latest);
      next = nextAvailableSource(getChannelSources(latest), failed.current);
    }
    if (next) { select(next.url); return; }
    setStatus('Sem sinal');
    setError(`${message} Todas as fontes disponíveis foram tentadas.`);
  };

  const handlePlaying = () => {
    if (playing.current || recovering.current) return;
    playing.current = true;
    setStatus('Ao vivo');
    setError(null);
    void rememberWorkingSource(channel, url).catch(() => {});
  };

  const sources = getChannelSources(channel);
  const activeSource = sources.find(source => source.url === url) || getChannelSources(initial).find(source => source.url === url);
  const activeChannel = { ...channel, url, referrer: activeSource?.referrer, userAgent: activeSource?.userAgent };
  return {
    channel, sources, activeChannel, retryToken, error, status, updatedAt,
    selectSource: (nextUrl: string) => { failed.current.delete(nextUrl); select(nextUrl); },
    retry: () => { failed.current.clear(); refreshedAfterFailure.current = false; select(sources[0]?.url || initial.url); },
    handlePlaying, handleError
  };
}
