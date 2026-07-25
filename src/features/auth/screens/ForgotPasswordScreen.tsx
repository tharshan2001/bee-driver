import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView,
  Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../../../core/api/client';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const toast = useToast();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validateEmail() {
    const errs: Record<string, string> = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.email = 'Invalid email';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validateOtp() {
    const errs: Record<string, string> = {};
    if (!otp.trim()) errs.otp = 'OTP is required';
    else if (!/^\d{6}$/.test(otp.trim())) errs.otp = 'Enter 6-digit OTP';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function validatePassword() {
    const errs: Record<string, string> = {};
    if (!newPassword) errs.password = 'New password is required';
    else if (newPassword.length < 8) errs.password = 'Min 8 characters';
    else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])/.test(newPassword)) {
      errs.password = 'Uppercase, lowercase, digit & special char';
    }
    if (newPassword !== confirmPassword) errs.confirm = 'Passwords do not match';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSendOtp() {
    if (!validateEmail()) return;
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.show({ type: 'info', title: 'OTP sent', message: 'Check your email and phone for the OTP.' });
      setStep('otp');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send OTP';
      toast.show({ type: 'error', title: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp() {
    if (!validateOtp()) return;
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email: email.trim(), otp: otp.trim() });
      const token = res.data?.data?.resetToken;
      if (!token) throw new Error('No reset token received');
      setResetToken(token);
      toast.show({ type: 'success', title: 'Verified', message: 'Create your new password.' });
      setStep('reset');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid OTP';
      toast.show({ type: 'error', title: msg });
    } finally {
      setLoading(false);
    }
  }

  async function handleResetPassword() {
    if (!validatePassword()) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { resetToken, newPassword });
      toast.show({ type: 'success', title: 'Password reset', message: 'Please sign in.' });
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to reset password';
      toast.show({ type: 'error', title: msg });
    } finally {
      setLoading(false);
    }
  }

  function renderStep() {
    if (step === 'email') {
      return (
        <View style={styles.form}>
          <Text style={styles.description}>Enter your email and we will send a verification code.</Text>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="driver@example.com"
            placeholderTextColor={colors.textTertiary}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleSendOtp} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.buttonText}>Send OTP</Text>}
          </TouchableOpacity>
        </View>
      );
    }

    if (step === 'otp') {
      return (
        <View style={styles.form}>
          <Text style={styles.description}>Enter the 6-digit code sent to your email/phone.</Text>
          <Text style={styles.label}>VERIFICATION CODE</Text>
          <TextInput
            style={[styles.input, errors.otp && styles.inputError]}
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
            placeholder="000000"
            placeholderTextColor={colors.textTertiary}
          />
          {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleVerifyOtp} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.buttonText}>Verify</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={() => setStep('email')}>
            <Text style={styles.linkText}>Back to email</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.form}>
        <Text style={styles.description}>Create a new password for your account.</Text>
        <Text style={styles.label}>NEW PASSWORD</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showNew}
            placeholder="Min 8 chars, upper/lower/digit/symbol"
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity onPress={() => setShowNew((v) => !v)} style={styles.eyeBtn}>
            <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <Text style={styles.label}>CONFIRM PASSWORD</Text>
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, styles.passwordInput, errors.confirm && styles.inputError]}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirm}
            placeholder="Re-enter new password"
            placeholderTextColor={colors.textTertiary}
          />
          <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} style={styles.eyeBtn}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        </View>
        {errors.confirm && <Text style={styles.errorText}>{errors.confirm}</Text>}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleResetPassword} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.textOnPrimary} /> : <Text style={styles.buttonText}>Reset Password</Text>}
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Forgot Password</Text>
        {renderStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 16 },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, color: colors.textPrimary, marginBottom: 8,
  },
  description: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textSecondary, marginBottom: 24,
  },
  form: { width: '100%' },
  label: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary,
    marginBottom: 4, marginTop: 16, textTransform: 'uppercase',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    paddingVertical: 10,
    fontSize: 16,
    fontFamily: 'IBMPlexSans_400Regular',
    color: colors.textPrimary,
  },
  inputError: { borderBottomColor: colors.danger },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: 10 },
  errorText: { fontFamily: 'IBMPlexMono_500Medium', color: colors.danger, fontSize: 12, marginTop: 4 },
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
  linkButton: { alignItems: 'center', marginTop: 16 },
  linkText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 14, color: colors.primary },
});
