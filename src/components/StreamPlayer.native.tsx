import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useEventListener } from 'expo';
import * as ScreenOrientation from 'expo-screen-orientation';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import type { Channel } from '@/types/iptv';

export function StreamPlayer({ channel, onError, onPlaying, retryToken = 0 }: { channel: Channel; onError?: (message: string) => void; onPlaying?: () => void; retryToken?: number }) {
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
    instance.play();
  });

  useEventListener(player, 'statusChange', ({ status, error }) => {
    if (status === 'error') onError?.(error?.message || 'O sinal não pôde ser reproduzido.');
    if (status === 'readyToPlay') onPlaying?.();
  });
  useEventListener(player, 'playingChange', ({ isPlaying }) => {
    if (isPlaying) onPlaying?.();
  });

  useEffect(() => {
    player.play();
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

const styles = StyleSheet.create({ wrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }, video: { flex: 1 } });
