import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '@/theme/tokens';
import type { Channel } from '@/types/iptv';

export function StreamPlayer({ channel, onError, onPlaying, retryToken = 0 }: { channel: Channel; onError?: (message: string) => void; onPlaying?: () => void; retryToken?: number }) {
  const ref = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    setError(null);
    let hls: Hls | null = null;
    const isHls = channel.url.toLowerCase().includes('.m3u8');

    if (isHls && Hls.isSupported()) {
      hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hls.loadSource(channel.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().then(() => onPlaying?.()).catch(() => setError('Reprodução automática bloqueada. Pressione Play para iniciar.')));
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          const message = 'Este stream não pôde ser aberto no navegador. Pode haver bloqueio de CORS ou geográfico.';
          setError(message);
          onError?.(message);
        }
      });
    } else {
      video.src = channel.url;
      void video.play().then(() => onPlaying?.()).catch(() => setError('Reprodução automática bloqueada. Pressione Play para iniciar.'));
    }

    return () => {
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
        onPlay: onPlaying,
        onError: () => onError?.('O navegador não conseguiu carregar este sinal.'),
        style: { width: '100%', height: '100%', background: '#000', objectFit: 'contain' }
      })}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', position: 'relative' },
  error: { position: 'absolute', left: 16, right: 16, bottom: 16, color: colors.text, backgroundColor: '#000000CC', padding: 12, borderRadius: 12 }
});
