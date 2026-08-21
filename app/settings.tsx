import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '@/components/AppShell';
import { RGBLoader } from '@/components/RGBLoader';
import { useApp } from '@/state/AppContext';
import { colors, radius, spacing } from '@/theme/tokens';

export default function SettingsScreen() {
  const { syncing, syncError, refreshCountries, clearLocalData, countries, favorites, history } = useApp();
  return (
    <AppShell title="SYSTEM CONTROL">
      <Text style={styles.title}>Ajustes</Text>
      <Setting title="Fonte do catálogo" value="iptv-org / oficial" />
      <Setting title="Países disponíveis" value={String(countries.length)} />
      <Setting title="Favoritos locais" value={String(favorites.length)} />
      <Setting title="Histórico local" value={String(history.length)} />
      <Setting title="Tema" value="OLED #000000 · Neon roxo → verde" />
      <Setting title="Loader" value="RGB animado" />
      <View style={styles.actions}>
        <Pressable onPress={() => void refreshCountries()} style={styles.button}><Text style={styles.buttonText}>↻ SINCRONIZAR AGORA</Text></Pressable>
        <Pressable onPress={() => void clearLocalData()} style={[styles.button, styles.danger]}><Text style={[styles.buttonText, styles.dangerText]}>LIMPAR DADOS LOCAIS</Text></Pressable>
      </View>
      {syncing ? <View style={styles.loader}><RGBLoader label="Atualizando países..." /></View> : null}
      {syncError ? <Text style={styles.error}>Última sincronização: {syncError}</Text> : null}
      <Text style={styles.legal}>Nexora TV não hospeda transmissões. O aplicativo organiza links públicos fornecidos pelo IPTV-org. A disponibilidade e os direitos de cada sinal pertencem às respectivas fontes.</Text>
    </AppShell>
  );
}
function Setting({ title, value }: { title: string; value: string }) {
  return <View style={styles.row}><Text style={styles.rowTitle}>{title}</Text><Text style={styles.rowValue}>{value}</Text></View>;
}
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 42, fontWeight: '900', marginTop: spacing.lg, marginBottom: 22 },
  row: { minHeight: 62, borderBottomWidth: 1, borderBottomColor: '#141414', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 18 },
  rowTitle: { color: colors.text, fontWeight: '700' },
  rowValue: { color: colors.muted, textAlign: 'right', flexShrink: 1 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  button: { borderWidth: 1, borderColor: '#242424', borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { color: colors.green, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  danger: { borderColor: '#38151B' }, dangerText: { color: colors.red },
  loader: { paddingVertical: 32 }, error: { color: colors.red, marginTop: 18 },
  legal: { color: '#555', fontSize: 10, lineHeight: 16, marginTop: 38, maxWidth: 850 }
});
