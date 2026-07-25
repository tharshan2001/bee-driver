import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../core/api/client';
import type { DriverProfile } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';

export default function MoreScreen() {
  const navigation = useNavigation<RootStackNav>();
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { availability, setAvailability, logout } = useAuth();
  const [profile, setProfile] = useState<DriverProfile | null>(null);

  useEffect(() => {
    api.get('/driver/profile').then((res) => {
      if (res.data?.success && res.data?.data) {
        setProfile(res.data.data as DriverProfile);
      }
    }).catch(() => {});
  }, []);

  function toggleAvailability(value: boolean) {
    Alert.alert(
      'Change Status',
      value ? 'Go online and start receiving deliveries?' : 'Go offline and stop receiving deliveries?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await setAvailability(value);
              toast.show({ type: 'success', title: value ? 'You are now online' : 'You are now offline' });
            } catch {
              toast.show({ type: 'error', title: 'Failed to change status' });
            }
          },
        },
      ],
    );
  }

  function handleLogout() {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  }

  const initials = profile
    ? `${profile.firstName[0]}${profile.lastName[0]}`
    : '??';

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.headerTitle}>More</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            {profile?.photoUrl ? (
              <Text style={styles.avatarText}>{initials}</Text>
            ) : (
              <Text style={styles.avatarText}>{initials}</Text>
            )}
          </View>
          <Text style={styles.profileName}>
            {profile ? `${profile.firstName} ${profile.lastName}` : 'Driver'}
          </Text>
          <Text style={styles.profileEmail}>{profile?.email || ''}</Text>

          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View style={[styles.statusDot, { backgroundColor: availability ? colors.success : colors.danger }]} />
              <Text style={[styles.statusText, { color: availability ? colors.success : colors.danger }]}>
                {availability ? 'ONLINE' : 'OFFLINE'}
              </Text>
            </View>
            <Switch
              value={availability}
              onValueChange={toggleAvailability}
              trackColor={{ false: colors.separator, true: colors.primary }}
              thumbColor={colors.background}
            />
          </View>
        </View>

        {/* Menu Rows */}
        <View style={styles.menuSection}>
          <MenuRow
            icon="receipt-outline"
            label="Expenses"
            onPress={() => navigation.navigate('Expenses')}
          />
          <MenuRow
            icon="bar-chart-outline"
            label="Statistics"
            onPress={() => navigation.navigate('Stats')}
          />
          <MenuRow
            icon="key-outline"
            label="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
          />
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function MenuRow({ icon, label, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.6}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} style={{ marginRight: 14 }} />
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary,
  },
  profileHeader: {
    alignItems: 'center', paddingVertical: 24, paddingHorizontal: 16,
    marginBottom: 8,
  },
  avatar: {
    width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primaryTint,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  avatarText: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 24, color: colors.primary,
  },
  profileName: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, color: colors.textPrimary,
  },
  profileEmail: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textTertiary,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    width: '100%', marginTop: 16, backgroundColor: colors.surface,
    paddingHorizontal: 16, paddingVertical: 12, borderRadius: 10,
  },
  statusLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, textTransform: 'uppercase',
  },
  menuSection: {
    marginHorizontal: 16, backgroundColor: colors.surface, borderRadius: 10,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.separator,
  },
  menuLabel: {
    flex: 1, fontFamily: 'IBMPlexSans_400Regular', fontSize: 15, color: colors.textPrimary,
  },
  menuArrow: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 18, color: colors.textTertiary,
  },
  logoutRow: {
    marginTop: 24, marginHorizontal: 16, alignItems: 'center',
    paddingVertical: 14, backgroundColor: colors.surface, borderRadius: 10,
  },
  logoutText: {
    fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.danger,
  },
});
