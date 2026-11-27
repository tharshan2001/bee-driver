import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Touchable from './Touchable';
import { colors } from '../theme';

interface SectionHeaderProps {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, actionLabel, onAction }: SectionHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction && (
        <Touchable onPress={onAction}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Touchable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 20,
    color: colors.textPrimary,
  },
  action: {
    fontFamily: 'IBMPlexSans_500Medium',
    fontSize: 13,
    color: colors.primaryText,
  },
});
