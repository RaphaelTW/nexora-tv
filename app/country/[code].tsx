import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { ChannelCard } from '@/components/ChannelCard';
import { RGBLoader } from '@/components/RGBLoader';
import { useCountryChannels } from '@/hooks/useCountryChannels';
import { useApp } from '@/state/AppContext';
import { colors, radius, spacing } from '@/theme/tokens';

export default function CountryScreen() {
  const params = useLocalSearchParams<{ code: string }>();
  const code = String(params.code || '').toUpperCase();
  const { width } = useWindowDimensions();
  const { countries, togglePinnedCountry, pinnedCountries } = useApp();
  const country = countries.find((item) => item.code === code);
  const { channels, loading, refreshing, error, refresh } = useCountryChannels(code);
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState('Todos');
  const groups = useMemo(() => ['Todos', ...Array.from(new Set(channels.map((item) => item.group || 'Geral'))).sort()].slice(0, 30), [channels]);
  const filtered = useMemo(() => channels.filter((channel) => {
    const matchesGroup = group === 'Todos' || channel.group === group;
    const q = query.trim().toLowerCase();
    return matchesGroup && (!q || `${channel.name} ${channel.group || ''}`.toLowerCase().includes(q));
  }), [channels, group, query]);
  const cols = width >= 1250 ? 3 : width >= 760 ? 2 : 1;

  return (
    <AppShell title={`${country?.name || code} · LIVE`}>
      <View style={styles.hero}>
        <Text style={styles.flag}>{country?.flag || '🌍'}</Text>
        <View style={styles.heroInfo}>
          <Text style={styles.kicker}>PAÍS / {code}</Text>
          <Text style={styles.title}>{country?.name || code}</Text>
          <Text style={styles.meta}>{channels.length} canais encontrados · catálogo atualizado ao abrir</Text>
        </View>
        <Pressable onPress={() => void togglePinnedCountry(code)} style={styles.pinButton}>
          <Text style={styles.pinText}>{pinnedCountries.includes(code) ? '★ FIXADO' : '☆ FIXAR'}</Text>
        </Pressable>
      </View>

      <View style={styles.toolbar}>
        <TextInput value={query} onChangeText={setQuery} placeholder="Buscar canal..." placeholderTextColor="#666" style={styles.search} />
        <Pressable onPress={refresh} style={styles.refresh}><Text style={styles.refreshText}>{refreshing ? 'ATUALIZANDO...' : '↻ ATUALIZAR'}</Text></Pressable>
      </View>

      <View style={styles.groups}>
        {groups.map((item) => <Text key={item} onPress={() => setGroup(item)} style={[styles.group, group === item && styles.groupActive]}>{item}</Text>)}
      </View>

      {loading && !channels.length ? <View style={styles.loader}><RGBLoader label={`Abrindo sinais de ${country?.name || code}...`} /></View> : null}
      {error && !channels.length ? <View style={styles.errorBox}><Text style={styles.errorTitle}>Sem sinal disponível</Text><Text style={styles.errorText}>{error}. Alguns países podem não possuir playlist publicada no momento.</Text></View> : null}
      <View style={styles.grid}>
        {filtered.map((channel) => <View key={`${channel.id}-${channel.url}`} style={{ width: `${100 / cols}%`, padding: 5 }}><ChannelCard channel={{ ...channel, countryName: country?.name, flag: country?.flag }} /></View>)}
      </View>
      {!loading && !error && !filtered.length ? <Text style={styles.empty}>Nenhum canal encontrado com esse filtro.</Text> : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, backgroundColor: '#050505', borderRadius: radius.xl, borderWidth: 1, borderColor: '#1A1A1A' },
  flag: { fontSize: 72 },
  heroInfo: { flex: 1 },
  kicker: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', marginTop: 5 },
  meta: { color: colors.muted, marginTop: 6, fontSize: 12 },
  pinButton: { borderWidth: 1, borderColor: '#262626', paddingHorizontal: 14, paddingVertical: 11, borderRadius: radius.pill },
  pinText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  toolbar: { flexDirection: 'row', gap: 10, marginTop: 18 },
  search: { flex: 1, height: 50, borderRadius: radius.md, borderWidth: 1, borderColor: '#1D1D1D', backgroundColor: '#070707', paddingHorizontal: 16, color: colors.text },
  refresh: { justifyContent: 'center', paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: '#202020' },
  refreshText: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  groups: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 18 },
  group: { color: colors.muted, borderWidth: 1, borderColor: '#181818', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8, fontSize: 11 },
  groupActive: { color: colors.black, backgroundColor: colors.green, borderColor: colors.green, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 },
  loader: { paddingVertical: 80 },
  errorBox: { borderWidth: 1, borderColor: '#3C2026', backgroundColor: '#13070A', borderRadius: radius.lg, padding: spacing.lg },
  errorTitle: { color: colors.red, fontWeight: '900', fontSize: 17 },
  errorText: { color: colors.muted, marginTop: 8, lineHeight: 20 },
  empty: { color: colors.muted, paddingVertical: 40, textAlign: 'center' }
});
