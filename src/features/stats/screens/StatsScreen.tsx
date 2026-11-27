import React, { useCallback, useEffect, useState } from 'react';
import { formatMoney } from '../../../core/utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, ScrollView, RefreshControl, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../core/api/client';
import type { DriverStats } from '../../../core/api/types';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import Card from '../../../shared/components/Card';
import { colors } from '../../../shared/theme';

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<DriverStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setError(null);
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
  if (error) return <ErrorScreen message={error} onRetry={() => { setLoading(true); fetchStats(); }} />;
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
      contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <StatCard icon="car-outline" label="Total Deliveries" value={`${stats.totalDeliveries}`} color={colors.textPrimary} />
      <View style={styles.row}>
        <StatCard icon="checkmark-outline" label="Completed" value={`${stats.completedDeliveries}`} color={colors.success} flex={1} />
        <View style={{ width: 12 }} />
        <StatCard icon="close-outline" label="Failed" value={`${stats.failedDeliveries}`} color={colors.danger} flex={1} />
      </View>
      <StatCard icon="cash-outline" label="Expenses Claimed" value={formatMoney(stats.totalExpensesClaimed ?? 0)} color={colors.success} mono />
      {stats.rating != null && (
        <StatCard icon="star-outline" label="Rating" value={stats.rating.toFixed(1)} color={colors.warning} />
      )}

      <Card padding={16}>
        <Text style={styles.perfTitle}>Delivery Performance</Text>
        <ProgressRow label="Completion" value={completionRate} color={colors.success} />
        <ProgressRow label="Failure" value={failureRate} color={colors.danger} />
      </Card>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, flex, mono }: {
  icon: string; label: string; value: string; color: string; flex?: number; mono?: boolean;
}) {
  return (
    <View style={[styles.statCard, flex ? { flex } : undefined]}>
      <View style={styles.statIconBox}>
        <Ionicons name={icon as keyof typeof Ionicons.glyphMap} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={[styles.statValue, { color }, mono && { fontFamily: 'IBMPlexMono_500Medium' }]}>{value}</Text>
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
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16 },
  row: { flexDirection: 'row' },
  statCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.elevated,
    padding: 16, borderRadius: 10, marginBottom: 12, boxShadow: '0px 2px 12px rgba(0,0,0,0.08)',
  },
  statIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  statLabel: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary },
  statValue: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22 },
  perfTitle: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textPrimary, marginBottom: 16 },
  progressRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  progressLabel: { width: 76, fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary },
  progressBar: { flex: 1, height: 8, backgroundColor: colors.surface, borderRadius: 3, marginHorizontal: 12 },
  progressFill: { height: 8, borderRadius: 3 },
  progressValue: { width: 48, textAlign: 'right', fontFamily: 'IBMPlexMono_500Medium', fontSize: 12 },
});
