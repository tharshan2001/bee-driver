import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: colors.canvas, text: colors.textMuted },
  ASSIGNED: { bg: colors.primaryPale, text: colors.successDeep },
  PICKED_UP: { bg: colors.warningLight, text: colors.warningDeep },
  IN_TRANSIT: { bg: colors.infoLight, text: '#0077a3' },
  DELIVERED: { bg: colors.successLight, text: colors.successDeep },
  FAILED: { bg: colors.dangerLight, text: colors.dangerDeep },
  FAILED_PERMANENT: { bg: colors.dangerLight, text: colors.dangerDarkest },
  APPROVED: { bg: colors.successLight, text: colors.successDeep },
  REJECTED: { bg: colors.dangerLight, text: colors.dangerDeep },
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const colors = statusColors[status.toUpperCase()] || { bg: '#F5F5F5', text: '#9E9E9E' };
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        {status.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
