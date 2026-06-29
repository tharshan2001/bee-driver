import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: colors.canvas, text: '#9E9E9E' },
  ASSIGNED: { bg: colors.accentLight, text: colors.accent },
  PICKED_UP: { bg: '#FFF3E0', text: colors.warning },
  IN_TRANSIT: { bg: '#FFF3E0', text: colors.info },
  DELIVERED: { bg: colors.successLight, text: colors.success },
  FAILED: { bg: colors.dangerLight, text: colors.danger },
  FAILED_PERMANENT: { bg: '#FCE4EC', text: '#B71C1C' },
  APPROVED: { bg: colors.successLight, text: colors.success },
  REJECTED: { bg: colors.dangerLight, text: colors.danger },
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
