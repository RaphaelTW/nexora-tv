import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { Channel } from '@/types/iptv';
import { getChannelSources } from '@/services/iptv';
import { nextAvailableSource } from '@/services/playback';
import { preferredSource, PROVIDER_REFRESH_MS, refreshChannelSources, rememberWorkingSource } from '@/services/providerCatalog';
import { CHANNEL_UNAVAILABLE_MESSAGE, RETRY_DELAYS_MS, diagnosePlaybackFailure, shouldRetryPlaybackFailure, type PlaybackFailure } from '@/services/playbackDiagnostics';
import { markChannelSourceUnavailable } from '@/services/channelHealth';
import { testCatalogConnection } from '@/services/connectivity';
import { preferredHealthySource, recordSourceFailure, recordSourceSuccess } from '@/services/sourceHealth';

export function useChannelPlayback(initial: Channel) {
  const [channel, setChannel] = useState(initial);
  const [url, setUrl] = useState(initial.url);
  const [retryToken, setRetryToken] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Conectando…');
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [failures, setFailures] = useState<PlaybackFailure[]>([]);
  const [connectionHint, setConnectionHint] = useState<string | null>(null);
  const failed = useRef(new Set<string>());
  const recovering = useRef(false);
  const refreshedAfterFailure = useRef(false);
  const playing = useRef(false);
  const alive = useRef(true);
  const generation = useRef(0);
  const retryAttempt = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const current = useRef({ channel, url });
  current.current = { channel, url };

  const select = (nextUrl: string) => {
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    generation.current += 1;
    recovering.current = false;
    playing.current = false;
    setUrl(nextUrl);
    setError(null);
    setConnectionHint(null);
    setStatus('Conectando…');
    setRetryToken(value => value + 1);
  };

  useEffect(() => {
    alive.current = true;
    const initialGeneration = generation.current;
    void Promise.all([preferredSource(initial), preferredHealthySource(getChannelSources(initial))]).then(([known, healthy]) => {
      const preferred = known || healthy;
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
    return () => { alive.current = false; clearInterval(timer); subscription.remove(); if (retryTimer.current) clearTimeout(retryTimer.current); };
  }, [initial.id, initial.countryCode]);

  const restart = (nextChannel = current.current.channel, resetBackoff = true) => {
    if (retryTimer.current) { clearTimeout(retryTimer.current); retryTimer.current = null; }
    if (resetBackoff) retryAttempt.current = 0;
    failed.current.clear(); refreshedAfterFailure.current = false; setFailures([]); setChannel(nextChannel);
    select(getChannelSources(nextChannel)[0]?.url || initial.url);
  };

  const scheduleRetry = (kind: PlaybackFailure['kind']) => {
    if (!shouldRetryPlaybackFailure(kind, retryAttempt.current) || retryTimer.current) return;
    const delay = RETRY_DELAYS_MS[retryAttempt.current++];
    setStatus(`Tentando novamente em ${Math.round(delay / 1000)}s…`);
    retryTimer.current = setTimeout(() => {
      retryTimer.current = null;
      if (alive.current) restart(current.current.channel, false);
    }, delay);
  };

  const handleError = async (message: string) => {
    if (recovering.current) return;
    recovering.current = true;
    playing.current = false;
    const requestGeneration = generation.current;
    failed.current.add(url);
    let latest = current.current.channel;
    const source = getChannelSources(latest).find(item => item.url === url) || { url, provider: 'Fonte desconhecida' };
    const failure = diagnosePlaybackFailure(source, message);
    setFailures(items => items.some(item => item.source.url === url) ? items : [...items, failure]);
    void recordSourceFailure(source, failure.kind).catch(() => {});
    if (failure.kind === 'forbidden') void markChannelSourceUnavailable(latest, url).catch(() => {});
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
    setError(CHANNEL_UNAVAILABLE_MESSAGE);
    scheduleRetry(failure.kind);
  };

  const handlePlaying = () => {
    if (playing.current || recovering.current) return;
    playing.current = true;
    setStatus('Ao vivo');
    setError(null);
    retryAttempt.current = 0;
    const source = getChannelSources(channel).find(item => item.url === url);
    if (source) void recordSourceSuccess(source).catch(() => {});
    void rememberWorkingSource(channel, url).catch(() => {});
  };

  const sources = getChannelSources(channel);
  const activeSource = sources.find(source => source.url === url) || getChannelSources(initial).find(source => source.url === url);
  const activeChannel = { ...channel, url, referrer: activeSource?.referrer, userAgent: activeSource?.userAgent };
  return {
    channel, sources, activeChannel, retryToken, error, status, updatedAt, failures, connectionHint,
    selectSource: (nextUrl: string) => { failed.current.delete(nextUrl); select(nextUrl); },
    retry: () => restart(),
    refreshSources: async () => {
      setStatus('Atualizando fontes…');
      const latest = await refreshChannelSources(current.current.channel, true).catch(() => null);
      if (!latest) { setConnectionHint('Não foi possível atualizar o catálogo agora. Verifique sua internet e tente novamente.'); return; }
      restart(latest);
    },
    checkConnection: async () => {
      setConnectionHint('Testando conexão…');
      const online = await testCatalogConnection();
      setConnectionHint(online ? 'Sua internet está funcionando. Este canal ou provedor está indisponível agora.' : 'Não foi possível acessar a internet. Verifique o Wi‑Fi ou dados móveis e tente novamente.');
    },
    handlePlaying, handleError
  };
}
