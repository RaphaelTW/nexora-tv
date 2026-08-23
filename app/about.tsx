import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Constants from 'expo-constants';
import { AppShell } from '@/components/AppShell';
import { colors, radius, spacing } from '@/theme/tokens';

export default function AboutScreen() {
  return <AppShell title="ABOUT NEXORA">
    <Text style={styles.title}>Sobre</Text>
    <Text style={styles.version}>Nexora TV v{Constants.expoConfig?.version || '1.1.1'}</Text>
    <Text style={styles.copy}>TV global ao vivo por país para Android, Android TV e Web, alimentada pelo catálogo público IPTV-org.</Text>
    <Text style={styles.section}>NOVIDADES DA VERSÃO</Text>
    <View style={styles.card}>
      <Text style={styles.item}>• Interface responsiva para bandeiras e países.</Text>
      <Text style={styles.item}>• Listas virtualizadas para catálogos grandes.</Text>
      <Text style={styles.item}>• Atualizações automáticas pelas GitHub Releases.</Text>
      <Text style={styles.item}>• Melhorias de estabilidade e reprodução.</Text>
    </View>
    <Text style={styles.section}>DESENVOLVIMENTO E LICENÇA</Text>
    <View style={styles.card}><Text style={styles.copy}>Desenvolvido por RaphaelTW. Código disponibilizado sob a licença MIT. O Nexora TV não hospeda transmissões.</Text></View>
    <View style={styles.actions}>
      <Link label="PERFIL DO DESENVOLVEDOR" url="https://github.com/RaphaelTW" />
      <Link label="REPOSITÓRIO E LICENÇA" url="https://github.com/RaphaelTW/nexora-tv" />
      <Link label="CHANGELOG / RELEASES" url="https://github.com/RaphaelTW/nexora-tv/releases" />
    </View>
  </AppShell>;
}
function Link({ label, url }: { label: string; url: string }) { return <Pressable focusable onPress={() => void Linking.openURL(url)} style={styles.button}><Text style={styles.buttonText}>{label} ↗</Text></Pressable>; }
const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 42, fontWeight: '900', marginTop: spacing.lg }, version: { color: colors.green, fontWeight: '900', marginTop: 6 },
  copy: { color: colors.muted, lineHeight: 22, marginTop: 12, maxWidth: 850 }, section: { color: colors.green, fontSize: 10, fontWeight: '900', letterSpacing: 1.5, marginTop: 30, marginBottom: 10 },
  card: { borderWidth: 1, borderColor: '#202020', backgroundColor: '#070707', borderRadius: radius.md, padding: spacing.md, maxWidth: 900 }, item: { color: colors.muted, lineHeight: 25 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 22 }, button: { minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: '#292929', borderRadius: radius.pill, paddingHorizontal: 16 }, buttonText: { color: colors.green, fontWeight: '900', fontSize: 10 }
});
