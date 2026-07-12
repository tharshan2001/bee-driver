import React, { useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, RefreshControl, StyleSheet, FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../core/api/client';
import type { DriverDashboard, DeliverySummary } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import Badge from '../../../shared/components/StatusBadge';
import SectionHeader from '../../../shared/components/SectionHeader';
import ScreenContainer from '../../../shared/components/ScreenContainer';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import WelcomeBanner from '../components/WelcomeBanner';
import { timeAgo } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

type Nav = RootStackNav;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [dashboard, setDashboard] = React.useState<DriverDashboard | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setError(null);
    try {
      const res = await api.get('/driver/dashboard');
      if (res.data?.success && res.data?.data) {
        setDashboard(res.data.data);
      } else {
        setError('Invalid response from server');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  const recentDeliveries = dashboard?.recentDeliveries?.slice(0, 5) ?? [];

  const renderRecentItem = useCallback(({ item }: { item: DeliverySummary }) => (
    <TouchableOpacity
      key={item.orderId}
      onPress={() => navigation.navigate('DeliveryDetail', { orderId: item.orderId })}
      style={styles.recentRow}
    >
      <View style={styles.recentLeft}>
        <Text style={styles.recentOrderId}>{item.orderNumber}</Text>
        <Text style={styles.recentCustomer}>{item.customerName}</Text>
      </View>
      <View style={styles.recentRight}>
        <Badge status={item.status} compact />
        <Text style={styles.recentTime}>{timeAgo(item.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  ), [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontFamily: 'IBMPlexSans_400Regular', color: colors.textTertiary }}>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={() => { setLoading(true); fetchDashboard(); }} />;
  }

  return (
    <View style={[styles.outer, { paddingTop: Math.min(insets.top, 12) }]}>
      <ScreenContainer>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-outline" size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>

        <WelcomeBanner name={dashboard?.driverName?.split(' ')[0] || 'Driver'} />

        <SectionHeader title="QUICK ACTIONS" />

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => navigation.navigate('LiveLocation')} style={styles.actionCard}>
            <Ionicons name="location-outline" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.actionLabel}>LOCATION</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.actionCard}>
            <Ionicons name="cube-outline" size={24} color="#2196F3" style={{ marginBottom: 8 }} />
            <Text style={styles.actionLabel}>DELIVERIES</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('CreateExpense')} style={styles.actionCard}>
            <Ionicons name="receipt-outline" size={24} color={colors.warning} style={{ marginBottom: 8 }} />
            <Text style={styles.actionLabel}>EXPENSE</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')} style={styles.actionCard}>
            <Ionicons name="bar-chart-outline" size={24} color={colors.success} style={{ marginBottom: 8 }} />
            <Text style={styles.actionLabel}>STATS</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>

      {recentDeliveries.length > 0 && (
        <View style={styles.recentSection}>
          <SectionHeader title="RECENT DELIVERIES" actionLabel="View all" onAction={() => navigation.navigate('MainTabs', { screen: 'Deliveries' } as any)} />
          <FlatList
            data={recentDeliveries}
            renderItem={renderRecentItem}
            keyExtractor={(item) => item.orderId}
            nestedScrollEnabled
            contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  outer: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary,
  },
  headerRight: { flexDirection: 'row', gap: 16 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionCard: {
    flex: 1, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4, backgroundColor: colors.surface,
    borderRadius: 10,
  },
  actionLabel: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, color: colors.textPrimary,
    textTransform: 'uppercase',
  },
  recentSection: { flex: 1, paddingHorizontal: 20 },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  recentLeft: { flex: 1 },
  recentOrderId: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.textTertiary,
  },
  recentCustomer: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textPrimary, marginTop: 2,
  },
  recentRight: { alignItems: 'flex-end', gap: 4 },
  recentTime: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary,
  },
});
