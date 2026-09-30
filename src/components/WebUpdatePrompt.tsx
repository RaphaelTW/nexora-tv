import { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '@/theme/tokens';

export function WebUpdatePrompt() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !('serviceWorker' in navigator)) return;
    let registration: ServiceWorkerRegistration | undefined;
    const inspect = () => setWaiting(registration?.waiting || null);
    const watch = (next: ServiceWorkerRegistration) => {
      registration = next;
      inspect();
      registration.addEventListener('updatefound', inspect);
      registration.installing?.addEventListener('statechange', inspect);
    };
    void navigator.serviceWorker.getRegistration().then((next) => next ? watch(next) : navigator.serviceWorker.ready.then(watch));
    return () => { registration?.removeEventListener('updatefound', inspect); registration?.installing?.removeEventListener('statechange', inspect); };
  }, []);

  if (!waiting) return null;
  return <View style={styles.wrap}><Text style={styles.text}>Uma nova versão do site está pronta.</Text><Pressable onPress={() => waiting.postMessage({ type: 'SKIP_WAITING' })} style={styles.button}><Text style={styles.buttonText}>ATUALIZAR</Text></Pressable></View>;
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: 16, bottom: 18, zIndex: 20, maxWidth: 360, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#111', borderWidth: 1, borderColor: '#303030', borderRadius: radius.md, padding: 12 },
  text: { flex: 1, color: colors.text, fontSize: 12 }, button: { borderRadius: radius.pill, backgroundColor: colors.green, paddingHorizontal: 14, paddingVertical: 10 }, buttonText: { color: colors.black, fontSize: 10, fontWeight: '900' }
});
