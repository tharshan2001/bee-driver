import React, { useCallback } from 'react';
import { View, Text, RefreshControl, StyleSheet, ScrollView } from 'react-native';
import Touchable from '../../../shared/components/Touchable';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../core/api/client';
import type { DriverDashboard, DriverDelivery, DeliverySummary, PageResponse } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import Badge from '../../../shared/components/StatusBadge';
import SectionHeader from '../../../shared/components/SectionHeader';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import WelcomeBanner from '../components/WelcomeBanner';
import TodayPanel from '../components/TodayPanel';
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
  const [stops, setStops] = React.useState<DriverDelivery[] | null>(null);

  // The active trip's deliveries, for the next stop and the cash to collect.
  const fetchStops = useCallback(async () => {
    try {
      const res = await api.get('/driver/deliveries', { params: { page: 0, size: 200 } });
      const page = res.data?.data as PageResponse<DriverDelivery> | undefined;
      if (page) setStops(page.content);
    } catch {
      // Keep what is on screen; with nothing loaded yet the panel says so.
    }
  }, []);

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

  // Also on every return to the tab, so statuses and totals are current.
  useFocusEffect(useCallback(() => {
    fetchDashboard();
    fetchStops();
  }, [fetchDashboard, fetchStops]));

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStops();
    fetchDashboard();
  }, [fetchDashboard, fetchStops]);

  const recentDeliveries = dashboard?.recentDeliveries?.slice(0, 5) ?? [];

  const renderRecentItem = (item: DeliverySummary) => (
    <Touchable
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
    </Touchable>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={{ fontFamily: 'IBMPlexSans_400Regular', color: colors.textTertiary }}>Loading dashboard...</Text>
      </View>
    );
  }

  // A failed refresh keeps what is already on screen.
  if (error && !dashboard) {
    return <ErrorScreen message={error} onRetry={() => { setLoading(true); fetchDashboard(); fetchStops(); }} />;
  }

  return (
    <View style={[styles.outer, { paddingTop: insets.top + Math.min(insets.top, 12) }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Dashboard</Text>
          <View style={styles.headerRight}>
            <Touchable onPress={() => navigation.navigate('Alerts')}>
              <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            </Touchable>
            <Touchable onPress={() => navigation.navigate('Profile')}>
              <Ionicons name="person-outline" size={22} color={colors.textPrimary} />
            </Touchable>
          </View>
        </View>

        <WelcomeBanner name={dashboard?.driverName?.split(' ')[0] || 'Driver'} />

        <TodayPanel
          deliveries={stops}
          deliveredToday={dashboard?.completedToday ?? 0}
          onOpen={(orderId) => navigation.navigate('DeliveryDetail', { orderId })}
        />

        <SectionHeader title="QUICK ACTIONS" />

        <View style={styles.actionsRow}>
          <Touchable onPress={() => navigation.navigate('LiveLocation')} style={styles.actionCard}>
            <Ionicons name="location-outline" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={styles.actionLabel}>LOCATION</Text>
          </Touchable>
          <Touchable onPress={() => navigation.navigate('MainTabs', { screen: 'Deliveries' } as any)} style={styles.actionCard}>
            <Ionicons name="cube-outline" size={24} color="#2196F3" style={{ marginBottom: 8 }} />
            <Text style={styles.actionLabel}>DELIVERIES</Text>
          </Touchable>
          <Touchable onPress={() => navigation.navigate('CreateExpense')} style={styles.actionCard}>
            <Ionicons name="receipt-outline" size={24} color={colors.warning} style={{ marginBottom: 8 }} />
            <Text style={styles.actionLabel}>EXPENSE</Text>
          </Touchable>
          <Touchable onPress={() => navigation.navigate('Stats')} style={styles.actionCard}>
            <Ionicons name="bar-chart-outline" size={24} color={colors.success} style={{ marginBottom: 8 }} />
            <Text style={styles.actionLabel}>STATS</Text>
          </Touchable>
        </View>

        {recentDeliveries.length > 0 && (
          <View style={styles.recentSection}>
            <SectionHeader title="RECENT DELIVERIES" actionLabel="View all" onAction={() => navigation.navigate('MainTabs', { screen: 'Deliveries' } as any)} />
            {recentDeliveries.map(renderRecentItem)}
          </View>
        )}
      </ScrollView>
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
  content: { paddingHorizontal: 16, paddingBottom: 24 },
  recentSection: { marginTop: 8, paddingHorizontal: 4 },
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
