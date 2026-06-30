import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface EmptyStateProps {
  illustration?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ illustration, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {illustration ? (
        <Text style={styles.illustration}>{illustration}</Text>
      ) : (
        <View style={styles.placeholder}>
          <View style={styles.line} />
          <View style={[styles.line, { width: '60%' }]} />
        </View>
      )}
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  illustration: { fontSize: 48, marginBottom: 16 },
  placeholder: { width: 80, height: 60, justifyContent: 'center', gap: 8, marginBottom: 16 },
  line: { height: 2, backgroundColor: colors.separator, borderRadius: 1 },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, color: colors.textPrimary, textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 8,
  },
});
