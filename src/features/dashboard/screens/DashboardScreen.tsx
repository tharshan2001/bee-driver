import React, { useCallback, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, RefreshControl, StyleSheet, Switch, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../core/api/client';
import type { DriverDashboard } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import StatusBadge from '../../../shared/components/StatusBadge';
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
  const { availability, setAvailability, isTracking } = useAuth();
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

  const hasActiveDeliveries = (dashboard?.activeDeliveries ?? 0) > 0;

  const toggleAvailability = async (value: boolean) => {
    if (hasActiveDeliveries && value) {
      Alert.alert('Active Deliveries', 'Complete your current deliveries before going online.');
      return;
    }
    try {
      await setAvailability(value);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to update availability');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading dashboard...</Text>
      </View>
    );
  }

  if (error) {
    return <ErrorScreen message={error} onRetry={() => { setLoading(true); fetchDashboard(); }} />;
  }

  return (
    <ScreenContainer scroll refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={[styles.header, { paddingTop: 20 }]}>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Ionicons name="person-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      <WelcomeBanner name={dashboard?.driverName?.split(' ')[0] || 'Driver'} />

      <Card padding={16} style={styles.availabilityCard}>
        <View style={styles.availabilityInner}>
          <View>
            <Text style={styles.cardLabel}>Availability</Text>
            <Text style={[styles.statusText, {
              color: hasActiveDeliveries ? colors.warning : (availability ? colors.success : colors.danger)
            }]}>
              {hasActiveDeliveries
                ? 'On Delivery'
                : (availability ? 'You are ONLINE' : 'You are OFFLINE')}
            </Text>
          </View>
          <Switch
            value={availability}
            onValueChange={toggleAvailability}
            disabled={hasActiveDeliveries}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={hasActiveDeliveries ? colors.warning : (availability ? colors.card : colors.card)}
          />
        </View>
      </Card>

      <Card variant="accent" style={styles.trackingCard}>
        <View style={styles.trackingInner}>
          <Ionicons name="locate-outline" size={22} color={colors.primary} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.trackingLabel}>Live Tracking</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={[styles.trackingDot, { backgroundColor: isTracking ? colors.success : colors.danger }]} />
              <Text style={[styles.trackingStatus, { color: isTracking ? colors.success : colors.danger }]}>
                {isTracking ? 'Sharing location' : 'Location sharing disabled'}
              </Text>
            </View>
          </View>
        </View>
      </Card>

      <SectionHeader title="Quick Actions" />

      <View style={styles.actionsRow}>
        <Card onPress={() => navigation.navigate('MainTabs')} style={styles.actionCard}>
          <Ionicons name="car-outline" size={28} color={colors.primary} style={{ marginBottom: 8 }} />
          <Text style={styles.actionLabel}>Deliveries</Text>
        </Card>
        <Card onPress={() => navigation.navigate('CreateExpense')} style={styles.actionCard}>
          <Ionicons name="cash-outline" size={28} color={colors.warningDeep} style={{ marginBottom: 8 }} />
          <Text style={styles.actionLabel}>New Expense</Text>
        </Card>
        <Card onPress={() => navigation.navigate('Stats')} style={styles.actionCard}>
          <Ionicons name="bar-chart-outline" size={28} color={colors.info} style={{ marginBottom: 8 }} />
          <Text style={styles.actionLabel}>My Stats</Text>
        </Card>
      </View>

      {dashboard?.recentDeliveries && dashboard.recentDeliveries.length > 0 && (
        <>
          <SectionHeader title="Recent Deliveries" />
          {dashboard.recentDeliveries.slice(0, 5).map((delivery) => (
            <Card
              key={delivery.orderId}
              onPress={() => navigation.navigate('DeliveryDetail', { orderId: delivery.orderId })}
              style={styles.deliveryItem}
            >
              <View style={styles.deliveryLeft}>
                <Text style={styles.orderNumber}>{delivery.orderNumber}</Text>
                <Text style={styles.customerName}>{delivery.customerName}</Text>
              </View>
              <StatusBadge status={delivery.status} />
              <Text style={styles.timeAgo}>{timeAgo(delivery.createdAt)}</Text>
            </Card>
          ))}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingBottom: 20, backgroundColor: colors.header,
  },
  headerRight: { flexDirection: 'row', gap: 12 },
  availabilityCard: { marginHorizontal: 16, marginTop: 16 },
  availabilityInner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  cardLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  statusText: { fontSize: 18, fontWeight: 'bold' },
  trackingCard: { marginHorizontal: 16, marginTop: 0, marginBottom: 8 },
  trackingInner: {
    flexDirection: 'row', alignItems: 'center',
  },
  trackingLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600', marginBottom: 2 },
  trackingDot: { width: 8, height: 8, borderRadius: 4 },
  trackingStatus: { fontSize: 13, fontWeight: '500' },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  actionCard: {
    flex: 1, alignItems: 'center', padding: 16,
  },
  actionLabel: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  deliveryItem: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: 16, marginBottom: 8,
  },
  deliveryLeft: { flex: 1 },
  orderNumber: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  customerName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  timeAgo: { fontSize: 11, color: colors.textMuted, marginLeft: 8 },
});
