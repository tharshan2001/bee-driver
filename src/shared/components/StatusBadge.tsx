import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface StatusBadgeProps {
  status: string;
}

const statusColors: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#F5F5F5', text: '#9E9E9E' },
  ASSIGNED: { bg: '#FFF8E1', text: '#FFC107' },
  PICKED_UP: { bg: '#FFF3E0', text: '#FFA000' },
  IN_TRANSIT: { bg: '#FFF3E0', text: '#F57C00' },
  DELIVERED: { bg: '#E8F5E9', text: '#388E3C' },
  FAILED: { bg: '#FFEBEE', text: '#D32F2F' },
  FAILED_PERMANENT: { bg: '#FCE4EC', text: '#B71C1C' },
  APPROVED: { bg: '#E8F5E9', text: '#388E3C' },
  REJECTED: { bg: '#FFEBEE', text: '#D32F2F' },
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
