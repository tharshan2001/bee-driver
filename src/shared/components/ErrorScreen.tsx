import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface ErrorScreenProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorScreen({ message, onRetry }: ErrorScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>!</Text>
      </View>
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
  iconBox: {
    width: 48, height: 48, borderRadius: 4, borderWidth: 2, borderColor: colors.danger,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  icon: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 24, color: colors.danger },
  message: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 16, textAlign: 'center',
    color: colors.textSecondary, marginBottom: 24,
  },
  button: {
    backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: 10,
  },
  buttonText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textOnPrimary },
});
