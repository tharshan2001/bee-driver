import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet, Alert, Platform } from 'react-native';
import Touchable from '../../../shared/components/Touchable';
import { haptics } from '../../../shared/haptics';
import Appear from '../../../shared/components/Appear';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import messaging from '@react-native-firebase/messaging';
import { showLocalNotification } from '../../../core/notifications/setupNotifications';
import api from '../../../core/api/client';
import { cacheData, getCachedData } from '../../../core/storage/storage';
import type { Alert as AlertType } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import EmptyState from '../../../shared/components/EmptyState';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import { useToast } from '../../../shared/context/ToastContext';
import { timeAgo } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

type Nav = RootStackNav;

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  WARNING: 'warning-outline',
  DELIVERY: 'cube-outline',
  SYSTEM: 'settings-outline',
  INFO: 'information-circle-outline',
};

const iconColorMap: Record<string, string> = {
  WARNING: colors.warning,
  DELIVERY: '#1976D2',
  SYSTEM: colors.textSecondary,
  INFO: colors.success,
};

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

function NotificationCard({ item, index, onPress }: { item: AlertType; index: number; onPress: () => void }) {
  const type = item.type?.toUpperCase() || 'INFO';
  const icon = iconMap[type] || 'information-circle-outline';
  const icColor = iconColorMap[type] || colors.textTertiary;

  return (
    <Appear index={index}>
      <Touchable
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={onPress}
      >
        <View style={styles.iconCircle}>
          <Ionicons name={icon} size={18} color={colors.textPrimary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.cardMessage} numberOfLines={1}>{item.message}</Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} accessibilityLabel="Unread" />}
      </Touchable>
    </Appear>
  );
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const unreadCount = data.filter((a) => !a.read).length;

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
    if (Platform.OS === 'web') return;
    try {
      const unsub = messaging().onMessage(async (remoteMessage) => {
        try {
          const alert = remoteMessageToAlert(remoteMessage);
          if (alert) {
            setData((prev) => {
              const next = [alert, ...prev];
              cacheData('alerts', next);
              cacheData('push-alerts', [alert, ...(prev.filter((a) => a.id !== alert.id))]);
              return next;
            });
            const orderId = remoteMessage?.data?.orderId as string | undefined;
            const isDelivery = alert.type?.toLowerCase().includes('delivery');
            Alert.alert(alert.title, alert.message || '', [
              { text: 'Dismiss', style: 'cancel' },
              {
                text: 'View',
                onPress: () => {
                  if (isDelivery && orderId) {
                    navigation.navigate('DeliveryDetail', { orderId });
                  } else {
                    navigation.navigate('AlertDetail', { alert });
                  }
                },
              },
            ]);
          }
          await showLocalNotification(remoteMessage);
        } catch (e) {
          if (__DEV__) console.log('[Alerts] onMessage error:', e);
        }
      });
      return () => unsub();
    } catch {}
  }, []);

  async function markAllRead() {
    try {
      await api.patch('/alerts/read-all');
      setData((prev) => prev.map((a) => ({ ...a, read: true })));
      haptics.success();
      toast.show({ type: 'success', title: 'All alerts marked as read' });
    } catch (err: any) {
      haptics.error();
      toast.show({ type: 'error', title: err?.response?.data?.message || 'Failed to mark all as read' });
    }
  }

  if (error && data.length === 0) {
    return <ErrorScreen message={error} onRetry={() => { setLoading(true); fetchAlerts(); }} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alerts</Text>
        {unreadCount > 0 && (
          <Touchable onPress={markAllRead} style={styles.markAllBtn} accessibilityRole="button">
            <Text style={styles.markAllText}>Mark all read</Text>
          </Touchable>
        )}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <NotificationCard
            item={item}
            index={index}
            onPress={() => navigation.navigate('AlertDetail', { alert: item })}
          />
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAlerts(); }} />}
        ListEmptyComponent={<EmptyState title="No alerts" subtitle="You're all caught up!" />}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : { paddingHorizontal: 16, paddingBottom: insets.bottom + 16, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 },
  headerTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary },
  markAllBtn: { paddingVertical: 10 },
  markAllText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 13, color: colors.primaryText },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.elevated, borderRadius: 10, padding: 14, marginBottom: 12,
    boxShadow: '0px 2px 12px rgba(0,0,0,0.08)',
  },
  cardUnread: {}, // the dot marks unread
  iconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  cardContent: { flex: 1 },
  cardTitle: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 16, color: colors.textPrimary },
  cardMessage: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cardTime: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
