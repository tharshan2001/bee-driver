import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { haptics } from '../../../shared/haptics';
import Touchable from '../../../shared/components/Touchable';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import type { RootStackNav } from '../../../navigation/types';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';
import Bee from '../../../shared/components/Bee';
import Button from '../../../shared/components/Button';
import TextField from '../../../shared/components/TextField';
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
          <TextField
            label="EMAIL"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="driver@example.com"
          />
          <TextField
            label="PASSWORD"
            password
            value={password}
            onChangeText={setPassword}
            error={errors.password}
            onRevealChange={setShowPassword}
            onFocus={() => setTypingPassword(true)}
            onBlur={() => setTypingPassword(false)}
            placeholder="Enter password"
          />

          <Touchable
            style={styles.forgotBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </Touchable>

          <Button title="Sign In" onPress={handleLogin} loading={loading} style={{ marginTop: 4 }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 16 },
  mascot: { alignItems: 'center', marginBottom: 16 },
  title: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary },
  subtitle: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary, marginBottom: 18 },
  form: { width: '100%' },
  forgotBtn: { alignSelf: 'flex-end', paddingVertical: 12 },
  forgotText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 13, color: colors.primaryText },
});
