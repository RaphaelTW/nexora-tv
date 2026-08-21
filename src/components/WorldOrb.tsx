import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '@/theme/tokens';

export function WorldOrb() {
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
    ]));
    loop.start();
    return () => loop.stop();
  }, [pulse]);
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });
  return (
    <View style={styles.stage}>
      <Animated.View style={[styles.halo, { transform: [{ scale }], opacity }]} />
      <LinearGradient colors={gradients.brand} style={styles.orb}>
        <View style={styles.innerOrb}><Text style={styles.globe}>🌍</Text></View>
      </LinearGradient>
      <View style={[styles.dot, styles.dotA]} />
      <View style={[styles.dot, styles.dotB]} />
      <View style={[styles.dot, styles.dotC]} />
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { width: 210, height: 210, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 176, height: 176, borderRadius: 88, borderWidth: 1, borderColor: colors.violet },
  orb: { width: 136, height: 136, borderRadius: 68, padding: 2.5, alignItems: 'center', justifyContent: 'center' },
  innerOrb: { width: 126, height: 126, borderRadius: 63, backgroundColor: colors.black, alignItems: 'center', justifyContent: 'center' },
  globe: { fontSize: 72 },
  dot: { position: 'absolute', width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  dotA: { top: 26, right: 30 },
  dotB: { left: 18, bottom: 52, backgroundColor: colors.purple },
  dotC: { right: 12, bottom: 76, backgroundColor: colors.cyan }
});
