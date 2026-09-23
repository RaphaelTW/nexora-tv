import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StreamPlayer } from '@/components/StreamPlayer';
import { useApp } from '@/state/AppContext';
import { colors, gradients, radius, spacing } from '@/theme/tokens';
import { markChannelUnavailable } from '@/services/channelHealth';
import { useChannelPlayback } from '@/hooks/useChannelPlayback';
import { playerDimensions } from '@/services/playback';
import { WebMetadata } from '@/components/WebMetadata';

export default function PlayerScreen() {
  const { currentChannel } = useApp();
  if (!currentChannel) {
    return <View style={styles.center}><Text style={styles.emptyTitle}>Nenhum canal selecionado</Text><Pressable onPress={() => router.replace('/' as never)}><Text style={styles.link}>Voltar ao início</Text></Pressable></View>;
  }
  return <ActivePlayer key={currentChannel.id} />;
}

function ActivePlayer() {
  const { currentChannel: selectedChannel, currentQueue, setCurrentChannel, recordWatch, toggleFavorite, isFavorite } = useApp();
  const currentChannel = selectedChannel!;
  const { width, height } = useWindowDimensions();
  const compact = width < 700;
  const horizontalPadding = compact ? spacing.md : spacing.lg;
  const dimensions = playerDimensions(width, height, horizontalPadding);
  const playerWidth = dimensions.width;
  const favorite = isFavorite(currentChannel.id);
  const playback = useChannelPlayback(currentChannel);
  const { activeChannel, sources, retryToken, error: playerError, retry, handlePlaying, handleError } = playback;
  const sourceIndex = sources.findIndex(source => source.url === activeChannel.url);
  const selectSource = (index: number) => playback.selectSource(sources[index].url);
  const tryAlternative = () => selectSource((sourceIndex + 1) % sources.length);
  const changeChannel = async (direction: -1 | 1) => {
    const index = currentQueue.findIndex(channel => channel.id === currentChannel.id);
    const next = currentQueue[(Math.max(0, index) + direction + currentQueue.length) % currentQueue.length];
    if (next) { await setCurrentChannel(next, currentQueue); await recordWatch(next); }
  };
  const hideUnavailable = async () => {
    await markChannelUnavailable(activeChannel);
    router.back();
  };
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <WebMetadata title={`${currentChannel.name} — Nexora TV`} description={`Assista ${currentChannel.name} ao vivo no Nexora TV.`} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingHorizontal: horizontalPadding }]}>
      <View style={styles.top}><Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}><Text style={styles.back}>← VOLTAR</Text></Pressable><Text style={styles.brand}>NEXORA PLAYER</Text></View>
      <View style={[styles.playerFrame, { width: playerWidth, height: dimensions.height }]}><LinearGradient colors={gradients.brand} style={styles.playerBorder}><View style={styles.playerInner}><StreamPlayer key={`${activeChannel.url}|${retryToken}`} channel={activeChannel} retryToken={retryToken} onPlaying={handlePlaying} onError={handleError} /></View></LinearGradient></View>
      <View style={[styles.details, { width: playerWidth }]}>
        <View style={styles.playerActions}>
          {currentQueue.length > 1 ? <Pressable focusable onPress={() => void changeChannel(-1)} style={styles.favorite}><Text style={styles.favoriteText}>← ANTERIOR</Text></Pressable> : null}
          <Pressable focusable onPress={() => void toggleFavorite(currentChannel)} style={styles.favorite}><Text style={styles.favoriteText}>{favorite ? '♥ FAVORITO' : '♡ FAVORITAR'}</Text></Pressable>
          {currentQueue.length > 1 ? <Pressable focusable onPress={() => void changeChannel(1)} style={styles.favorite}><Text style={styles.favoriteText}>PRÓXIMO →</Text></Pressable> : null}
        </View>
      {sources.length > 0 ? <ScrollView horizontal style={{ flexGrow: 0, height: 58, marginTop: 8 }} contentContainerStyle={{ gap: 8, alignItems: 'center' }}>
        {sources.map((source, index) => <Pressable key={source.url} focusable accessibilityRole="button" accessibilityState={{ selected: index === sourceIndex }} onPress={() => selectSource(index)} style={[styles.favorite, index === sourceIndex && { borderColor: colors.green }]}>
          <Text style={styles.favoriteText}>FONTE {index + 1} / {source.provider}</Text>
        </Pressable>)}
      </ScrollView> : null}
      {playerError ? (
        <View style={styles.offlineBox}>
          <Text style={styles.offlineTitle}>Canal indisponível</Text>
          <Text style={styles.offlineText}>{playerError}</Text>
          <View style={styles.offlineActions}>
            <Pressable focusable onPress={retry} style={styles.offlineButton}><Text style={styles.offlineButtonText}>TENTAR NOVAMENTE</Text></Pressable>
            {sourceIndex < sources.length - 1 ? <Pressable focusable onPress={tryAlternative} style={styles.offlineButton}><Text style={styles.offlineButtonText}>TENTAR FONTE {sourceIndex + 2}</Text></Pressable> : null}
            <Pressable focusable onPress={() => void hideUnavailable()} style={[styles.offlineButton, styles.reportButton]}><Text style={styles.reportText}>OCULTAR POR 6 HORAS</Text></Pressable>
          </View>
        </View>
      ) : null}
      <View style={styles.info}>
        <Text style={styles.live}>{playback.status}</Text><Text style={[styles.title, compact && styles.titleCompact]} numberOfLines={2}>{currentChannel.name}</Text><Text style={styles.meta} numberOfLines={2}>{currentChannel.flag || '🌍'} {currentChannel.countryName || currentChannel.countryCode} · {currentChannel.group || 'Geral'}{currentChannel.quality ? ` · ${currentChannel.quality}` : ''}</Text>
      </View>
      <Text style={styles.note}>Fontes: IPTV-org, Free-TV e TDTChannels. Catálogo atualizado e salvo automaticamente no aparelho. A disponibilidade do sinal depende do provedor original. Geobloqueio, CORS e indisponibilidade temporária podem impedir alguns canais.</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  content: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.md },
  top: { width: '100%', maxWidth: 1500, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  back: { color: colors.green, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  backButton: { minWidth: 88, minHeight: 44, justifyContent: 'center' },
  brand: { color: colors.muted, fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  playerFrame: { flexGrow: 0, flexShrink: 0, maxWidth: 1500, alignSelf: 'center' },
  playerBorder: { flex: 1, padding: 2, borderRadius: radius.lg },
  playerInner: { flex: 1, backgroundColor: colors.black, borderRadius: radius.lg - 2, overflow: 'hidden' },
  details: { flexGrow: 0, flexShrink: 0, maxWidth: 1500, alignSelf: 'center' },
  info: { width: '100%', paddingTop: spacing.md, alignItems: 'center' },
  live: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.6 },
  title: { color: colors.text, fontWeight: '900', fontSize: 28, marginTop: 6, textAlign: 'center' },
  titleCompact: { fontSize: 21 },
  meta: { color: colors.muted, marginTop: 5, fontSize: 12, textAlign: 'center' },
  favorite: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: '#242424', borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 9 },
  favoriteText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  playerActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, paddingTop: spacing.sm },
  note: { color: '#555', fontSize: 10, lineHeight: 14, maxWidth: 1000, alignSelf: 'center', textAlign: 'center', marginTop: spacing.md },
  offlineBox: { width: '100%', alignSelf: 'center', borderWidth: 1, borderColor: '#4A2228', backgroundColor: '#15080B', borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  offlineTitle: { color: colors.red, fontSize: 18, fontWeight: '900' },
  offlineText: { color: colors.muted, marginTop: 6 },
  offlineActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  offlineButton: { minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: '#333', borderRadius: radius.pill, paddingHorizontal: 16 },
  offlineButtonText: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  reportButton: { borderColor: '#4A2228' },
  reportText: { color: colors.red, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  center: { flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', gap: 14 },
  emptyTitle: { color: colors.text, fontSize: 20, fontWeight: '900' },
  link: { color: colors.green }
});
