import React, { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useEventListener } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import type { Channel } from '@/types/iptv';

export function StreamPlayer({ channel, onError, onPlaying, retryToken = 0 }: { channel: Channel; onError?: (message: string) => void; onPlaying?: () => void; retryToken?: number }) {
  const callbacks = useRef({ onError, onPlaying });
  callbacks.current = { onError, onPlaying };
  const progress = useRef({ time: -1, changedAt: Date.now(), started: false, failed: false });
  const fail = (message: string) => {
    if (progress.current.failed) return;
    progress.current.failed = true;
    callbacks.current.onError?.(message);
  };
  const source = useMemo<VideoSource>(() => ({
    uri: channel.url,
    contentType: channel.url.includes('.m3u8') ? 'hls' : 'auto',
    headers: {
      ...(channel.referrer ? { Referer: channel.referrer } : {}),
      ...(channel.userAgent ? { 'User-Agent': channel.userAgent } : {})
    },
    metadata: { title: channel.name, artwork: channel.logo }
  }), [channel, retryToken]);

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.keepScreenOnWhilePlaying = true;
    instance.timeUpdateEventInterval = 1;
    instance.play();
  });

  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'error') fail(error?.message || 'O sinal não pôde ser reproduzido.');
  });
  useEventListener(player, 'timeUpdate', ({ currentTime }) => {
    if (currentTime <= 0 || currentTime === progress.current.time || progress.current.failed) return;
    progress.current.time = currentTime;
    progress.current.changedAt = Date.now();
    progress.current.started = true;
    callbacks.current.onPlaying?.();
  });

  useEffect(() => {
    player.play();
    const watchdog = setInterval(() => {
      if (progress.current.failed) return;
      if (progress.current.started && !player.playing && player.status !== 'loading') {
        progress.current.changedAt = Date.now();
        return;
      }
      if (Date.now() - progress.current.changedAt > 20000) fail('A fonte não enviou vídeo por 20 segundos.');
    }, 1000);
    return () => clearInterval(watchdog);
  }, [player, retryToken]);

  return (
    <View style={styles.wrap}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        startsPictureInPictureAutomatically
        onFullscreenEnter={() => void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE)}
        onFullscreenExit={() => void ScreenOrientation.unlockAsync()}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: '#000' }, video: { width: '100%', height: '100%' } });
