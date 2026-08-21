import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '@/theme/tokens';

const nav = [
  { label: 'Início', icon: '⌂', href: '/' },
  { label: 'Mundo', icon: '◎', href: '/explore' },
  { label: 'Buscar', icon: '⌕', href: '/search' },
  { label: 'Favoritos', icon: '♥', href: '/favorites' },
  { label: 'Ajustes', icon: '⚙', href: '/settings' }
] as const;

export function AppShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const isTV = Boolean((Platform as any).isTV);
  const wide = isTV || width >= 900;

  const content = (
    <View style={styles.page}>
      <View style={styles.topbar}>
        <View>
          <Text style={styles.brand}>NEXORA</Text>
          <Text style={styles.brandSub}>{title || 'LIVE WORLD SIGNAL'}</Text>
        </View>
        <View style={styles.livePill}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
      </View>
      {children}
    </View>
  );

  if (wide) {
    return (
      <View style={styles.root}>
        <View style={styles.sidebar}>
          <LinearGradient colors={gradients.brand} style={styles.logoMark}><View style={styles.logoInner}><Text style={styles.logoText}>N</Text></View></LinearGradient>
          <View style={styles.sideNav}>
            {nav.map((item) => {
              const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
              return (
                <Pressable key={item.href} focusable onPress={() => router.push(item.href as never)} style={[styles.sideItem, active && styles.sideItemActive]}>
                  <Text style={[styles.sideIcon, active && styles.activeText]}>{item.icon}</Text>
                  <Text style={[styles.sideLabel, active && styles.activeText]}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.source}>POWERED BY{`\n`}IPTV-ORG</Text>
        </View>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>{content}</ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.rootMobile}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.mobileContent}>{content}</ScrollView>
      <View style={styles.bottomNav}>
        {nav.map((item) => {
          const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Pressable key={item.href} onPress={() => router.push(item.href as never)} style={styles.bottomItem}>
              <Text style={[styles.bottomIcon, active && styles.activeText]}>{item.icon}</Text>
              <Text style={[styles.bottomLabel, active && styles.activeText]}>{item.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row', backgroundColor: colors.black },
  rootMobile: { flex: 1, backgroundColor: colors.black },
  sidebar: { width: 210, padding: spacing.lg, borderRightWidth: 1, borderRightColor: colors.subtle, backgroundColor: '#030303' },
  logoMark: { width: 48, height: 48, borderRadius: 16, padding: 2 },
  logoInner: { flex: 1, borderRadius: 14, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  logoText: { color: colors.text, fontWeight: '900', fontSize: 21 },
  sideNav: { gap: 8, marginTop: 46 },
  sideItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13, paddingHorizontal: 12, borderRadius: radius.md },
  sideItemActive: { backgroundColor: '#111111' },
  sideIcon: { color: colors.muted, width: 24, fontSize: 20, textAlign: 'center' },
  sideLabel: { color: colors.muted, fontWeight: '700', fontSize: 14 },
  activeText: { color: colors.green },
  source: { marginTop: 'auto', color: '#494949', fontSize: 10, letterSpacing: 1.2, lineHeight: 16 },
  scroll: { flex: 1, backgroundColor: colors.black },
  scrollContent: { flexGrow: 1 },
  mobileContent: { paddingBottom: 96 },
  page: { flex: 1, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, maxWidth: 1500, width: '100%', alignSelf: 'center' },
  topbar: { minHeight: 96, paddingTop: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { color: colors.text, fontSize: 18, letterSpacing: 4, fontWeight: '900' },
  brandSub: { color: colors.muted, fontSize: 9, letterSpacing: 2.2, marginTop: 5 },
  livePill: { flexDirection: 'row', gap: 7, alignItems: 'center', borderWidth: 1, borderColor: '#2A2A2A', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  liveText: { color: colors.text, fontWeight: '800', fontSize: 10, letterSpacing: 1 },
  bottomNav: { position: 'absolute', left: 10, right: 10, bottom: 10, height: 70, borderRadius: 24, borderWidth: 1, borderColor: '#1A1A1A', backgroundColor: '#080808EE', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  bottomItem: { alignItems: 'center', gap: 3, minWidth: 56 },
  bottomIcon: { color: colors.muted, fontSize: 20 },
  bottomLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' }
});
