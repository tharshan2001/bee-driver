import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'accent' | 'elevated';
  padding?: number;
  style?: ViewStyle;
}

export default function Card({
  children,
  onPress,
  variant = 'default',
  padding = 14,
  style,
}: CardProps) {
  const bgMap = { default: colors.card, accent: colors.primaryPale, elevated: colors.card };
  const inner = (
    <View style={[styles.base, { backgroundColor: bgMap[variant], padding }, variant === 'elevated' && styles.elevated, style]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>;
  return inner;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 24,
    shadowColor: colors.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  elevated: {
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
