import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert, Platform, Animated,
} from 'react-native';
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
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 350,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, []);

  const type = item.type?.toUpperCase() || 'INFO';
  const icon = iconMap[type] || 'information-circle-outline';
  const icColor = iconColorMap[type] || colors.textTertiary;

  return (
    <Animated.View style={{ opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [15, 0] }) }] }}>
      <TouchableOpacity
        style={[styles.card, !item.read && styles.cardUnread]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconCircle, { backgroundColor: icColor + '15' }]}>
          <Ionicons name={icon} size={18} color={icColor} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <Text style={[styles.cardTitle, !item.read && styles.cardTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.cardMessage} numberOfLines={1}>{item.message}</Text>
          <Text style={styles.cardTime}>{timeAgo(item.createdAt)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={14} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function AlertsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<AlertType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to mark all as read');
    }
  }

  if (error && data.length === 0) {
    return <ErrorScreen message={error} onRetry={() => { setLoading(true); fetchAlerts(); }} />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 12 }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Alerts</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginBottom: 12,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.danger, borderRadius: 10,
    minWidth: 20, height: 20, paddingHorizontal: 6,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: '#fff',
  },
  markAllBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.surface,
  },
  markAllText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textSecondary },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    marginBottom: 8,
  },
  cardUnread: {
    borderLeftWidth: 3, borderLeftColor: colors.primary,
  },
  iconCircle: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  cardContent: { flex: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textPrimary, flex: 1,
  },
  cardTitleUnread: { fontFamily: 'IBMPlexSans_500Medium' },
  cardMessage: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 12, color: colors.textSecondary, marginTop: 2,
  },
  cardTime: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, color: colors.textTertiary, marginTop: 4,
  },
  unreadDot: {
    width: 7, height: 7, borderRadius: 4, backgroundColor: colors.primary,
  },
});
