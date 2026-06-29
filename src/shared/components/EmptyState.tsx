import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface EmptyStateProps {
  icon?: string;
  title: string;
  subtitle?: string;
}

export default function EmptyState({ icon = '📭', title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 48 },
  icon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 18, fontWeight: '600', color: '#666', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#999', textAlign: 'center', marginTop: 8 },
});
