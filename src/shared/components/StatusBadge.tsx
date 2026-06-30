import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface StampBadgeProps {
  status: string;
  compact?: boolean;
}

const stampColors: Record<string, { ring: string; tint: string }> = {
  PENDING: { ring: colors.textMuted, tint: 'transparent' },
  ASSIGNED: { ring: colors.success, tint: colors.successTint },
  PICKED_UP: { ring: colors.warning, tint: colors.warningTint },
  IN_TRANSIT: { ring: colors.warning, tint: colors.warningTint },
  DELIVERED: { ring: colors.success, tint: colors.successTint },
  FAILED: { ring: colors.danger, tint: colors.dangerTint },
  FAILED_PERMANENT: { ring: colors.danger, tint: colors.dangerTint },
  APPROVED: { ring: colors.success, tint: colors.successTint },
  REJECTED: { ring: colors.danger, tint: colors.dangerTint },
};

export default function StampBadge({ status, compact = false }: StampBadgeProps) {
  const s = status.toUpperCase();
  const def = stampColors[s] || { ring: colors.textMuted, tint: 'transparent' };
  const label = status.replace(/_/g, ' ');

  if (compact) {
    return (
      <View style={styles.compactRow}>
        <View style={[styles.compactTick, { backgroundColor: def.ring }]} />
        <Text style={[styles.compactLabel, { color: def.ring }]}>{label}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.stampCircle, { borderColor: def.ring, backgroundColor: def.tint }]}>
      <Text style={[styles.stampText, { color: def.ring }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stampCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '-6deg' }],
  },
  stampText: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 9,
    textTransform: 'uppercase',
    textAlign: 'center',
    lineHeight: 10,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactTick: {
    width: 6,
    height: 6,
    borderRadius: 1,
  },
  compactLabel: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 11,
    textTransform: 'uppercase',
  },
});
