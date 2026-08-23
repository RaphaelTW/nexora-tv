import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { recordDiagnostic } from '@/services/diagnostics';

export class AppErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { void recordDiagnostic('interface', error); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <View style={styles.root}><Text style={styles.title}>Algo saiu do ar</Text><Text style={styles.text}>O erro foi salvo somente neste dispositivo, sem dados pessoais.</Text><Pressable onPress={() => this.setState({ failed: false })} style={styles.button}><Text style={styles.buttonText}>TENTAR NOVAMENTE</Text></Pressable></View>;
  }
}
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', padding: 24 }, title: { color: colors.text, fontSize: 24, fontWeight: '900' }, text: { color: colors.muted, marginTop: 8, textAlign: 'center' }, button: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 18, borderWidth: 1, borderColor: '#333', borderRadius: radius.pill, marginTop: 20 }, buttonText: { color: colors.green, fontWeight: '900' } });
