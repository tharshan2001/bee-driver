import React, { useCallback, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../core/api/client';
import { cacheData, getCachedData } from '../../../core/storage/storage';
import type { Alert as AlertType } from '../../../core/api/types';
import EmptyState from '../../../shared/components/EmptyState';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import { timeAgo } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get('/alerts');
      const raw = res.data?.data;
      const arr = Array.isArray(raw) ? raw : raw?.content;
      if (Array.isArray(arr)) {
        setData(arr);
        cacheData('alerts', arr);
      } else {
        setData([]);
      }
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

  const iconMap: Record<string, string> = { WARNING: '⚠️', DELIVERY: '🚚', SYSTEM: '⚙️', INFO: 'ℹ️' };

  return (
    <View style={styles.container}>
      {Array.isArray(data) && data.some((a) => !a.read) && (
        <TouchableOpacity style={styles.markAllBtn} onPress={markAllRead}>
          <Text style={styles.markAllText}>Mark all as read</Text>
        </TouchableOpacity>
      )}
      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.item, !item.read && styles.itemUnread]}
            onPress={() => markRead(item.id)}
          >
            <Text style={styles.icon}>{iconMap[item.type?.toUpperCase()] || 'ℹ️'}</Text>
            <View style={styles.content}>
              <Text style={[styles.title, !item.read && styles.titleUnread]}>{item.title}</Text>
              <Text style={styles.message} numberOfLines={2}>{item.message}</Text>
              <Text style={styles.time}>{timeAgo(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />}
        ListEmptyComponent={<EmptyState icon="🔔" title="No alerts" subtitle="You're all caught up!" />}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : { padding: 16, paddingBottom: insets.bottom + 16 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  markAllBtn: { padding: 12, alignItems: 'flex-end', paddingRight: 16 },
  markAllText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  item: { flexDirection: 'row', backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8, alignItems: 'center' },
  itemUnread: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  icon: { fontSize: 24, marginRight: 12 },
  content: { flex: 1 },
  title: { fontSize: 14, color: colors.textPrimary },
  titleUnread: { fontWeight: '600' },
  message: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginLeft: 8 },
});
