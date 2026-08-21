import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AppShell } from '@/components/AppShell';
import { WorldOrb } from '@/components/WorldOrb';
import { CountryCard } from '@/components/CountryCard';
import { ChannelCard } from '@/components/ChannelCard';
import { RGBLoader } from '@/components/RGBLoader';
import { useApp } from '@/state/AppContext';
import { colors, gradients, radius, spacing } from '@/theme/tokens';

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const { countries, loadingCountries, syncing, pinnedCountries, togglePinnedCountry, history } = useApp();
  const cols = width >= 1300 ? 4 : width >= 900 ? 3 : width >= 620 ? 3 : 2;
  const compact = width < 620;
  const pinned = useMemo(() => pinnedCountries.map((code) => countries.find((country) => country.code === code)).filter(Boolean), [countries, pinnedCountries]);

  return (
    <AppShell title="WORLD SIGNAL NETWORK">
      <View style={[styles.hero, compact && styles.heroCompact]}>
        <View style={[styles.heroCopy, compact && styles.heroCopyCompact]}>
          <Text style={styles.kicker}>TRANSMISSÃO SEM FRONTEIRAS</Text>
          <Text style={[styles.title, compact && styles.titleCompact]}>O mundo inteiro,{`\n`}um sinal de cada vez.</Text>
          <Text style={styles.subtitle}>Países e playlists sincronizados diretamente do ecossistema IPTV-org, com cache local para abrir rápido.</Text>
          <View style={styles.actions}>
            <Pressable onPress={() => router.push('/explore' as never)}>
              <LinearGradient colors={gradients.brand} style={styles.primaryButton}><Text style={styles.primaryText}>EXPLORAR O MUNDO →</Text></LinearGradient>
            </Pressable>
            <Pressable onPress={() => router.push('/favorites' as never)} style={styles.secondaryButton}><Text style={styles.secondaryText}>MEUS FAVORITOS</Text></Pressable>
          </View>
          <View style={styles.syncLine}><View style={[styles.syncDot, syncing && styles.syncingDot]} /><Text style={styles.syncText}>{syncing ? 'Sincronizando catálogo...' : 'Catálogo pronto'}</Text></View>
        </View>
        <View style={compact && styles.orbCompact}><WorldOrb /></View>
      </View>

      <SectionTitle title="Seus países" action="ver todos" onPress={() => router.push('/explore' as never)} />
      {loadingCountries && !countries.length ? <View style={styles.loader}><RGBLoader label="Carregando países do mundo..." /></View> : (
        <View style={styles.grid}>
          {pinned.slice(0, cols * 2).map((country: any) => (
            <View key={country.code} style={{ width: `${100 / cols}%`, padding: 6 }}>
              <CountryCard country={country} pinned onTogglePin={() => void togglePinnedCountry(country.code)} />
            </View>
          ))}
          {!pinned.length && <Text style={styles.empty}>Fixe países com ☆ na tela Mundo.</Text>}
        </View>
      )}

      {!!history.length && (
        <>
          <SectionTitle title="Continuar assistindo" />
          <View style={styles.channels}>
            {history.slice(0, width >= 900 ? 6 : 4).map((channel) => <ChannelCard key={`${channel.id}-${channel.url}`} channel={channel} />)}
          </View>
        </>
      )}
    </AppShell>
  );
}

function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{title}</Text>{action ? <Text onPress={onPress} style={styles.sectionAction}>{action}</Text> : null}</View>;
}

const styles = StyleSheet.create({
  hero: { minHeight: 420, borderRadius: radius.xl, borderWidth: 1, borderColor: '#191919', backgroundColor: '#040404', padding: spacing.xl, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', overflow: 'hidden' },
  heroCopy: { flex: 1, maxWidth: 760 },
  heroCopyCompact: { width: '100%', flex: 0 },
  heroCompact: { minHeight: 0, padding: spacing.lg, flexDirection: 'column', alignItems: 'stretch', gap: 22 },
  kicker: { color: colors.green, fontSize: 11, letterSpacing: 2.4, fontWeight: '900', marginBottom: 16 },
  title: { color: colors.text, fontSize: 48, lineHeight: 53, fontWeight: '900', letterSpacing: -1.8 },
  titleCompact: { fontSize: 34, lineHeight: 38, letterSpacing: -1 },
  orbCompact: { alignItems: 'center', transform: [{ scale: 0.82 }], marginVertical: -18 },
  subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, maxWidth: 620, marginTop: 18 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 26 },
  primaryButton: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: radius.pill },
  primaryText: { color: '#000', fontWeight: '900', fontSize: 11, letterSpacing: 1 },
  secondaryButton: { paddingHorizontal: 20, paddingVertical: 14, borderRadius: radius.pill, borderWidth: 1, borderColor: '#262626' },
  secondaryText: { color: colors.text, fontWeight: '800', fontSize: 11, letterSpacing: 1 },
  syncLine: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 24 },
  syncDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  syncingDot: { backgroundColor: colors.cyan },
  syncText: { color: colors.muted, fontSize: 11 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 36, marginBottom: 14 },
  sectionTitle: { color: colors.text, fontSize: 22, fontWeight: '900' },
  sectionAction: { color: colors.green, fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -6 },
  channels: { gap: 10 },
  loader: { paddingVertical: 50 },
  empty: { color: colors.muted, padding: spacing.lg }
});
