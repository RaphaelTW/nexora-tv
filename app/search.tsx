import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { CountryCard } from '@/components/CountryCard';
import { ChannelCard } from '@/components/ChannelCard';
import { useApp } from '@/state/AppContext';
import { colors, radius, spacing } from '@/theme/tokens';
import { router, useLocalSearchParams } from 'expo-router';
import { loadGlobalChannelIndex, searchGlobalChannels } from '@/services/globalSearch';
import { recognizeSearchVoice } from '@/services/voiceSearch';
import type { Channel } from '@/types/iptv';

export default function SearchScreen() {
  const params = useLocalSearchParams<{ q?: string }>();
  const [query, setQuery] = useState(params.q || '');
  const [globalIndex, setGlobalIndex] = useState<Channel[]>([]);
  const [loadingGlobal, setLoadingGlobal] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [globalRequested, setGlobalRequested] = useState(false);
  const { countries, favorites, history, pinnedCountries, togglePinnedCountry } = useApp();
  const q = query.trim().toLowerCase();
  const countryResults = useMemo(() => q ? countries.filter((c) => `${c.name} ${c.code}`.toLowerCase().includes(q)).slice(0, 12) : [], [countries, q]);
  const channelPool = useMemo(() => [...favorites, ...history].filter((item, index, array) => array.findIndex((x) => x.id === item.id) === index), [favorites, history]);
  const channelResults = useMemo(() => q ? channelPool.filter((c) => `${c.name} ${c.group || ''}`.toLowerCase().includes(q)).slice(0, 20) : [], [channelPool, q]);
  const globalResults = useMemo(() => searchGlobalChannels(globalIndex, q).map((channel) => {
    const country = countries.find((item) => item.code === channel.countryCode);
    return { ...channel, countryName: country?.name, flag: country?.flag };
  }), [countries, globalIndex, q]);

  useEffect(() => {
    if (q.length < 2 || globalIndex.length || loadingGlobal || globalRequested) return;
    const timer = setTimeout(() => {
      setGlobalRequested(true);
      setLoadingGlobal(true); setGlobalError(null);
      void loadGlobalChannelIndex().then(setGlobalIndex).catch((error) => setGlobalError(error instanceof Error ? error.message : 'Falha ao carregar o índice global.')).finally(() => setLoadingGlobal(false));
    }, 350);
    return () => clearTimeout(timer);
  }, [globalIndex.length, globalRequested, loadingGlobal, q.length]);

  const voiceSearch = async () => {
    try {
      const value = await recognizeSearchVoice();
      if (value) { setQuery(value); router.setParams({ q: value }); }
    } catch (error) { Alert.alert('Busca por voz', error instanceof Error ? error.message : 'Não foi possível reconhecer a voz.'); }
  };
  return (
    <AppShell title="SEARCH THE SIGNAL">
      <Text style={styles.title}>Buscar</Text>
      <View style={styles.searchRow}><TextInput autoFocus value={query} onChangeText={(value) => { setQuery(value); router.setParams({ q: value || undefined }); }} placeholder="País, código ou qualquer canal..." placeholderTextColor="#666" style={styles.input} /><Pressable focusable accessibilityLabel="Buscar por voz" onPress={() => void voiceSearch()} style={styles.voice}><Text style={styles.voiceText}>● VOZ</Text></Pressable></View>
      {!q ? <Text style={styles.tip}>Pesquise países e todos os canais disponíveis no catálogo global. Você também pode usar o microfone ou o botão de voz do Android TV.</Text> : null}
      {!!countryResults.length && <><Text style={styles.section}>PAÍSES</Text><View style={styles.countryGrid}>{countryResults.map((country) => <View key={country.code} style={styles.countryCell}><CountryCard country={country} pinned={pinnedCountries.includes(country.code)} onTogglePin={() => void togglePinnedCountry(country.code)} /></View>)}</View></>}
      {!!channelResults.length && <><Text style={styles.section}>CANAIS RECENTES / FAVORITOS</Text><View style={styles.channels}>{channelResults.map((channel) => <ChannelCard key={`${channel.id}-${channel.url}`} channel={channel} />)}</View></>}
      {!!globalResults.length && <><Text style={styles.section}>CATÁLOGO GLOBAL</Text><View style={styles.channels}>{globalResults.map((channel) => <ChannelCard key={`${channel.id}-${channel.url}`} channel={channel} queue={globalResults} />)}</View></>}
      {loadingGlobal ? <Text style={styles.tip}>Preparando índice global de canais…</Text> : null}
      {globalError ? <Text style={styles.error}>Busca global indisponível: {globalError}</Text> : null}
      {q && !loadingGlobal && !countryResults.length && !channelResults.length && !globalResults.length ? <Text style={styles.tip}>Nada encontrado.</Text> : null}
    </AppShell>
  );
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 42, fontWeight: '900', marginTop: spacing.lg, marginBottom: 18 },
  searchRow: { flexDirection: 'row', gap: 10 }, input: { flex: 1, height: 60, borderRadius: radius.lg, borderWidth: 1, borderColor: '#202020', backgroundColor: '#060606', color: colors.text, paddingHorizontal: 18, fontSize: 17 },
  voice: { minWidth: 82, minHeight: 60, borderRadius: radius.lg, borderWidth: 1, borderColor: '#303030', alignItems: 'center', justifyContent: 'center' }, voiceText: { color: colors.green, fontWeight: '900', fontSize: 10 },
  tip: { color: colors.muted, marginTop: 16, lineHeight: 21, maxWidth: 760 },
  section: { color: colors.green, fontWeight: '900', letterSpacing: 1.5, fontSize: 10, marginTop: 28, marginBottom: 10 },
  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', margin: -5 },
  countryCell: { width: '50%', padding: 5 },
  channels: { gap: 10 }, error: { color: colors.red, marginTop: 16 }
});
