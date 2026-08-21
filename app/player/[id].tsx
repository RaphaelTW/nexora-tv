import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StreamPlayer } from '@/components/StreamPlayer';
import { useApp } from '@/state/AppContext';
import { colors, gradients, radius, spacing } from '@/theme/tokens';

export default function PlayerScreen() {
  const { currentChannel, toggleFavorite, isFavorite } = useApp();
  if (!currentChannel) {
    return <View style={styles.center}><Text style={styles.emptyTitle}>Nenhum canal selecionado</Text><Pressable onPress={() => router.replace('/' as never)}><Text style={styles.link}>Voltar ao início</Text></Pressable></View>;
  }
  const favorite = isFavorite(currentChannel.id);
  return (
    <View style={styles.root}>
      <View style={styles.top}><Text onPress={() => router.back()} style={styles.back}>← VOLTAR</Text><Text style={styles.brand}>NEXORA PLAYER</Text></View>
      <View style={styles.playerFrame}><LinearGradient colors={gradients.brand} style={styles.playerBorder}><View style={styles.playerInner}><StreamPlayer channel={currentChannel} /></View></LinearGradient></View>
      <View style={styles.info}>
        <View style={styles.left}><Text style={styles.live}>● AO VIVO</Text><Text style={styles.title}>{currentChannel.name}</Text><Text style={styles.meta}>{currentChannel.flag || '🌍'} {currentChannel.countryName || currentChannel.countryCode} · {currentChannel.group || 'Geral'}{currentChannel.quality ? ` · ${currentChannel.quality}` : ''}</Text></View>
        <Pressable onPress={() => void toggleFavorite(currentChannel)} style={styles.favorite}><Text style={styles.favoriteText}>{favorite ? '♥ FAVORITO' : '♡ FAVORITAR'}</Text></Pressable>
      </View>
      <Text style={styles.note}>A disponibilidade do sinal depende do provedor original. Geobloqueio, CORS e indisponibilidade temporária podem impedir alguns canais.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black, padding: spacing.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  back: { color: colors.green, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  brand: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  playerFrame: { width: '100%', maxWidth: 1500, alignSelf: 'center' },
  playerBorder: { padding: 2, borderRadius: radius.lg },
  playerInner: { backgroundColor: colors.black, borderRadius: radius.lg - 2, overflow: 'hidden' },
  info: { width: '100%', maxWidth: 1500, alignSelf: 'center', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 22, gap: 18 },
  left: { flex: 1 },
  live: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: colors.text, fontWeight: '900', fontSize: 28, marginTop: 8 },
  meta: { color: colors.muted, marginTop: 7, fontSize: 12 },
  favorite: { borderWidth: 1, borderColor: '#242424', borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 12 },
  favoriteText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  note: { color: '#555', fontSize: 10, lineHeight: 16, maxWidth: 1000, alignSelf: 'center', textAlign: 'center' },
  center: { flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  link: { color: colors.green }
});
