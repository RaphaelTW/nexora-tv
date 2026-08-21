import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { CountryCard } from '@/components/CountryCard';
import { RGBLoader } from '@/components/RGBLoader';
import { useApp } from '@/state/AppContext';
import { colors, radius, spacing } from '@/theme/tokens';

export default function ExploreScreen() {
  const { width } = useWindowDimensions();
  const { countries, loadingCountries, pinnedCountries, togglePinnedCountry } = useApp();
  const [query, setQuery] = useState('');
  const cols = width >= 1400 ? 5 : width >= 1050 ? 4 : width >= 720 ? 3 : 2;
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return countries;
    return countries.filter((country) => `${country.name} ${country.code}`.toLowerCase().includes(q));
  }, [countries, query]);

  return (
    <AppShell title="EXPLORE THE WORLD">
      <View style={styles.header}>
        <View><Text style={styles.kicker}>TODOS OS PAÍSES</Text><Text style={styles.title}>Escolha uma bandeira.{`\n`}Abra o sinal.</Text></View>
        <Text style={styles.count}>{filtered.length}</Text>
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Buscar país ou código ISO..."
        placeholderTextColor="#666"
        style={styles.search}
        autoCorrect={false}
      />
      {loadingCountries && !countries.length ? <View style={styles.loader}><RGBLoader label="Buscando países no IPTV-org..." /></View> : (
        <View style={styles.grid}>
          {filtered.map((country) => (
            <View key={country.code} style={{ width: `${100 / cols}%`, padding: 6 }}>
              <CountryCard
                country={country}
                pinned={pinnedCountries.includes(country.code)}
                onTogglePin={() => void togglePinnedCountry(country.code)}
              />
            </View>
          ))}
        </View>
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginVertical: spacing.lg },
  kicker: { color: colors.green, fontWeight: '900', letterSpacing: 2, fontSize: 10, marginBottom: 10 },
  title: { color: colors.text, fontSize: 36, lineHeight: 40, fontWeight: '900', letterSpacing: -1 },
  count: { color: '#202020', fontSize: 74, fontWeight: '900' },
  search: { color: colors.text, backgroundColor: '#070707', borderColor: '#1E1E1E', borderWidth: 1, borderRadius: radius.lg, paddingHorizontal: 18, height: 54, fontSize: 15, marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  loader: { paddingVertical: 70 }
});
