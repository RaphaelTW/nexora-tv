import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { gradients, radius } from '@/theme/tokens';

export function GradientBorder({
  children,
  style,
  innerStyle,
  focused = false,
  radiusValue = radius.lg
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  focused?: boolean;
  radiusValue?: number;
}) {
  return (
    <LinearGradient
      colors={gradients.brand}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.border, { borderRadius: radiusValue, padding: focused ? 2.2 : 1.2 }, style]}
    >
      <View style={[styles.inner, { borderRadius: radiusValue - 2 }, innerStyle]}>{children}</View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  border: { overflow: 'hidden' },
  inner: { flex: 1, backgroundColor: '#000000', overflow: 'hidden' }
});
