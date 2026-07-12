import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Alert as RNAlert,
} from 'react-native';
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

const iconBgMap: Record<string, string> = {
  WARNING: colors.warningTint,
  DELIVERY: '#E3F2FD',
  SYSTEM: colors.surface,
  INFO: '#E8F5E9',
};

const iconColorMap: Record<string, string> = {
  WARNING: colors.warning,
  DELIVERY: '#1976D2',
  SYSTEM: colors.textSecondary,
  INFO: colors.success,
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
  const bgColor = iconBgMap[type] || colors.surface;
  const icColor = iconColorMap[type] || colors.textSecondary;

  async function markRead() {
    try {
      await api.patch(`/alerts/${alertItem.id}/read`);
      setRead(true);
    } catch (err: any) {
      RNAlert.alert('Error', err?.response?.data?.message || 'Failed to mark as read');
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={[styles.iconCard, { backgroundColor: bgColor }]}>
        <View style={[styles.iconCircle, { backgroundColor: icColor + '20' }]}>
          <Ionicons name={icon} size={28} color={icColor} />
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={[styles.typeBadge, { backgroundColor: icColor + '15' }]}>
          <Text style={[styles.typeText, { color: icColor }]}>{type}</Text>
        </View>
        <Text style={styles.time}>{timeAgo(alertItem.createdAt)}</Text>
      </View>

      <Text style={styles.title}>{alertItem.title}</Text>
      <Text style={styles.message}>{alertItem.message}</Text>

      {!read && (
        <TouchableOpacity onPress={markRead} style={styles.markReadBtn}>
          <Ionicons name="checkmark-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.markReadText}>Mark as read</Text>
        </TouchableOpacity>
      )}

      {read && (
        <View style={styles.readRow}>
          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
          <Text style={styles.readText}>Read</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  iconCard: {
    alignItems: 'center', justifyContent: 'center',
    paddingVertical: 32, borderRadius: 16, marginTop: 8,
  },
  iconCircle: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 20, marginBottom: 12,
  },
  typeBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
  },
  typeText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, textTransform: 'uppercase',
  },
  time: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 12, color: colors.textTertiary,
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, color: colors.textPrimary,
    marginBottom: 8,
  },
  message: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 15, color: colors.textSecondary,
    lineHeight: 22,
  },
  markReadBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 28, paddingVertical: 12, paddingHorizontal: 20,
    backgroundColor: colors.primaryTint, borderRadius: 10,
  },
  markReadText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.primaryDeep,
  },
  readRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 28,
  },
  readText: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.success,
  },
});
