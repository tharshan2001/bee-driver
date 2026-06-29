import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../core/api/client';
import type { DriverProfile } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import { formatDate } from '../../../core/utils/helpers';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../shared/theme';

type Nav = RootStackNav;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { logout } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');

  useEffect(() => {
    api.get('/driver/profile').then((res) => {
      if (res.data?.success && res.data?.data) {
        const p = res.data.data as DriverProfile;
        setProfile(p);
        setFirstName(p.firstName);
        setLastName(p.lastName);
        setPhone(p.phoneNumber || '');
        setLicense(p.licenseNumber || '');
      }
    }).catch((err: any) => {
      Alert.alert('Error', err?.message || 'Failed to load profile');
    });
  }, []);

  async function saveProfile() {
    setSaving(true);
    try {
      await api.patch('/driver/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phone.trim(),
        licenseNumber: license.trim(),
      });
      Alert.alert('Success', 'Profile updated');
      setProfile((prev) => prev ? { ...prev, firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber: phone.trim(), licenseNumber: license.trim() } : prev);
      setEditing(false);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      try {
        const formData = new FormData();
        formData.append('photo', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: 'avatar.jpg',
        } as any);
        await api.post('/driver/profile/photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const res = await api.get('/driver/profile');
        if (res.data?.success && res.data?.data) {
          setProfile(res.data.data as DriverProfile);
        }
        Alert.alert('Success', 'Profile photo updated');
      } catch (err: any) {
        Alert.alert('Error', err?.response?.data?.message || 'Failed to upload photo');
      }
    }
  }

  if (!profile) return <View style={styles.center}><Text>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerSection}>
        <TouchableOpacity onPress={pickPhoto}>
          <View style={styles.avatar}>
            {profile.photoUrl ? (
              <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{profile.firstName[0]}{profile.lastName[0]}</Text>
            )}
            <View style={styles.cameraIcon}><Text style={{ fontSize: 14 }}>📷</Text></View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>First Name</Text>
        <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} editable={editing} />
        <Text style={styles.label}>Last Name</Text>
        <TextInput style={styles.input} value={lastName} onChangeText={setLastName} editable={editing} />
        <Text style={styles.label}>Phone Number</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} editable={editing} keyboardType="phone-pad" />
        <Text style={styles.label}>License Number</Text>
        <TextInput style={styles.input} value={license} onChangeText={setLicense} editable={editing} />

        {editing && (
          <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.staticInfo}>
        <InfoRow label="Email" value={profile.email} />
        <InfoRow label="Driver ID" value={profile.id} />
        <InfoRow label="Member Since" value={formatDate(profile.memberSince)} />
      </View>

      <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('ChangePassword')}>
        <Text style={styles.menuText}>🔒 Change Password</Text>
        <Text style={{ color: colors.textMuted }}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: colors.card },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { color: colors.textOnPrimary, fontSize: 28, fontWeight: 'bold' },
  cameraIcon: { position: 'absolute', bottom: 0, right: -4, backgroundColor: colors.card, borderRadius: 12, padding: 4 },
  editText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  form: { backgroundColor: colors.card, marginTop: 16, padding: 16 },
  label: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, marginBottom: 4, marginTop: 12 },
  input: { backgroundColor: colors.canvas, borderRadius: 8, padding: 12, fontSize: 16, color: colors.textPrimary },
  saveButton: { backgroundColor: colors.primary, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  saveButtonText: { color: colors.textOnPrimary, fontSize: 16, fontWeight: '600' },
  staticInfo: { backgroundColor: colors.card, marginTop: 16, padding: 16 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.canvas },
  infoLabel: { color: colors.textSecondary },
  infoValue: { fontWeight: '600', color: colors.textPrimary },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.card, marginTop: 16, padding: 16 },
  menuText: { fontSize: 16, color: colors.textPrimary },
  logoutButton: { backgroundColor: colors.card, marginTop: 8, padding: 16, alignItems: 'center' },
  logoutText: { fontSize: 16, color: colors.danger, fontWeight: '600' },
});
