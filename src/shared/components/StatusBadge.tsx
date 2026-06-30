import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface BadgeProps {
  status: string;
  compact?: boolean;
}

const badgeColors: Record<string, { ring: string; tint: string }> = {
  PENDING: { ring: colors.textTertiary, tint: 'transparent' },
  ASSIGNED: { ring: colors.success, tint: colors.successTint },
  PICKED_UP: { ring: colors.warning, tint: colors.warningTint },
  IN_TRANSIT: { ring: colors.warning, tint: colors.warningTint },
  DELIVERED: { ring: colors.success, tint: colors.successTint },
  FAILED: { ring: colors.danger, tint: colors.dangerTint },
  FAILED_PERMANENT: { ring: colors.danger, tint: colors.dangerTint },
  APPROVED: { ring: colors.success, tint: colors.successTint },
  REJECTED: { ring: colors.danger, tint: colors.dangerTint },
};

export default function Badge({ status, compact = false }: BadgeProps) {
  const s = status.toUpperCase();
  const def = badgeColors[s] || { ring: colors.textTertiary, tint: 'transparent' };
  const label = status.replace(/_/g, ' ');

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <View style={[styles.compactDot, { backgroundColor: def.ring }]} />
        <Text style={[styles.compactLabel, { color: def.ring }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.pill, { borderColor: def.ring, backgroundColor: def.tint }]}>
      <Text style={[styles.pillText, { color: def.ring }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  pillText: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  compactDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  compactLabel: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});
