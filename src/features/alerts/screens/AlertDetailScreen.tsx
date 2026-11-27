import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert as RNAlert } from 'react-native';
import Button from '../../../shared/components/Button';
import { haptics } from '../../../shared/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../core/api/client';
import { colors } from '../../../shared/theme';
import { timeAgo } from '../../../core/utils/helpers';
import type { Alert as AlertType } from '../../../core/api/types';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  WARNING: 'warning-outline',
  DELIVERY: 'cube-outline',
  SYSTEM: 'settings-outline',
  INFO: 'information-circle-outline',
};

export default function AlertDetailScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const alertItem: AlertType = route.params?.alert;
  const [read, setRead] = useState(alertItem?.read ?? false);

  if (!alertItem) return null;

  const type = alertItem.type?.toUpperCase() || 'INFO';
  const icon = iconMap[type] || 'information-circle-outline';

  async function markRead() {
    try {
      await api.patch(`/alerts/${alertItem.id}/read`);
      setRead(true);
    } catch (err: any) {
      haptics.error();
      RNAlert.alert('Error', err?.response?.data?.message || 'Failed to mark as read');
    }
  }

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 16 }]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={28} color={colors.textPrimary} />
      </View>
      <Text style={styles.title}>{alertItem.title}</Text>
      <Text style={styles.time}>{timeAgo(alertItem.createdAt)}</Text>
      <Text style={styles.message}>{alertItem.message}</Text>

      {read ? (
        <View style={styles.readRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.readText}>Read</Text>
        </View>
      ) : (
        <Button title="Mark as read" onPress={markRead} style={{ marginTop: 32 }} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16, paddingTop: 8 },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primaryTint,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  title: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22, color: colors.textPrimary },
  time: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textSecondary, marginTop: 4 },
  message: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 15, lineHeight: 22, color: colors.textPrimary, marginTop: 12 },
  readRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 32 },
  readText: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.success },
});
