import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../../../core/api/client';
import { colors } from '../../../shared/theme';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    if (!currentPassword || !newPassword) return Alert.alert('Error', 'All fields required');
    if (newPassword.length < 6) return Alert.alert('Error', 'New password min 6 characters');
    if (newPassword !== confirmPassword) return Alert.alert('Error', 'Passwords do not match');

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      Alert.alert('Success', 'Password changed successfully');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
      <Field label="CURRENT PASSWORD" value={currentPassword} onChange={setCurrentPassword} secure />
      <Field label="NEW PASSWORD" value={newPassword} onChange={setNewPassword} secure />
      <Field label="CONFIRM NEW PASSWORD" value={confirmPassword} onChange={setConfirmPassword} secure />
      <TouchableOpacity style={styles.button} onPress={handleChange} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Changing...' : 'Change Password'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, value, onChange, secure }: { label: string; value: string; onChange: (v: string) => void; secure?: boolean }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  fieldGroup: { marginBottom: 24 },
  label: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, marginBottom: 6, textTransform: 'uppercase' },
  input: { borderBottomWidth: 1, borderBottomColor: colors.separator, paddingVertical: 8, fontFamily: 'IBMPlexSans_400Regular', fontSize: 16, color: colors.textPrimary },
  button: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textOnPrimary },
});
