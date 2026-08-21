import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/theme/tokens';

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

export function RGBLoader({ label = 'Sincronizando sinal...', size = 54 }: { label?: string; size?: number }) {
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <View style={styles.wrap}>
      <AnimatedGradient
        colors={gradients.rgb}
        style={[styles.ring, { width: size, height: size, borderRadius: size / 2, transform: [{ rotate }] }]}
      >
        <View style={{ width: size - 10, height: size - 10, borderRadius: (size - 10) / 2, backgroundColor: colors.black }} />
      </AnimatedGradient>
      {!!label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', gap: 12 },
  ring: { alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.muted, fontSize: 13, letterSpacing: 0.4 }
});
