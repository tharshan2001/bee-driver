import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import api from '../../../core/api/client';
import type { Expense } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import StampBadge from '../../../shared/components/StatusBadge';
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
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      FUEL: 'car-outline', MAINTENANCE: 'build-outline', PARKING: 'car-outline',
      TOLL: 'cash-outline', OTHER: 'receipt-outline',
    };
    return icons[cat.toUpperCase()] || 'receipt-outline';
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {filters.map((item) => (
          <TouchableOpacity
            key={item || 'all'}
            style={[styles.filterTab, filter === item && styles.filterTabActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item || 'All'}
            </Text>
            {filter === item && <View style={styles.filterUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Ionicons name={categoryIcon(item.category)} size={20} color={colors.textMuted} style={{ marginRight: 12 }} />
            <View style={styles.itemContent}>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.meta}>{item.category} • {formatDate(item.date)}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.amount}>LKR {item.amount.toFixed(2)}</Text>
              <StampBadge status={item.status} compact />
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(); }} />}
        ListEmptyComponent={loading ? null : <EmptyState title="No expenses logged" subtitle="Tap + to add one" />}
        contentContainerStyle={data.length === 0 ? { flex: 1 } : { paddingHorizontal: 16, paddingTop: 8 }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('CreateExpense')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.kraft },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 16,
    backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filterTab: { position: 'relative', paddingBottom: 4 },
  filterTabActive: {},
  filterText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textMuted, textTransform: 'uppercase' },
  filterTextActive: { color: colors.textPrimary },
  filterUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: colors.primary, borderRadius: 2 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper,
    padding: 14, borderRadius: 4, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.shadow, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  itemContent: { flex: 1 },
  description: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 14, color: colors.textPrimary },
  meta: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textMuted, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  amount: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 15, color: colors.textPrimary },
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 4, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: colors.shadow, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
  },
  fabText: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 28, color: colors.paper, marginTop: -2 },
});
