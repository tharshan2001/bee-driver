import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { haptics } from '../../../shared/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../core/api/client';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextField from '../../../shared/components/TextField';

export default function SetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { clearMustChangePassword } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSetPassword() {
    setError('');
    if (!currentPassword || !newPassword) {
      haptics.error();
      setError('All fields are required');
      return;
    }
    if (newPassword.length < 6) {
      haptics.error();
      setError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      haptics.error();
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      clearMustChangePassword();
      haptics.success();
      toast.show({ type: 'success', title: 'Password set successfully' });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to set password';
      haptics.error();
      setError(msg.replace('Exception: ', ''));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 16 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Set Your Password</Text>
        <Text style={styles.subtitle}>Required before your first delivery</Text>

        <View style={styles.form}>
          <TextField label="CURRENT PASSWORD" password value={currentPassword} onChangeText={setCurrentPassword}
            placeholder="Enter current password" />
          <TextField label="NEW PASSWORD" password value={newPassword} onChangeText={setNewPassword}
            placeholder="At least 6 characters" />
          <TextField label="CONFIRM NEW PASSWORD" password value={confirmPassword} onChangeText={setConfirmPassword}
            placeholder="Re-enter new password" />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Set Password" onPress={handleSetPassword} loading={loading} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  title: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary },
  subtitle: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary, marginBottom: 18 },
  form: { width: '100%' },
  error: { fontFamily: 'IBMPlexSans_400Regular', color: colors.danger, fontSize: 13, marginTop: 16 },
});
