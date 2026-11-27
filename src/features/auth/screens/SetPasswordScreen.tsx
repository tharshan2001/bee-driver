import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Touchable from '../../../shared/components/Touchable';
import { haptics } from '../../../shared/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../core/api/client';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';
import Bee from '../../../shared/components/Bee';

export default function SetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { clearMustChangePassword } = useAuth();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
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
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Bee height={110} />
        </View>

        <Text style={styles.title}>Set Your Password</Text>
        <Text style={styles.subtitle}>
          Your account requires a new password before you can continue.
        </Text>

        <View style={styles.form}>
          <PasswordField
            label="CURRENT PASSWORD"
            value={currentPassword}
            onChange={setCurrentPassword}
            placeholder="Enter current password"
            visible={showCurrent}
            toggle={() => setShowCurrent((v) => !v)}
          />

          <PasswordField
            label="NEW PASSWORD"
            value={newPassword}
            onChange={setNewPassword}
            placeholder="At least 6 characters"
            visible={showNew}
            toggle={() => setShowNew((v) => !v)}
          />

          <PasswordField
            label="CONFIRM NEW PASSWORD"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Re-enter new password"
            visible={showConfirm}
            toggle={() => setShowConfirm((v) => !v)}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Touchable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.buttonText}>Set Password</Text>
            )}
          </Touchable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PasswordField({ label, value, onChange, placeholder, visible, toggle }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  visible: boolean;
  toggle: () => void;
}) {
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!visible}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
        />
        <Touchable onPress={toggle} style={styles.eyeBtn}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
        </Touchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, color: colors.textPrimary,
  },
  subtitle: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textSecondary, marginBottom: 32,
  },
  form: { width: '100%' },
  label: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary,
    marginBottom: 4, marginTop: 16, textTransform: 'uppercase',
  },
  input: { backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontFamily: 'IBMPlexSans_400Regular', color: colors.textPrimary, },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: 10 },
  error: {
    fontFamily: 'IBMPlexMono_500Medium', color: colors.danger, fontSize: 13, marginTop: 16,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 32,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textOnPrimary,
  },
});
