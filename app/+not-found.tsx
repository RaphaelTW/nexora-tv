import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { colors, radius } from '@/theme/tokens';
export default function NotFound() { return <View style={styles.root}><Text style={styles.code}>404</Text><Text style={styles.title}>Sinal não encontrado</Text><Text style={styles.text}>Esta página não existe ou o endereço mudou.</Text><Pressable onPress={() => router.replace('/' as never)} style={styles.button}><Text style={styles.buttonText}>VOLTAR AO INÍCIO</Text></Pressable></View>; }
const styles = StyleSheet.create({ root: { flex: 1, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center', padding: 24 }, code: { color: colors.green, fontSize: 72, fontWeight: '900' }, title: { color: colors.text, fontSize: 25, fontWeight: '900' }, text: { color: colors.muted, marginTop: 8 }, button: { marginTop: 24, minHeight: 48, justifyContent: 'center', borderWidth: 1, borderColor: '#333', borderRadius: radius.pill, paddingHorizontal: 20 }, buttonText: { color: colors.green, fontWeight: '900' } });
