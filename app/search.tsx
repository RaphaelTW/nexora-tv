import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { CountryCard } from '@/components/CountryCard';
import { ChannelCard } from '@/components/ChannelCard';
import { useApp } from '@/state/AppContext';
import { colors, radius, spacing } from '@/theme/tokens';

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const { countries, favorites, history, pinnedCountries, togglePinnedCountry } = useApp();
  const q = query.trim().toLowerCase();
  const countryResults = useMemo(() => q ? countries.filter((c) => `${c.name} ${c.code}`.toLowerCase().includes(q)).slice(0, 12) : [], [countries, q]);
  const channelPool = useMemo(() => [...favorites, ...history].filter((item, index, array) => array.findIndex((x) => x.id === item.id) === index), [favorites, history]);
  const channelResults = useMemo(() => q ? channelPool.filter((c) => `${c.name} ${c.group || ''}`.toLowerCase().includes(q)).slice(0, 20) : [], [channelPool, q]);
  return (
    <AppShell title="SEARCH THE SIGNAL">
      <Text style={styles.title}>Buscar</Text>
      <TextInput autoFocus value={query} onChangeText={setQuery} placeholder="País, código ou canal já visto..." placeholderTextColor="#666" style={styles.input} />
      {!q ? <Text style={styles.tip}>A busca encontra todos os países do catálogo e canais que você já abriu ou favoritou. Dentro de cada país, a busca cobre a playlist inteira.</Text> : null}
      {!!countryResults.length && <><Text style={styles.section}>PAÍSES</Text><View style={styles.countryGrid}>{countryResults.map((country) => <View key={country.code} style={styles.countryCell}><CountryCard country={country} pinned={pinnedCountries.includes(country.code)} onTogglePin={() => void togglePinnedCountry(country.code)} /></View>)}</View></>}
      {!!channelResults.length && <><Text style={styles.section}>CANAIS RECENTES / FAVORITOS</Text><View style={styles.channels}>{channelResults.map((channel) => <ChannelCard key={`${channel.id}-${channel.url}`} channel={channel} />)}</View></>}
      {q && !countryResults.length && !channelResults.length ? <Text style={styles.tip}>Nada encontrado.</Text> : null}
    </AppShell>
  );
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 42, fontWeight: '900', marginTop: spacing.lg, marginBottom: 18 },
  input: { height: 60, borderRadius: radius.lg, borderWidth: 1, borderColor: '#202020', backgroundColor: '#060606', color: colors.text, paddingHorizontal: 18, fontSize: 17 },
  tip: { color: colors.muted, marginTop: 16, lineHeight: 21, maxWidth: 760 },
  section: { color: colors.green, fontWeight: '900', letterSpacing: 1.5, fontSize: 10, marginTop: 28, marginBottom: 10 },
  countryGrid: { flexDirection: 'row', flexWrap: 'wrap', margin: -5 },
  countryCell: { width: '50%', padding: 5 },
  channels: { gap: 10 }
});
