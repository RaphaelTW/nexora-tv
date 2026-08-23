import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { ChannelCard } from '@/components/ChannelCard';
import { useApp } from '@/state/AppContext';
import { colors, spacing } from '@/theme/tokens';

export default function FavoritesScreen() {
  const { favorites } = useApp();
  return (
    <AppShell title="YOUR SIGNALS" scroll={false}>
      <FlatList
        data={favorites}
        keyExtractor={(channel) => `${channel.id}-${channel.url}`}
        renderItem={({ item }) => <View style={styles.item}><ChannelCard channel={item} queue={favorites} /></View>}
        ListHeaderComponent={<><Text style={styles.title}>Favoritos</Text><Text style={styles.sub}>Seus canais ficam salvos somente neste dispositivo.</Text></>}
        ListEmptyComponent={<Text style={styles.empty}>Você ainda não favoritou nenhum canal.</Text>}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        windowSize={7}
        removeClippedSubviews
      />
    </AppShell>
  );
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 38, fontWeight: '900', marginTop: spacing.lg },
  sub: { color: colors.muted, marginTop: 8, marginBottom: 22 },
  list: { paddingBottom: spacing.xxl },
  item: { marginBottom: 10 },
  empty: { color: colors.muted, paddingVertical: 60, textAlign: 'center' }
});
