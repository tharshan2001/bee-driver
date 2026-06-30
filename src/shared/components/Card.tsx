import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme';

interface WaybillCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'accent';
  padding?: number;
  style?: ViewStyle;
}

export default function WaybillCard({
  children,
  onPress,
  variant = 'default',
  padding = 16,
  style,
}: WaybillCardProps) {
  const bgMap = { default: colors.paper, accent: colors.primaryTint };
  const inner = (
    <View style={[styles.base, { backgroundColor: bgMap[variant], padding }, style]}>
      {children}
    </View>
  );
  if (onPress) return <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{inner}</TouchableOpacity>;
  return inner;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
});
