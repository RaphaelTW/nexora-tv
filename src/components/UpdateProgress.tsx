import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { dismissUpdateProgress, subscribeToUpdate, type UpdateState } from '@/services/updates';

export function UpdateProgress() {
  const [state, setState] = useState<UpdateState>({ phase: 'idle', progress: 0 });
  useEffect(() => subscribeToUpdate(setState), []);
  if (state.phase === 'idle') return null;
  return <View style={styles.box}>
    <Text style={styles.title}>{state.phase === 'error' ? 'Falha na atualização' : 'Atualização do Nexora TV'}</Text>
    <Text style={styles.message}>{state.message}</Text>
    {state.phase === 'downloading' || state.phase === 'verifying' ? <View style={styles.track}><View style={[styles.fill, { width: `${Math.round(state.progress * 100)}%` }]} /></View> : null}
    {state.phase === 'downloading' ? <Text style={styles.percent}>{Math.round(state.progress * 100)}%</Text> : null}
    {state.phase === 'error' || state.phase === 'ready' ? <Pressable onPress={dismissUpdateProgress} style={styles.closeButton}><Text style={styles.close}>FECHAR</Text></Pressable> : null}
  </View>;
}
const styles = StyleSheet.create({
  box: { position: 'absolute', zIndex: 100, left: 18, right: 18, bottom: 24, maxWidth: 560, alignSelf: 'center', backgroundColor: '#111', borderWidth: 1, borderColor: '#333', borderRadius: radius.md, padding: 16 },
  title: { color: colors.text, fontWeight: '900' }, message: { color: colors.muted, marginTop: 5 },
  track: { height: 6, borderRadius: 3, backgroundColor: '#292929', overflow: 'hidden', marginTop: 12 }, fill: { height: 6, backgroundColor: colors.green },
  percent: { color: colors.green, fontSize: 10, marginTop: 5, textAlign: 'right' }, closeButton: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-end' }, close: { color: colors.green, fontWeight: '900', fontSize: 10 }
});
