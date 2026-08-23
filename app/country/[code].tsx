import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { ChannelCard } from '@/components/ChannelCard';
import { RGBLoader } from '@/components/RGBLoader';
import { useCountryChannels } from '@/hooks/useCountryChannels';
import { useApp } from '@/state/AppContext';
import { colors, radius, spacing } from '@/theme/tokens';
import { filterChannels } from '@/services/channelUtils';
import { WebMetadata } from '@/components/WebMetadata';

export default function CountryScreen() {
  const params = useLocalSearchParams<{ code: string; q?: string; group?: string }>();
  const code = String(params.code || '').toUpperCase();
  const { width } = useWindowDimensions();
  const { countries, togglePinnedCountry, pinnedCountries } = useApp();
  const country = countries.find((item) => item.code === code);
  const { channels, loading, refreshing, error, refresh } = useCountryChannels(code);
  const [query, setQuery] = useState(params.q || '');
  const [group, setGroup] = useState(params.group || 'Todos');
  const [showAllGroups, setShowAllGroups] = useState(false);
  const groups = useMemo(() => ['Todos', ...Array.from(new Set(channels.map((item) => item.group || 'Geral'))).sort()].slice(0, 30), [channels]);
  const filtered = useMemo(() => filterChannels(channels, query, group), [channels, group, query]);
  const cols = width >= 1250 ? 3 : width >= 760 ? 2 : 1;
  const compact = width < 600;

  const header = (
    <>
      <View style={[styles.hero, compact && styles.heroMobile]}>
        <View style={styles.heroMain}>
          <Text style={[styles.flag, compact && styles.flagMobile]}>{country?.flag || '🌍'}</Text>
          <View style={styles.heroInfo}>
            <Text style={styles.kicker}>PAÍS / {code}</Text>
            <Text style={[styles.title, compact && styles.titleMobile]} numberOfLines={2}>{country?.name || code}</Text>
            <Text style={styles.meta}>{channels.length} canais encontrados · catálogo atualizado ao abrir</Text>
          </View>
        </View>
        <Pressable onPress={() => void togglePinnedCountry(code)} style={[styles.pinButton, compact && styles.pinButtonMobile]}>
          <Text style={styles.pinText}>{pinnedCountries.includes(code) ? '★ FIXADO' : '☆ FIXAR'}</Text>
        </Pressable>
      </View>

      <View style={[styles.toolbar, compact && styles.toolbarMobile]}>
        <TextInput value={query} onChangeText={(value) => { setQuery(value); router.setParams({ q: value || undefined }); }} placeholder="Buscar canal..." placeholderTextColor="#666" style={styles.search} />
        <Pressable onPress={refresh} style={styles.refresh}><Text style={styles.refreshText}>{refreshing ? 'ATUALIZANDO...' : '↻ ATUALIZAR'}</Text></Pressable>
      </View>

      <FlatList
        horizontal
        data={showAllGroups ? groups : groups.slice(0, 12)}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groups}
        renderItem={({ item }) => <Pressable focusable onPress={() => { setGroup(item); router.setParams({ group: item === 'Todos' ? undefined : item }); }} style={[styles.group, group === item && styles.groupActive]}><Text style={[styles.groupText, group === item && styles.groupTextActive]}>{item}</Text></Pressable>}
        ListFooterComponent={groups.length > 12 ? <Pressable focusable onPress={() => setShowAllGroups((value) => !value)} style={styles.moreGroups}><Text style={styles.moreGroupsText}>{showAllGroups ? 'MENOS' : `+${groups.length - 12} FILTROS`}</Text></Pressable> : null}
      />

      {loading && !channels.length ? <View style={styles.loader}><RGBLoader label={`Abrindo sinais de ${country?.name || code}...`} /></View> : null}
      {error && !channels.length ? <View style={styles.errorBox}><Text style={styles.errorTitle}>Sem sinal disponível</Text><Text style={styles.errorText}>{error}. Alguns países podem não possuir playlist publicada no momento.</Text></View> : null}
    </>
  );

  return (
    <AppShell title={`${country?.name || code} · LIVE`} scroll={false}>
      <WebMetadata title={`${country?.name || code} — Nexora TV`} description={`Canais ao vivo de ${country?.name || code} no Nexora TV.`} />
      <FlatList
        key={`channels-${cols}`}
        data={filtered}
        numColumns={cols}
        keyExtractor={(channel) => `${channel.id}-${channel.url}`}
        renderItem={({ item }) => (
          <View style={styles.gridItem}><ChannelCard channel={{ ...item, countryName: country?.name, flag: country?.flag }} /></View>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={!loading && !error ? <Text style={styles.empty}>Nenhum canal encontrado com esse filtro.</Text> : null}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={7}
        removeClippedSubviews
        refreshing={refreshing}
        onRefresh={refresh}
      />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  hero: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg, padding: spacing.lg, backgroundColor: '#050505', borderRadius: radius.xl, borderWidth: 1, borderColor: '#1A1A1A' },
  heroMobile: { flexDirection: 'column', alignItems: 'stretch', gap: spacing.md, padding: spacing.md },
  heroMain: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flag: { fontSize: 72 },
  flagMobile: { fontSize: 54 },
  heroInfo: { flex: 1, minWidth: 0 },
  kicker: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  title: { color: colors.text, fontSize: 34, fontWeight: '900', marginTop: 5 },
  titleMobile: { fontSize: 28 },
  meta: { color: colors.muted, marginTop: 6, fontSize: 12 },
  pinButton: { borderWidth: 1, borderColor: '#262626', paddingHorizontal: 14, paddingVertical: 11, borderRadius: radius.pill },
  pinButtonMobile: { alignSelf: 'flex-end' },
  pinText: { color: colors.text, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  toolbar: { flexDirection: 'row', gap: 10, marginTop: 18 },
  toolbarMobile: { flexWrap: 'wrap' },
  search: { flex: 1, height: 50, borderRadius: radius.md, borderWidth: 1, borderColor: '#1D1D1D', backgroundColor: '#070707', paddingHorizontal: 16, color: colors.text },
  refresh: { justifyContent: 'center', paddingHorizontal: 16, borderRadius: radius.md, borderWidth: 1, borderColor: '#202020' },
  refreshText: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  groups: { gap: 8, marginVertical: 18, paddingRight: 6 },
  group: { minHeight: 46, justifyContent: 'center', borderWidth: 1, borderColor: '#181818', borderRadius: radius.pill, paddingHorizontal: 14 },
  groupText: { color: colors.muted, fontSize: 11 },
  groupActive: { backgroundColor: colors.green, borderColor: colors.green },
  groupTextActive: { color: colors.black, fontWeight: '900' },
  moreGroups: { minHeight: 46, justifyContent: 'center', paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: '#303030' },
  moreGroupsText: { color: colors.green, fontWeight: '900', fontSize: 10 },
  listContent: { paddingBottom: spacing.xxl },
  gridItem: { flex: 1, padding: 5 },
  loader: { paddingVertical: 80 },
  errorBox: { borderWidth: 1, borderColor: '#3C2026', backgroundColor: '#13070A', borderRadius: radius.lg, padding: spacing.lg },
  errorTitle: { color: colors.red, fontWeight: '900', fontSize: 17 },
  errorText: { color: colors.muted, marginTop: 8, lineHeight: 20 },
  empty: { color: colors.muted, paddingVertical: 40, textAlign: 'center' }
});
