import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>⚠️</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles.button} onPress={onRetry}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  icon: { fontSize: 48, marginBottom: 16 },
  message: { fontSize: 16, textAlign: 'center', color: '#666', marginBottom: 24 },
  button: { backgroundColor: '#1A237E', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 },
  buttonText: { color: '#fff', fontWeight: '600' },
});
