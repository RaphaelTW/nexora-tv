import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { VideoView, useVideoPlayer, type VideoSource } from 'expo-video';
import type { Channel } from '@/types/iptv';

export function StreamPlayer({ channel }: { channel: Channel }) {
  const source = useMemo<VideoSource>(() => ({
    uri: channel.url,
    contentType: channel.url.includes('.m3u8') ? 'hls' : 'auto',
    headers: {
      ...(channel.referrer ? { Referer: channel.referrer } : {}),
      ...(channel.userAgent ? { 'User-Agent': channel.userAgent } : {})
    },
    metadata: { title: channel.name, artwork: channel.logo }
  }), [channel]);

  const player = useVideoPlayer(source, (instance) => {
    instance.loop = false;
    instance.play();
  });

  return (
    <View style={styles.wrap}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls
        fullscreenOptions={{ enable: true }}
        allowsPictureInPicture
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({ wrap: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' }, video: { flex: 1 } });
