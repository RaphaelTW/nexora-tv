import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FocusCard } from './FocusCard';
import { GradientBorder } from './GradientBorder';
import { colors, radius, spacing } from '@/theme/tokens';
import { useApp } from '@/state/AppContext';
import type { Channel } from '@/types/iptv';

export function ChannelCard({ channel }: { channel: Channel }) {
  const { isFavorite, toggleFavorite, setCurrentChannel, recordWatch } = useApp();
  const favorite = isFavorite(channel.id);

  const play = async () => {
    await setCurrentChannel(channel);
    await recordWatch(channel);
    router.push(`/player/${encodeURIComponent(channel.id)}` as never);
  };

  return (
    <FocusCard onPress={play}>
      {({ focused }: any) => (
        <GradientBorder focused={focused} radiusValue={radius.md} style={styles.border}>
          <View style={styles.card}>
            <View style={styles.logoWrap}>
              {channel.logo ? (
                <Image source={{ uri: channel.logo }} style={styles.logo} resizeMode="contain" />
              ) : (
                <Text style={styles.logoFallback}>◉</Text>
              )}
            </View>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={2}>{channel.name}</Text>
              <Text style={styles.meta} numberOfLines={1}>{channel.group || 'Geral'} · AO VIVO</Text>
            </View>
            <Text
              style={[styles.favorite, favorite && styles.favoriteActive]}
              onPress={(event) => { event.stopPropagation?.(); void toggleFavorite(channel); }}
            >
              {favorite ? '♥' : '♡'}
            </Text>
          </View>
        </GradientBorder>
      )}
    </FocusCard>
  );
}

const styles = StyleSheet.create({
  border: { minHeight: 112 },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.md },
  logoWrap: { width: 64, height: 64, borderRadius: 16, backgroundColor: colors.panelElevated, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  logo: { width: 54, height: 54 },
  logoFallback: { color: colors.green, fontSize: 30 },
  info: { flex: 1, gap: 6 },
  name: { color: colors.text, fontSize: 16, fontWeight: '800' },
  meta: { color: colors.muted, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase' },
  favorite: { color: colors.muted, fontSize: 25, padding: 8 },
  favoriteActive: { color: colors.green }
});
