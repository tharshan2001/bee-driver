import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
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

  if (!profile) return <View style={styles.center}><Text style={{ fontFamily: 'IBMPlexSans_400Regular' }}>Loading...</Text></View>;

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
            <View style={styles.cameraIcon}>
              <Ionicons name="camera-outline" size={12} color={colors.textPrimary} />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setEditing(!editing)}>
          <Text style={styles.editText}>{editing ? 'Cancel' : 'Edit'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.formCard}>
        <InputField label="FIRST NAME" value={firstName} onChange={setFirstName} editable={editing} />
        <InputField label="LAST NAME" value={lastName} onChange={setLastName} editable={editing} />
        <InputField label="PHONE NUMBER" value={phone} onChange={setPhone} editable={editing} keyboardType="phone-pad" />
        <InputField label="LICENSE NUMBER" value={license} onChange={setLicense} editable={editing} />

        {editing && (
          <TouchableOpacity style={styles.saveButton} onPress={saveProfile} disabled={saving}>
            <Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save changes'}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoCard}>
        <InfoRow label="EMAIL" value={profile.email} />
        <InfoRow label="DRIVER ID" value={profile.id} />
        <InfoRow label="MEMBER SINCE" value={formatDate(profile.memberSince)} />
      </View>

      <TouchableOpacity style={styles.menuRow} onPress={() => navigation.navigate('ChangePassword')}>
        <Ionicons name="key-outline" size={18} color={colors.textTertiary} style={{ marginRight: 12 }} />
        <Text style={styles.menuText}>Change password</Text>
        <Text style={{ color: colors.textTertiary, fontFamily: 'IBMPlexMono_500Medium', fontSize: 14 }}>›</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InputField({ label, value, onChange, editable, keyboardType }: {
  label: string; value: string; onChange: (v: string) => void; editable: boolean; keyboardType?: any;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChange}
        editable={editable}
        keyboardType={keyboardType}
      />
    </View>
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
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  headerSection: { alignItems: 'center', paddingVertical: 24 },
  avatar: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primaryTint,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8, overflow: 'hidden',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 24, color: colors.primary },
  cameraIcon: { position: 'absolute', bottom: 2, right: 2, backgroundColor: colors.elevated, borderRadius: 10, shadowColor: colors.shadow, shadowOpacity: 0.1, shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, padding: 4 },
  editText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 14, color: colors.primary },
  formCard: { backgroundColor: colors.elevated, marginTop: 16, padding: 16, borderRadius: 10, marginHorizontal: 16, shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, marginBottom: 4, textTransform: 'uppercase' },
  fieldInput: { borderBottomWidth: 1, borderBottomColor: colors.separator, paddingVertical: 8, fontFamily: 'IBMPlexSans_400Regular', fontSize: 16, color: colors.textPrimary },
  saveButton: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 8 },
  saveButtonText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textOnPrimary },
  infoCard: { backgroundColor: colors.elevated, marginTop: 16, padding: 16, borderRadius: 10, marginHorizontal: 16, shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  infoLabel: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase' },
  infoValue: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.textPrimary },
  menuRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, padding: 16, marginHorizontal: 16 },
  menuText: { flex: 1, fontFamily: 'IBMPlexSans_400Regular', fontSize: 16, color: colors.textPrimary },
  logoutRow: { marginTop: 8, padding: 16, alignItems: 'center', marginHorizontal: 16 },
  logoutText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.danger },
});
