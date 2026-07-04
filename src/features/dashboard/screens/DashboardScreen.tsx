import React, { useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, RefreshControl, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../core/api/client';
import type { DriverDashboard } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import Badge from '../../../shared/components/StatusBadge';
import Card from '../../../shared/components/Card';
import SectionHeader from '../../../shared/components/SectionHeader';
import ScreenContainer from '../../../shared/components/ScreenContainer';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import WelcomeBanner from '../components/WelcomeBanner';
import { timeAgo } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

type Nav = RootStackNav;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { isTracking } = useAuth();
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
    <ScreenContainer scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
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

      <Card variant="accent" padding={16} style={styles.trackingCard}>
        <View style={styles.trackingInner}>
          <View style={styles.iconSquare}>
            <Ionicons name="location-outline" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardCaption}>LIVE TRACKING</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.trackingDot, { backgroundColor: isTracking ? colors.success : colors.danger }]} />
              <Text style={[styles.trackingStatus, { color: isTracking ? colors.success : colors.danger }]}>
                {isTracking ? 'Sharing location' : 'Location sharing disabled'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <SectionHeader title="QUICK ACTIONS" />

      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={() => navigation.navigate('MainTabs')} style={styles.actionCard}>
          <Ionicons name="car-outline" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
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

      {dashboard?.recentDeliveries && dashboard.recentDeliveries.length > 0 && (
        <>
          <SectionHeader title="RECENT" actionLabel="View all" onAction={() => navigation.navigate('MainTabs', { screen: 'Deliveries' } as any)} />
          {dashboard.recentDeliveries.slice(0, 5).map((delivery) => (
            <TouchableOpacity
              key={delivery.orderId}
              onPress={() => navigation.navigate('DeliveryDetail', { orderId: delivery.orderId })}
              style={styles.recentRow}
            >
              <View style={styles.recentLeft}>
                <Text style={styles.recentOrderId}>{delivery.orderNumber}</Text>
                <Text style={styles.recentCustomer}>{delivery.customerName}</Text>
              </View>
              <View style={styles.recentRight}>
                <Badge status={delivery.status} compact />
                <Text style={styles.recentTime}>{timeAgo(delivery.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16,
  },
  headerTitle: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary,
  },
  headerRight: { flexDirection: 'row', gap: 16 },
  cardCaption: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, color: colors.textTertiary,
    textTransform: 'uppercase', marginBottom: 4,
  },
  trackingCard: { marginTop: 0, marginBottom: 8 },
  trackingInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconSquare: {
    width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },
  trackingDot: { width: 8, height: 8, borderRadius: 4 },
  trackingStatus: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  actionCard: {
    flex: 1, alignItems: 'center', padding: 16, backgroundColor: colors.surface,
    borderRadius: 10,
  },
  actionLabel: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, color: colors.textPrimary,
    textTransform: 'uppercase',
  },
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
