import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Touchable from './Touchable';
import { colors } from '../theme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'default' | 'accent';
  padding?: number;
  style?: ViewStyle;
}

export default function Card({
  children,
  onPress,
  variant = 'default',
  padding = 16,
  style,
}: CardProps) {
  const bgMap = { default: colors.elevated, accent: colors.primaryTint };
  const inner = (
    <View style={[styles.base, { backgroundColor: bgMap[variant], padding }, style]}>
      {children}
    </View>
  );
  if (onPress) return <Touchable onPress={onPress}>{inner}</Touchable>;
  return inner;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 10,
    boxShadow: '0px 2px 12px rgba(0,0,0,0.08)',
    elevation: 3,
  },
});
