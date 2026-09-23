import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';
import type { Channel } from '@/types/iptv';

export function StreamPlayer({ channel, onError, onPlaying, retryToken = 0 }: { channel: Channel; onError?: (message: string) => void; onPlaying?: () => void; retryToken?: number }) {
  const ref = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);
  const callbacks = useRef({ onError, onPlaying });
  callbacks.current = { onError, onPlaying };

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setError(null);
    let hls: Hls | null = null;
    let failed = false;
    let watchdog: ReturnType<typeof setTimeout>;
    const clearWatchdog = () => clearTimeout(watchdog);
    const armWatchdog = () => {
      clearWatchdog();
      watchdog = setTimeout(() => {
        if (!failed) { failed = true; callbacks.current.onError?.('A fonte não enviou vídeo por 20 segundos.'); }
      }, 20000);
    };
    const playing = () => { clearWatchdog(); callbacks.current.onPlaying?.(); };
    video.addEventListener('playing', playing);
    video.addEventListener('waiting', armWatchdog);
    video.addEventListener('pause', clearWatchdog);
    armWatchdog();
    const isHls = channel.url.toLowerCase().includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => { clearWatchdog(); setError('Pressione Play para iniciar.'); }));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          const message = 'Este stream não pôde ser aberto no navegador. Pode haver bloqueio de CORS ou geográfico.';
          setError(message);
          if (!failed) { failed = true; callbacks.current.onError?.(message); }
        }
      });
    } else {
      video.src = channel.url;
      void video.play().catch(() => { clearWatchdog(); setError('Pressione Play para iniciar.'); });
    }

    return () => {
      clearWatchdog();
      video.removeEventListener('playing', playing);
      video.removeEventListener('waiting', armWatchdog);
      video.removeEventListener('pause', clearWatchdog);
      hls?.destroy();
      video.removeAttribute('src');
      video.load();
    };
  }, [channel.url, retryToken]);

  return (
    <View style={styles.wrap}>
      {React.createElement('video', {
        ref,
        controls: true,
        autoPlay: true,
        playsInline: true,
        onError: () => onError?.('O navegador não conseguiu carregar este sinal.'),
        style: { width: '100%', height: '100%', background: '#000', objectFit: 'contain' }
      })}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000' },
  error: { position: 'absolute', left: 16, right: 16, bottom: 16, color: colors.text, backgroundColor: '#000000CC', padding: 12, borderRadius: 12 }
});
