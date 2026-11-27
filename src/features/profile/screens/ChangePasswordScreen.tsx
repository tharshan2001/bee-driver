import React, { useState } from 'react';
import { StyleSheet, Alert, ScrollView } from 'react-native';
import { haptics } from '../../../shared/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import api from '../../../core/api/client';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextField from '../../../shared/components/TextField';

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleChange() {
    if (!currentPassword || !newPassword) { haptics.error(); return Alert.alert('Error', 'All fields required'); }
    if (newPassword.length < 6) { haptics.error(); return Alert.alert('Error', 'New password min 6 characters'); }
    if (newPassword !== confirmPassword) { haptics.error(); return Alert.alert('Error', 'Passwords do not match'); }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      haptics.success();
      toast.show({ type: 'success', title: 'Password changed successfully' });
      navigation.goBack();
    } catch (err: any) {
      haptics.error();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}>
      <TextField label="CURRENT PASSWORD" password value={currentPassword} onChangeText={setCurrentPassword}
        placeholder="Enter current password" />
      <TextField label="NEW PASSWORD" password value={newPassword} onChangeText={setNewPassword}
        placeholder="At least 6 characters" />
      <TextField label="CONFIRM NEW PASSWORD" password value={confirmPassword} onChangeText={setConfirmPassword}
        placeholder="Re-enter new password" />
      <Button title="Change Password" onPress={handleChange} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 4 },
});
