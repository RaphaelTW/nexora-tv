import React, { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Constants from 'expo-constants';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { AppShell } from '@/components/AppShell';
import { RGBLoader } from '@/components/RGBLoader';
import { useApp } from '@/state/AppContext';
import { colors, radius, spacing } from '@/theme/tokens';
import { checkForUpdate, subscribeToUpdateCheckHealth, type UpdateCheckHealth } from '@/services/updates';
import { addCustomProvider, readCustomProviders, removeCustomProvider, type CustomProvider } from '@/services/customProviders';

export default function SettingsScreen() {
  const { syncing, syncError, refreshCountries, clearLocalData, countries, favorites, history } = useApp();
  const [pixCopied, setPixCopied] = useState(false);
  const [customProviders, setCustomProviders] = useState<CustomProvider[]>([]);
  const [providerName, setProviderName] = useState('');
  const [providerCountry, setProviderCountry] = useState('BR');
  const [providerUrl, setProviderUrl] = useState('');
  const [providerError, setProviderError] = useState<string | null>(null);
  const [updateHealth, setUpdateHealth] = useState<UpdateCheckHealth>({ lastCheckedAt: null, lastError: null });
  useEffect(() => {
    if (!pixCopied) return;
    const timer = setTimeout(() => setPixCopied(false), 2500);
    return () => clearTimeout(timer);
  }, [pixCopied]);
  useEffect(() => { void readCustomProviders().then(setCustomProviders); }, []);
  useEffect(() => subscribeToUpdateCheckHealth(setUpdateHealth), []);
  const copyPix = async () => {
    await Clipboard.setStringAsync('c15b0dc5-808e-4b1b-aa90-6ff25ae1c0d9');
    setPixCopied(true);
  };
  const addProvider = async () => {
    try {
      const next = await addCustomProvider({ name: providerName, countryCode: providerCountry, url: providerUrl });
      setCustomProviders(next);
      setProviderName('');
      setProviderUrl('');
      setProviderError(null);
    } catch (error) {
      setProviderError(error instanceof Error ? error.message : 'Não foi possível adicionar a fonte.');
    }
  };
  return (
    <AppShell title="SYSTEM CONTROL">
      <Text style={styles.title}>Ajustes</Text>
      <Setting title="Fonte do catálogo" value="iptv-org / oficial" />
      <Setting title="Países disponíveis" value={String(countries.length)} />
      <Setting title="Favoritos locais" value={String(favorites.length)} />
      <Setting title="Histórico local" value={String(history.length)} />
      <Setting title="Versão atual" value={`v${Constants.expoConfig?.version || '1.1.1'}`} />
      <View style={styles.row}>
        <Text style={styles.rowTitle}>Desenvolvido por</Text>
        <Pressable onPress={() => void Linking.openURL('https://github.com/RaphaelTW')}>
          <Text style={styles.link}>RaphaelTW · GitHub ↗</Text>
        </Pressable>
      </View>
      <View style={styles.providerSection}>
        <Text style={styles.rowTitle}>Adicionar fonte pública</Text>
        <Text style={styles.providerHint}>Use somente uma playlist oficial .m3u/.m3u8 sem login, token ou chave. Ela será usada apenas no país informado.</Text>
        <View style={styles.providerFields}>
          <TextInput value={providerName} onChangeText={setProviderName} placeholder="Nome da fonte (opcional)" placeholderTextColor="#666" style={[styles.providerInput, styles.providerName]} />
          <TextInput value={providerCountry} onChangeText={value => setProviderCountry(value.toUpperCase())} autoCapitalize="characters" maxLength={2} placeholder="BR" placeholderTextColor="#666" style={[styles.providerInput, styles.providerCountry]} />
          <TextInput value={providerUrl} onChangeText={setProviderUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" placeholder="https://emissora.exemplo/lista.m3u8" placeholderTextColor="#666" style={[styles.providerInput, styles.providerUrl]} />
          <Pressable onPress={() => void addProvider()} style={styles.addProviderButton}><Text style={styles.buttonText}>ADICIONAR</Text></Pressable>
        </View>
        {providerError ? <Text style={styles.providerError}>{providerError}</Text> : null}
        {customProviders.map(provider => <View key={provider.id} style={styles.providerItem}>
          <View style={styles.providerItemInfo}><Text style={styles.providerItemName}>{provider.name} · {provider.countryCode}</Text><Text numberOfLines={1} style={styles.providerItemUrl}>{provider.url}</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={`Remover ${provider.name}`} onPress={() => void removeCustomProvider(provider.id).then(setCustomProviders)} style={styles.removeProviderButton}><Text style={styles.removeProviderText}>REMOVER</Text></Pressable>
        </View>)}
      </View>
      <View style={styles.row}>
        <View style={styles.pixInfo}>
          <Text style={styles.rowTitle}>Apoie o projeto via Pix</Text>
          <Text style={styles.pixHint}>{pixCopied ? 'Chave copiada.' : 'Toque na chave para copiar'}</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Copiar chave Pix" onPress={() => void copyPix()} hitSlop={10} style={styles.pixButton}>
          <Text selectable style={styles.pixKey}>c15b0dc5-808e-4b1b-aa90-6ff25ae1c0d9</Text>
        </Pressable>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => void refreshCountries()} style={styles.button}><Text style={styles.buttonText}>↻ SINCRONIZAR AGORA</Text></Pressable>
        <Pressable onPress={() => void checkForUpdate({ showUpToDate: true })} style={styles.button}><Text style={styles.buttonText}>VERIFICAR ATUALIZAÇÃO</Text></Pressable>
        <Pressable onPress={() => router.push('/about' as never)} style={styles.button}><Text style={styles.buttonText}>SOBRE O NEXORA</Text></Pressable>
        <Pressable onPress={() => void clearLocalData()} style={[styles.button, styles.danger]}><Text style={[styles.buttonText, styles.dangerText]}>LIMPAR DADOS LOCAIS</Text></Pressable>
      </View>
      {syncing ? <View style={styles.loader}><RGBLoader label="Atualizando países..." /></View> : null}
      {syncError ? <Text style={styles.error}>Última sincronização: {syncError}</Text> : null}
      {updateHealth.lastError ? <Text style={styles.updateWarning}>Atualização: a última verificação falhou. Toque em “VERIFICAR ATUALIZAÇÃO” para tentar novamente.</Text> : null}
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
  link: { color: colors.green, textAlign: 'right', fontWeight: '800' },
  pixInfo: { flexShrink: 1 },
  pixHint: { color: colors.muted, fontSize: 10, marginTop: 4 },
  pixButton: { flexShrink: 1, paddingVertical: 10 },
  pixKey: { color: colors.green, textAlign: 'right', fontWeight: '900', flexShrink: 1 },
  providerSection: { borderBottomWidth: 1, borderBottomColor: '#141414', paddingVertical: spacing.md },
  providerHint: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 6, maxWidth: 760 },
  providerFields: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  providerInput: { minHeight: 44, borderWidth: 1, borderColor: '#242424', borderRadius: radius.sm, color: colors.text, paddingHorizontal: 12, fontSize: 12 },
  providerName: { minWidth: 180, flexGrow: 1 },
  providerCountry: { width: 58, textAlign: 'center' },
  providerUrl: { minWidth: 240, flexGrow: 3 },
  addProviderButton: { minHeight: 44, justifyContent: 'center', borderWidth: 1, borderColor: colors.green, borderRadius: radius.pill, paddingHorizontal: 14 },
  providerError: { color: colors.red, fontSize: 11, marginTop: 10 },
  providerItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 12 },
  providerItemInfo: { flex: 1, minWidth: 0 },
  providerItemName: { color: colors.text, fontSize: 12, fontWeight: '800' },
  providerItemUrl: { color: colors.muted, fontSize: 10, marginTop: 3 },
  removeProviderButton: { minHeight: 38, justifyContent: 'center', borderWidth: 1, borderColor: '#4A2228', borderRadius: radius.pill, paddingHorizontal: 12 },
  removeProviderText: { color: colors.red, fontSize: 9, fontWeight: '900', letterSpacing: .8 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 24 },
  button: { borderWidth: 1, borderColor: '#242424', borderRadius: radius.pill, paddingHorizontal: 16, paddingVertical: 12 },
  buttonText: { color: colors.green, fontWeight: '900', fontSize: 10, letterSpacing: 1 },
  danger: { borderColor: '#38151B' }, dangerText: { color: colors.red },
  loader: { paddingVertical: 32 }, error: { color: colors.red, marginTop: 18 },
  updateWarning: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 18 },
  legal: { color: '#555', fontSize: 10, lineHeight: 16, marginTop: 38, maxWidth: 850 }
});
