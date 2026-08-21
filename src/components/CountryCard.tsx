import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { FocusCard } from './FocusCard';
import { GradientBorder } from './GradientBorder';
import { colors, radius, spacing } from '@/theme/tokens';
import type { Country } from '@/types/iptv';

export function CountryCard({ country, pinned, onTogglePin }: { country: Country; pinned?: boolean; onTogglePin?: () => void }) {
  return (
    <FocusCard onPress={() => router.push(`/country/${country.code}` as never)}>
      {({ focused }: any) => (
        <GradientBorder focused={focused} radiusValue={radius.lg} style={styles.border}>
          <View style={styles.card}>
            <View style={styles.top}>
              <Text style={styles.flag}>{country.flag || '🌍'}</Text>
              <Text
                onPress={(event) => { event.stopPropagation?.(); onTogglePin?.(); }}
                style={[styles.pin, pinned && styles.pinActive]}
              >
                {pinned ? '★' : '☆'}
              </Text>
            </View>
            <Text style={styles.name} numberOfLines={1}>{country.name}</Text>
            <Text style={styles.code}>{country.code} · abrir canais</Text>
          </View>
        </GradientBorder>
      )}
    </FocusCard>
  );
}

const styles = StyleSheet.create({
  border: { minHeight: 158 },
  card: { flex: 1, padding: spacing.md, justifyContent: 'space-between' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  flag: { fontSize: 42 },
  pin: { color: colors.muted, fontSize: 24, padding: 4 },
  pinActive: { color: colors.green },
  name: { color: colors.text, fontWeight: '800', fontSize: 18 },
  code: { color: colors.muted, fontSize: 12, letterSpacing: 0.7 }
});
