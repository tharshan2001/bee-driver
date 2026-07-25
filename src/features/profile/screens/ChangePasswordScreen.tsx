import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../../../core/api/client';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    if (!currentPassword || !newPassword) return Alert.alert('Error', 'All fields required');
    if (newPassword.length < 6) return Alert.alert('Error', 'New password min 6 characters');
    if (newPassword !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.show({ type: 'success', title: 'Password changed successfully' });
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
      <PasswordField
        label="CURRENT PASSWORD"
        value={currentPassword}
        onChange={setCurrentPassword}
        visible={showCurrent}
        toggle={() => setShowCurrent((v) => !v)}
      />
      <PasswordField
        label="NEW PASSWORD"
        value={newPassword}
        onChange={setNewPassword}
        visible={showNew}
        toggle={() => setShowNew((v) => !v)}
      />
      <PasswordField
        label="CONFIRM NEW PASSWORD"
        value={confirmPassword}
        onChange={setConfirmPassword}
        visible={showConfirm}
        toggle={() => setShowConfirm((v) => !v)}
      />
      <TouchableOpacity style={styles.button} onPress={handleChange} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Changing...' : 'Change Password'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PasswordField({ label, value, onChange, visible, toggle }: {
  label: string; value: string; onChange: (v: string) => void; visible: boolean; toggle: () => void;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={[styles.input, styles.passwordInput]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!visible}
          placeholderTextColor={colors.textTertiary}
        />
        <TouchableOpacity onPress={toggle} style={styles.eyeBtn}>
          <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  fieldGroup: { marginBottom: 24 },
  label: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, marginBottom: 6, textTransform: 'uppercase' },
  input: { borderBottomWidth: 1, borderBottomColor: colors.separator, paddingVertical: 8, fontFamily: 'IBMPlexSans_400Regular', fontSize: 16, color: colors.textPrimary },
  passwordRow: { flexDirection: 'row', alignItems: 'center' },
  passwordInput: { flex: 1 },
  eyeBtn: { padding: 10 },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textOnPrimary },
});
