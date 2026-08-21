import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ChannelCard } from '@/components/ChannelCard';
import { useApp } from '@/state/AppContext';
import { colors, spacing } from '@/theme/tokens';

export default function FavoritesScreen() {
  const { favorites } = useApp();
  return (
    <AppShell title="YOUR SIGNALS">
      <Text style={styles.title}>Favoritos</Text>
      <Text style={styles.sub}>Seus canais ficam salvos somente neste dispositivo.</Text>
      <View style={styles.list}>{favorites.map((channel) => <ChannelCard key={`${channel.id}-${channel.url}`} channel={channel} />)}</View>
      {!favorites.length ? <Text style={styles.empty}>Você ainda não favoritou nenhum canal.</Text> : null}
    </AppShell>
  );
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 38, fontWeight: '900', marginTop: spacing.lg },
  sub: { color: colors.muted, marginTop: 8, marginBottom: 22 },
  list: { gap: 10 },
  empty: { color: colors.muted, paddingVertical: 60, textAlign: 'center' }
});
