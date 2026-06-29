import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../../core/api/client';
import type { Expense } from '../../../core/api/types';
import type { RootStackParamList, RootStackNav } from '../../../navigation/types';
import StatusBadge from '../../../shared/components/StatusBadge';
import EmptyState from '../../../shared/components/EmptyState';
import { formatDate } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

type Nav = RootStackNav;

const filters: (string | null)[] = [null, 'PENDING', 'APPROVED', 'REJECTED'];

export default function ExpensesScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<Expense[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchExpenses = useCallback(async () => {
    try {
      const res = await api.get('/driver/expenses', { params: { status: filter } });
      if (res.data?.success && res.data?.data) setData(res.data.data);
    } catch {
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filter]);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  useFocusEffect(useCallback(() => { fetchExpenses(); }, [fetchExpenses]));

  const categoryIcon = (cat: string) => {
    const icons: Record<string, string> = { FUEL: '⛽', MAINTENANCE: '🔧', PARKING: '🅿️', TOLL: '🛣️', OTHER: '📄' };
    return icons[cat.toUpperCase()] || '📄';
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={filters}
        keyExtractor={(item) => item || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item || 'All'}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.categoryIcon}>{categoryIcon(item.category)}</Text>
            <View style={styles.itemContent}>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.meta}>{item.category} • {formatDate(item.date)}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
              <StatusBadge status={item.status} />
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(); }} />}
        ListEmptyComponent={loading ? null : <EmptyState icon="🧾" title="No expenses" subtitle="Tap + to add one" />}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : { padding: 16, paddingTop: 8 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateExpense')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  filterContainer: { padding: 16, paddingBottom: 8, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  item: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 14, borderRadius: 12, marginBottom: 8 },
  categoryIcon: { fontSize: 24, marginRight: 12 },
  itemContent: { flex: 1 },
  description: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  amount: { fontWeight: 'bold', fontSize: 16, color: colors.textPrimary },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', elevation: 4, shadowColor: colors.shadow, shadowOpacity: 0.2, shadowRadius: 4 },
  fabText: { fontSize: 28, color: colors.textOnPrimary, fontWeight: '300', marginTop: -2 },
});
