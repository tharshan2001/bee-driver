import React, { useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, RefreshControl, StyleSheet, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import api from '../../../core/api/client';
import type { DriverDashboard } from '../../../core/api/types';
import type { RootStackParamList, RootStackNav } from '../../../navigation/types';
import StatusBadge from '../../../shared/components/StatusBadge';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import { timeAgo } from '../../../core/utils/helpers';

type Nav = RootStackNav;

export default function DashboardScreen() {
  const navigation = useNavigation<Nav>();
  const { availability, setAvailability } = useAuth();
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

  const toggleAvailability = async (value: boolean) => {
    try {
      await setAvailability(value);
    } catch {
      Alert.alert('Error', 'Failed to update availability');
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
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Hi, {dashboard?.driverName?.split(' ')[0] || 'Driver'}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
            <Text style={styles.iconButton}>🔔</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.iconButton}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.availabilityCard}>
        <View>
          <Text style={styles.cardLabel}>Availability</Text>
          <Text style={[styles.statusText, { color: availability ? '#388E3C' : '#D32F2F' }]}>
            {availability ? 'You are ONLINE' : 'You are OFFLINE'}
          </Text>
        </View>
        <Switch
          value={availability}
          onValueChange={toggleAvailability}
          trackColor={{ false: '#ddd', true: '#A5D6A7' }}
          thumbColor={availability ? '#388E3C' : '#f4f3f4'}
        />
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.statIcon}>🚚</Text>
          <Text style={[styles.statValue, { color: '#1976D2' }]}>{dashboard?.activeDeliveries ?? 0}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statIcon}>✅</Text>
          <Text style={[styles.statValue, { color: '#388E3C' }]}>{dashboard?.completedToday ?? 0}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFEBEE' }]}>
          <Text style={styles.statIcon}>❌</Text>
          <Text style={[styles.statValue, { color: '#D32F2F' }]}>{dashboard?.failedToday ?? 0}</Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('MainTabs')}>
          <Text style={[styles.actionIcon, { color: '#1976D2' }]}>🚚</Text>
          <Text style={styles.actionLabel}>Deliveries</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('CreateExpense')}>
          <Text style={[styles.actionIcon, { color: '#FFA000' }]}>💰</Text>
          <Text style={styles.actionLabel}>New Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Stats')}>
          <Text style={[styles.actionIcon, { color: '#7B1FA2' }]}>📊</Text>
          <Text style={styles.actionLabel}>My Stats</Text>
        </TouchableOpacity>
      </View>

      {dashboard?.recentDeliveries && dashboard.recentDeliveries.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Recent Deliveries</Text>
          {dashboard.recentDeliveries.slice(0, 5).map((delivery) => (
            <TouchableOpacity
              key={delivery.orderId}
              style={styles.deliveryItem}
              onPress={() => navigation.navigate('DeliveryDetail', { orderId: delivery.orderId })}
            >
              <View style={styles.deliveryLeft}>
                <Text style={styles.orderNumber}>{delivery.orderNumber}</Text>
                <Text style={styles.customerName}>{delivery.customerName}</Text>
              </View>
              <StatusBadge status={delivery.status} />
              <Text style={styles.timeAgo}>{timeAgo(delivery.createdAt)}</Text>
            </TouchableOpacity>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, paddingTop: 60, backgroundColor: '#1A237E',
  },
  greeting: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerRight: { flexDirection: 'row', gap: 12 },
  iconButton: { fontSize: 24 },
  availabilityCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', margin: 16, padding: 16, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  cardLabel: { fontSize: 12, color: '#999', fontWeight: '600', marginBottom: 4 },
  statusText: { fontSize: 18, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  statCard: {
    flex: 1, padding: 16, borderRadius: 12, alignItems: 'center',
  },
  statIcon: { fontSize: 24, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', margin: 16, marginBottom: 8 },
  actionsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  actionCard: {
    flex: 1, backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  actionIcon: { fontSize: 28, marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#333' },
  deliveryItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, marginBottom: 8, padding: 14, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  deliveryLeft: { flex: 1 },
  orderNumber: { fontWeight: '600', fontSize: 14, color: '#333' },
  customerName: { fontSize: 12, color: '#666', marginTop: 2 },
  timeAgo: { fontSize: 11, color: '#999', marginLeft: 8 },
});
