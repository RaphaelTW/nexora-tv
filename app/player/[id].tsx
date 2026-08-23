import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StreamPlayer } from '@/components/StreamPlayer';
import { useApp } from '@/state/AppContext';
import { colors, gradients, radius, spacing } from '@/theme/tokens';
import { markChannelUnavailable } from '@/services/channelHealth';
import { WebMetadata } from '@/components/WebMetadata';

export default function PlayerScreen() {
  const { currentChannel, currentQueue, setCurrentChannel, recordWatch, toggleFavorite, isFavorite } = useApp();
  const { width, height } = useWindowDimensions();
  if (!currentChannel) {
    return <View style={styles.center}><Text style={styles.emptyTitle}>Nenhum canal selecionado</Text><Pressable onPress={() => router.replace('/' as never)}><Text style={styles.link}>Voltar ao início</Text></Pressable></View>;
  }
  const favorite = isFavorite(currentChannel.id);
  const sources = useMemo(() => [currentChannel.url, ...(currentChannel.alternativeUrls || [])], [currentChannel]);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [retryToken, setRetryToken] = useState(0);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [playerError, setPlayerError] = useState<string | null>(currentChannel.probeStatus === 'offline' ? 'A verificação rápida não conseguiu acessar esta fonte. Você ainda pode tentar reproduzi-la ou usar uma alternativa.' : null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeChannel = { ...currentChannel, url: sources[sourceIndex] || currentChannel.url };

  useEffect(() => {
    setSourceIndex(0);
    setReconnectAttempt(0);
    setPlayerError(null);
    setRetryToken((value) => value + 1);
    return () => { if (reconnectTimer.current) clearTimeout(reconnectTimer.current); };
  }, [currentChannel.id, currentChannel.url]);

  const retry = () => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = null;
    setReconnectAttempt(0);
    setPlayerError(null);
    setRetryToken((value) => value + 1);
  };

  const handlePlaying = () => {
    if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    reconnectTimer.current = null;
    setReconnectAttempt(0);
    setPlayerError(null);
  };

  const handleError = (message: string) => {
    if (reconnectTimer.current) return;
    if (reconnectAttempt < 3) {
      const nextAttempt = reconnectAttempt + 1;
      setReconnectAttempt(nextAttempt);
      setPlayerError(`Reconectando ${nextAttempt}/3…`);
      reconnectTimer.current = setTimeout(() => {
        reconnectTimer.current = null;
        setRetryToken((value) => value + 1);
      }, 1500 * nextAttempt);
      return;
    }
    setPlayerError(message);
  };

  const changeChannel = async (direction: -1 | 1) => {
    if (!currentQueue.length) return;
    const index = currentQueue.findIndex((channel) => channel.id === currentChannel.id && channel.url === currentChannel.url);
    const next = currentQueue[(Math.max(0, index) + direction + currentQueue.length) % currentQueue.length];
    if (!next) return;
    await setCurrentChannel(next, currentQueue);
    await recordWatch(next);
  };

  const tryAlternative = () => {
    setPlayerError(null);
    setSourceIndex((value) => Math.min(value + 1, sources.length - 1));
    setRetryToken((value) => value + 1);
  };

  const hideUnavailable = async () => {
    await markChannelUnavailable(activeChannel);
    router.back();
  };
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <WebMetadata title={`${currentChannel.name} — Nexora TV`} description={`Assista ${currentChannel.name} ao vivo no Nexora TV.`} />
      <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.top}><Pressable onPress={() => router.back()} hitSlop={12} style={styles.backButton}><Text style={styles.back}>← VOLTAR</Text></Pressable><Text style={styles.brand}>NEXORA PLAYER</Text></View>
      <View style={[styles.playerFrame, Platform.OS === 'web' && { maxWidth: Math.min(1500, width - 36, Math.max(320, (height - 190) * 16 / 9)) }]}><LinearGradient colors={gradients.brand} style={styles.playerBorder}><View style={styles.playerInner}><StreamPlayer channel={activeChannel} retryToken={retryToken} onPlaying={handlePlaying} onError={handleError} /></View></LinearGradient></View>
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
        <View style={styles.left}><Text style={styles.live}>● AO VIVO</Text><Text style={styles.title}>{currentChannel.name}</Text><Text style={styles.meta}>{currentChannel.flag || '🌍'} {currentChannel.countryName || currentChannel.countryCode} · {currentChannel.group || 'Geral'}{currentChannel.quality ? ` · ${currentChannel.quality}` : ''}</Text></View>
        <View style={styles.playerActions}>
          {currentQueue.length > 1 ? <Pressable focusable onPress={() => void changeChannel(-1)} style={styles.favorite}><Text style={styles.favoriteText}>← ANTERIOR</Text></Pressable> : null}
          <Pressable focusable onPress={() => void toggleFavorite(currentChannel)} style={styles.favorite}><Text style={styles.favoriteText}>{favorite ? '♥ FAVORITO' : '♡ FAVORITAR'}</Text></Pressable>
          {currentQueue.length > 1 ? <Pressable focusable onPress={() => void changeChannel(1)} style={styles.favorite}><Text style={styles.favoriteText}>PRÓXIMO →</Text></Pressable> : null}
        </View>
      </View>
      <Text style={styles.note}>A disponibilidade do sinal depende do provedor original. Geobloqueio, CORS e indisponibilidade temporária podem impedir alguns canais.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.black },
  content: { flexGrow: 1, padding: spacing.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 },
  back: { color: colors.green, fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  backButton: { minWidth: 88, minHeight: 44, justifyContent: 'center' },
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
  playerActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  note: { color: '#555', fontSize: 10, lineHeight: 16, maxWidth: 1000, alignSelf: 'center', textAlign: 'center' },
  offlineBox: { width: '100%', maxWidth: 1500, alignSelf: 'center', borderWidth: 1, borderColor: '#4A2228', backgroundColor: '#15080B', borderRadius: radius.md, padding: spacing.md, marginTop: 14 },
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
