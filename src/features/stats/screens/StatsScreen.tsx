import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import api from '../../../core/api/client';
import type { DriverStats } from '../../../core/api/types';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import { colors } from '../../../shared/theme';

export default function StatsScreen() {
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get('/driver/stats');
      if (res.data?.success && res.data?.data) setStats(res.data.data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (error) return <ErrorScreen message={error} onRetry={() => setLoading(true)} />;
  if (!stats) return null;

  const completionRate = stats.totalDeliveries > 0
    ? ((stats.completedDeliveries / stats.totalDeliveries) * 100).toFixed(1)
    : '0';
  const failureRate = stats.totalDeliveries > 0
    ? ((stats.failedDeliveries / stats.totalDeliveries) * 100).toFixed(1)
    : '0';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <StatCard icon="🚚" label="Total Deliveries" value={`${stats.totalDeliveries}`} color={colors.accent} />
      <View style={styles.row}>
        <StatCard icon="✅" label="Completed" value={`${stats.completedDeliveries}`} color={colors.success} flex={1} />
        <View style={{ width: 8 }} />
        <StatCard icon="❌" label="Failed" value={`${stats.failedDeliveries}`} color={colors.danger} flex={1} />
      </View>
      <StatCard icon="💰" label="Total Earnings" value={`$${stats.totalEarnings.toFixed(2)}`} color={colors.success} />
      {stats.rating != null && (
        <StatCard icon="⭐" label="Rating" value={stats.rating.toFixed(1)} color={colors.warning} />
      )}

      <View style={styles.performanceCard}>
        <Text style={styles.performanceTitle}>Delivery Performance</Text>
        <ProgressRow label="Completion Rate" value={completionRate} color={colors.success} />
        <ProgressRow label="Failure Rate" value={failureRate} color={colors.danger} />
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, flex }: {
  icon: string; label: string; value: string; color: string; flex?: number;
}) {
  return (
    <View style={[styles.statCard, flex ? { flex } : undefined]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
    </View>
  );
}

function ProgressRow({ label, value, color }: { label: string; value: string; color: string }) {
  const num = Math.min(100, Math.max(0, parseFloat(value) || 0));
  return (
    <View style={styles.progressRow}>
      <Text style={styles.progressLabel}>{label}</Text>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${num}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.progressValue, { color }]}>{value}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  row: { flexDirection: 'row', marginBottom: 8 },
  statCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
    padding: 16, borderRadius: 12, marginBottom: 8,
    shadowColor: colors.shadow, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  statIcon: { fontSize: 28, marginRight: 16 },
  statLabel: { fontSize: 13, color: colors.textSecondary },
  statValue: { fontSize: 22, fontWeight: 'bold' },
  performanceCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16, marginTop: 8 },
  performanceTitle: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressLabel: { width: 120, fontSize: 13, color: colors.textSecondary },
  progressBar: { flex: 1, height: 8, backgroundColor: '#eee', borderRadius: 4, marginHorizontal: 12 },
  progressFill: { height: 8, borderRadius: 4 },
  progressValue: { width: 48, textAlign: 'right', fontWeight: '600', fontSize: 12 },
});
