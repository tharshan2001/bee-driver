import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import api from '../../../core/api/client';
import { cacheData, getCachedData } from '../../../core/storage/storage';
import type { Alert as AlertType } from '../../../core/api/types';
import EmptyState from '../../../shared/components/EmptyState';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import { timeAgo } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

function remoteMessageToAlert(remoteMessage: any): AlertType | null {
  const data = remoteMessage?.data;
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, any>;
  if (!d.type || !d.title) return null;
  return {
    id: remoteMessage.messageId || Date.now().toString(),
    type: d.type as string,
    title: d.title as string,
    message: (d.message || d.body || '') as string,
    read: false,
    createdAt: new Date().toISOString(),
  } as AlertType;
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setError(null);
    try {
      const [res, cachedPush] = await Promise.all([
        api.get('/alerts'),
        getCachedData<AlertType[]>('push-alerts'),
      ]);
      const raw = res.data?.data;
      const apiAlerts: AlertType[] = Array.isArray(raw) ? raw : raw?.content ?? [];
      const merged = cachedPush
        ? [...cachedPush, ...apiAlerts.filter((a) => !cachedPush.some((p) => p.id === a.id))]
        : apiAlerts;
      merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setData(merged);
      cacheData('alerts', merged);
    } catch (err: any) {
      const cached = await getCachedData<AlertType[]>('alerts');
      if (cached) {
        setData(cached);
      } else {
        setError(err?.message || 'Failed to load alerts');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAlerts(); }, [fetchAlerts]));

  useEffect(() => {
    const unsub = messaging().onMessage((remoteMessage) => {
      const alert = remoteMessageToAlert(remoteMessage);
      if (!alert) return;
      setData((prev) => {
        const next = [alert, ...prev];
        cacheData('alerts', next);
        cacheData('push-alerts', [alert, ...(prev.filter((a) => a.id !== alert.id))]);
        return next;
      });
    });
    return () => unsub();
  }, []);

  async function markRead(id: string) {
    try {
      await api.patch(`/alerts/${id}/read`);
      setData((prev) => prev.map((a) => a.id === id ? { ...a, read: true } : a));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to mark as read');
    }
  }

  async function markAllRead() {
    try {
      await api.patch('/alerts/read-all');
      setData((prev) => prev.map((a) => ({ ...a, read: true })));
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to mark all as read');
    }
  }

  if (error && data.length === 0) {
    return <ErrorScreen message={error} onRetry={() => { setLoading(true); fetchAlerts(); }} />;
  }

  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    WARNING: 'warning-outline', DELIVERY: 'car-outline', SYSTEM: 'settings-outline', INFO: 'information-circle-outline',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        {Array.isArray(data) && data.some((a) => !a.read) && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, !item.read && styles.itemUnread]}
            onPress={() => markRead(item.id)}
          >
            <Ionicons
              name={iconMap[item.type?.toUpperCase()] || 'information-circle-outline'}
              size={20}
              color={colors.textTertiary}
              style={{ marginRight: 12 }}
            />
            <View style={styles.content}>
              <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />}
        ListEmptyComponent={<EmptyState title="No alerts" subtitle="You're all caught up!" />}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : { paddingHorizontal: 16, paddingBottom: insets.bottom + 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginBottom: 8,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary,
  },
  markAllText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 13, color: colors.primary },
  item: {
    flexDirection: 'row', paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: colors.separator, marginHorizontal: 16,
  },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary, paddingLeft: 13 },
  content: { flex: 1 },
  title: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textPrimary },
  titleUnread: { fontFamily: 'IBMPlexSans_500Medium' },
  message: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  time: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 8 },
});
