import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients, radius, spacing } from '@/theme/tokens';
import { dismissUpdateProgress, installAvailableUpdate, postponeAvailableUpdate, subscribeToUpdate, type UpdateState } from '@/services/updates';

export function UpdateProgress() {
  const [state, setState] = useState<UpdateState>({ phase: 'idle', progress: 0 });
  useEffect(() => subscribeToUpdate(setState), []);
  const busy = state.phase === 'checking' || state.phase === 'downloading' || state.phase === 'verifying';
  const available = state.phase === 'available';
  const ready = state.phase === 'ready';
  const heading = available ? 'NOVA VERSÃO DISPONÍVEL' : ready ? 'ATUALIZAÇÃO PRONTA' : state.phase === 'error' ? 'NÃO FOI POSSÍVEL ATUALIZAR' : state.phase === 'info' ? 'SISTEMA ATUALIZADO' : 'ATUALIZAÇÃO DO NEXORA';

  return <Modal visible={state.phase !== 'idle'} transparent animationType="fade" statusBarTranslucent onRequestClose={() => { if (!busy) dismissUpdateProgress(); }}>
    <View style={styles.backdrop}>
      <LinearGradient colors={gradients.brand} style={styles.border}>
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logo}><Text style={styles.logoText}>N</Text></View>
            <View style={styles.headerCopy}><Text style={styles.eyebrow}>{heading}</Text><Text style={styles.title}>{available ? state.title : 'Nexora TV'}</Text></View>
            <View style={styles.live}><View style={styles.dot} /><Text style={styles.liveText}>UPDATE</Text></View>
          </View>

          {available ? <>
            <View style={styles.badges}><Text style={styles.version}>{state.version}</Text><Text style={styles.platform}>{state.platform}</Text></View>
            <Text style={styles.section}>O QUE HÁ DE NOVO</Text>
            <ScrollView style={styles.notesScroll} contentContainerStyle={styles.notesContent}><Text style={styles.notes}>{state.notes}</Text></ScrollView>
            {state.assetName ? <Text style={styles.asset} numberOfLines={1}>APK · {state.assetName}</Text> : null}
            <View style={styles.actions}>
              <Pressable focusable onPress={() => void postponeAvailableUpdate()} style={({ focused }) => [styles.secondary, focused && styles.focused]}><Text style={styles.secondaryText}>DEPOIS</Text></Pressable>
              <Pressable focusable hasTVPreferredFocus onPress={() => void installAvailableUpdate()} style={({ focused }) => [styles.primaryWrap, focused && styles.focused]}><LinearGradient colors={gradients.brand} style={styles.primary}><Text style={styles.primaryText}>{Platform.OS === 'android' && state.assetName ? 'BAIXAR E INSTALAR →' : 'VER RELEASE →'}</Text></LinearGradient></Pressable>
            </View>
          </> : <>
            <View style={styles.status}>
              {busy ? <ActivityIndicator color={colors.green} size="large" /> : <Text style={[styles.statusIcon, state.phase === 'error' && styles.errorIcon]}>{state.phase === 'error' ? '!' : '✓'}</Text>}
              <Text style={styles.message}>{state.message}</Text>
            </View>
            {state.phase === 'downloading' || state.phase === 'verifying' ? <><View style={styles.track}><LinearGradient colors={gradients.brand} style={[styles.fill, { width: `${Math.round(state.progress * 100)}%` }]} /></View><Text style={styles.percent}>{Math.round(state.progress * 100)}%</Text></> : null}
            {ready ? <View style={styles.actions}>
              <Pressable focusable onPress={() => void postponeAvailableUpdate()} style={({ focused }) => [styles.secondary, focused && styles.focused]}><Text style={styles.secondaryText}>DEPOIS</Text></Pressable>
              <Pressable focusable hasTVPreferredFocus onPress={() => void installAvailableUpdate()} style={({ focused }) => [styles.primaryWrap, focused && styles.focused]}><LinearGradient colors={gradients.brand} style={styles.primary}><Text style={styles.primaryText}>INSTALAR →</Text></LinearGradient></Pressable>
            </View> : !busy ? <Pressable focusable hasTVPreferredFocus onPress={dismissUpdateProgress} style={({ focused }) => [styles.close, focused && styles.focused]}><Text style={styles.closeText}>FECHAR</Text></Pressable> : null}
          </>}
        </View>
      </LinearGradient>
    </View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000D9', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  border: { width: '100%', maxWidth: 620, padding: 2, borderRadius: radius.xl }, card: { backgroundColor: '#050505', borderRadius: radius.xl - 2, padding: spacing.lg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13 }, logo: { width: 46, height: 46, borderRadius: 15, backgroundColor: '#111', borderWidth: 1, borderColor: '#292929', alignItems: 'center', justifyContent: 'center' }, logoText: { color: colors.text, fontSize: 20, fontWeight: '900' },
  headerCopy: { flex: 1 }, eyebrow: { color: colors.green, fontSize: 9, fontWeight: '900', letterSpacing: 1.5 }, title: { color: colors.text, fontSize: 21, fontWeight: '900', marginTop: 3 },
  live: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: '#292929', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 7 }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green }, liveText: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 22 }, version: { color: colors.black, backgroundColor: colors.green, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, fontWeight: '900', fontSize: 11 }, platform: { color: colors.text, borderWidth: 1, borderColor: '#303030', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, fontWeight: '800', fontSize: 10 },
  section: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 22, marginBottom: 8 }, notesScroll: { maxHeight: 190, borderWidth: 1, borderColor: '#1D1D1D', backgroundColor: '#090909', borderRadius: radius.md }, notesContent: { padding: 14 }, notes: { color: '#C6C6C6', lineHeight: 20, fontSize: 12 }, asset: { color: '#555', fontSize: 9, marginTop: 10 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', flexWrap: 'wrap', gap: 10, marginTop: 22 }, secondary: { minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: '#333', borderRadius: radius.pill, paddingHorizontal: 18 }, secondaryText: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  primaryWrap: { borderRadius: radius.pill }, primary: { minHeight: 48, justifyContent: 'center', borderRadius: radius.pill, paddingHorizontal: 20 }, primaryText: { color: colors.black, fontSize: 10, fontWeight: '900', letterSpacing: .5 }, focused: { borderRadius: radius.pill, outlineColor: colors.green, outlineWidth: 3, transform: [{ scale: 1.04 }] } as any,
  status: { minHeight: 150, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 }, statusIcon: { color: colors.green, fontSize: 38, fontWeight: '900' }, errorIcon: { color: colors.red }, message: { color: colors.muted, textAlign: 'center', lineHeight: 20, marginTop: 14 },
  track: { height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden' }, fill: { height: 8 }, percent: { color: colors.green, textAlign: 'right', fontWeight: '900', fontSize: 10, marginTop: 6 },
  close: { alignSelf: 'flex-end', minHeight: 46, justifyContent: 'center', borderWidth: 1, borderColor: '#333', borderRadius: radius.pill, paddingHorizontal: 18 }, closeText: { color: colors.green, fontWeight: '900', fontSize: 10 }
});
