import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import Touchable from '../../../shared/components/Touchable';
import { haptics } from '../../../shared/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../../../core/api/client';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextField, { fieldLabel } from '../../../shared/components/TextField';

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
      haptics.confirm();
      toast.show({ type: 'info', title: 'OTP sent', message: 'Check your email and phone for the OTP.' });
      setStep('otp');
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send OTP';
      haptics.error();
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
      haptics.confirm();
      toast.show({ type: 'success', title: 'Verified', message: 'Create your new password.' });
      setStep('reset');
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Invalid OTP';
      haptics.error();
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
      haptics.success();
      toast.show({ type: 'success', title: 'Password reset', message: 'Please sign in.' });
      navigation.goBack();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to reset password';
      haptics.error();
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
          <TextField label="EMAIL" value={email} onChangeText={setEmail} error={errors.email}
            keyboardType="email-address" autoCapitalize="none" placeholder="driver@example.com" />
          <Button title="Send OTP" onPress={handleSendOtp} loading={loading} />
        </View>
      );
    }

    if (step === 'otp') {
      return (
        <View style={styles.form}>
          <Text style={styles.description}>Enter the 6-digit code sent to your email/phone.</Text>
          <Text style={fieldLabel}>VERIFICATION CODE</Text>
          <CodeInput value={otp} onChange={setOtp} error={!!errors.otp} />
          {errors.otp && <Text style={styles.errorText}>{errors.otp}</Text>}
          <Button title="Verify" onPress={handleVerifyOtp} loading={loading} />
          <Touchable style={styles.linkButton} onPress={() => setStep('email')}>
            <Text style={styles.linkText}>Back to email</Text>
          </Touchable>
        </View>
      );
    }

    return (
      <View style={styles.form}>
        <Text style={styles.description}>Create a new password for your account.</Text>
        <TextField label="NEW PASSWORD" password value={newPassword} onChangeText={setNewPassword} error={errors.password}
          placeholder="Min 8 chars, upper/lower/digit/symbol" />
        <TextField label="CONFIRM PASSWORD" password value={confirmPassword} onChangeText={setConfirmPassword}
          error={errors.confirm} placeholder="Re-enter new password" />
        <Button title="Reset Password" onPress={handleResetPassword} loading={loading} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={[styles.bar, { marginTop: insets.top }]}>
        <Touchable onPress={() => navigation.goBack()} style={styles.backBtn} accessibilityRole="button" accessibilityLabel="Back">
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </Touchable>
        <Text style={styles.title}>Forgot Password</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]} keyboardShouldPersistTaps="handled">
        {renderStep()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/** Six boxes showing what is typed into one hidden number field. */
function CodeInput({ value, onChange, error }: { value: string; onChange: (v: string) => void; error: boolean }) {
  return (
    <View>
      <View style={styles.boxes}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.codeBox, i === value.length && styles.codeBoxNext, error && styles.codeBoxError]}>
            <Text style={styles.codeDigit}>{value[i] ?? ''}</Text>
          </View>
        ))}
      </View>
      <TextInput
        style={styles.codeHidden}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, ''))}
        keyboardType="number-pad"
        maxLength={6}
        caretHidden
        autoFocus
        textContentType="oneTimeCode"
        accessibilityLabel="Verification code"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', minHeight: 56, paddingHorizontal: 8, gap: 8 },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 17, color: colors.textPrimary },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  description: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 15, color: colors.textPrimary, marginBottom: 2 },
  form: { width: '100%' },
  errorText: { fontFamily: 'IBMPlexSans_400Regular', color: colors.danger, fontSize: 12, marginTop: 4 },
  boxes: { flexDirection: 'row', gap: 8 },
  codeBox: {
    flex: 1, height: 52, borderRadius: 10, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  codeBoxNext: { borderWidth: 1.5, borderColor: colors.primaryDeep },
  codeBoxError: { borderWidth: 1, borderColor: colors.danger },
  codeDigit: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 20, color: colors.textPrimary },
  codeHidden: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  linkButton: { alignItems: 'center', paddingVertical: 12 },
  linkText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 13, color: colors.primaryText },
});
