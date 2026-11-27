import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { haptics } from '../../../shared/haptics';
import Touchable from '../../../shared/components/Touchable';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import type { RootStackNav } from '../../../navigation/types';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';
import Bee from '../../../shared/components/Bee';
import { useKeyboardHeight } from '../../../shared/useKeyboardHeight';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RootStackNav>();
  const toast = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [typingPassword, setTypingPassword] = useState(false);
  // The screen draws behind the keyboard, so make room for it ourselves.
  const keyboard = useKeyboardHeight();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  function validate() {
    const errs: typeof errors = {};
    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email.trim()))
      errs.email = 'Invalid email format';
    if (!password) errs.password = 'Password is required';
    else if (password.length < 6) errs.password = 'Min 6 characters';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      haptics.confirm();
    } catch (err: any) {
      let msg: string = err?.response?.data?.message || err?.message || 'Login failed';
      if (msg.startsWith('Invalid role for login')) msg = 'This app is for drivers. Sign in with a driver account.';
      haptics.error();
      toast.show({ type: 'error', title: msg.replace('Exception: ', '') });
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: keyboard || insets.bottom + 16 },
          keyboard > 0 && { justifyContent: 'flex-start', paddingTop: insets.top }]}
        keyboardShouldPersistTaps="handled">
        <View style={[styles.mascot, keyboard > 0 && { marginBottom: 0 }]}>
          {/* Eyelids down while a hidden password is being typed. */}
          <Bee height={keyboard ? 90 : 150} eyesClosed={typingPassword && !showPassword} />
        </View>

        <Text style={styles.title}>Sign in</Text>
        <Text style={[styles.subtitle, keyboard > 0 && { marginBottom: 0 }]}>Enter your driver credentials</Text>

        <View style={styles.form}>
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

          <Text style={styles.label}>PASSWORD</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput, errors.password && styles.inputError]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              onFocus={() => setTypingPassword(true)}
              onBlur={() => setTypingPassword(false)}
              placeholder="Enter password"
              placeholderTextColor={colors.textTertiary}
            />
            <Touchable onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}
              accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
            </Touchable>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          <Touchable
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Touchable>

          <Touchable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.textOnPrimary} />
            ) : (
              <Text style={styles.buttonText}>Sign In</Text>
            )}
          </Touchable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24 },
  mascot: { alignItems: 'center', marginBottom: 16 },
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
  inputError: { borderWidth: 1, borderColor: colors.danger },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: 10 },
  errorText: { fontFamily: 'IBMPlexMono_500Medium', color: colors.danger, fontSize: 12, marginTop: 4 },
  forgotBtn: { alignItems: 'flex-end', marginTop: 8 },
  forgotText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 13, color: colors.primaryText },
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
