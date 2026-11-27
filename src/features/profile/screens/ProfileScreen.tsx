import React, { useEffect, useLayoutEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Image } from 'react-native';
import Touchable from '../../../shared/components/Touchable';
import { haptics } from '../../../shared/haptics';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import api from '../../../core/api/client';
import type { DriverProfile } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import { formatDate } from '../../../core/utils/helpers';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';
import TextField from '../../../shared/components/TextField';

type Nav = RootStackNav;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const [profile, setProfile] = useState<DriverProfile | null>(null);
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
    // The server accepts 0XXXXXXXXX only: convert +94 / 94 numbers, and leave an empty phone out.
    const phoneNumber = phone.replace(/[\s-]/g, '').replace(/^(\+94|94)(?=\d{9}$)/, '0');
    try {
      await api.patch('/driver/profile', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber || undefined,
        licenseNumber: license.trim(),
      });
      if (phoneNumber) setPhone(phoneNumber);
      haptics.success();
      toast.show({ type: 'success', title: 'Profile updated' });
      setProfile((prev) => prev ? { ...prev, firstName: firstName.trim(), lastName: lastName.trim(), phoneNumber: phoneNumber || prev.phoneNumber, licenseNumber: license.trim() } : prev);
    } catch (err: any) {
      haptics.error();
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
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
        haptics.success();
        toast.show({ type: 'success', title: 'Profile photo updated' });
      } catch (err: any) {
        haptics.error();
        Alert.alert('Error', err?.response?.data?.message || 'Failed to upload photo');
      }
    }
  }

  // Save sits in the header, always within reach.
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Touchable onPress={saveProfile} disabled={saving || !profile} accessibilityRole="button">
          <Text style={styles.save}>{saving ? 'Saving…' : 'Save'}</Text>
        </Touchable>
      ),
    });
  });

  if (!profile) return <View style={styles.center}><Text style={{ fontFamily: 'IBMPlexSans_400Regular' }}>Loading...</Text></View>;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
      keyboardShouldPersistTaps="handled">
      <Touchable style={styles.headerSection} onPress={pickPhoto} accessibilityRole="button" accessibilityLabel="Change photo">
        <View style={styles.avatar}>
          {profile.photoUrl ? (
            <Image source={{ uri: profile.photoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.avatarText}>{profile.firstName[0]}{profile.lastName[0]}</Text>
          )}
        </View>
        <Text style={styles.link}>Change photo</Text>
      </Touchable>

      <TextField label="FIRST NAME" value={firstName} onChangeText={setFirstName} />
      <TextField label="LAST NAME" value={lastName} onChangeText={setLastName} />
      <TextField label="PHONE NUMBER" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <TextField label="LICENSE NUMBER" value={license} onChangeText={setLicense} />

      <View style={{ marginTop: 16 }}>
        <InfoRow label="EMAIL" value={profile.email} />
        {/* The server sends createdAt. */}
        {!!(profile.createdAt ?? profile.memberSince) && (
          <InfoRow label="MEMBER SINCE" value={formatDate((profile.createdAt ?? profile.memberSince)!)} />
        )}
      </View>
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
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  headerSection: { alignItems: 'center', paddingVertical: 8, gap: 8 },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryTint,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 22, color: colors.primaryText },
  link: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 13, color: colors.primaryText },
  save: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.primaryText, paddingVertical: 8 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  infoLabel: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase' },
  infoValue: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textPrimary },
});
