import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../core/api/client';
import type { Expense } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import Badge from '../../../shared/components/StatusBadge';
import EmptyState from '../../../shared/components/EmptyState';
import { formatDate } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

type Nav = RootStackNav;

const filters: (string | null)[] = [null, 'PENDING', 'APPROVED', 'REJECTED'];

export default function ExpensesScreen() {
  const insets = useSafeAreaInsets();
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
            <Ionicons name={categoryIcon(item.category)} size={20} color={colors.textTertiary} style={{ marginRight: 12 }} />
            <View style={styles.itemContent}>
              <Text style={styles.description}>{item.description}</Text>
              <Text style={styles.meta}>{item.category} • {formatDate(item.date)}</Text>
            </View>
            <View style={styles.itemRight}>
              <Text style={styles.amount}>LKR {item.amount.toFixed(2)}</Text>
              <Badge status={item.status} compact />
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchExpenses(); }} />}
        ListEmptyComponent={loading ? null : <EmptyState title="No expenses logged" subtitle="Tap + to add one" />}
        contentContainerStyle={data.length === 0 ? { flex: 1, paddingBottom: insets.bottom + 16 } : { paddingHorizontal: 16, paddingTop: 8, paddingBottom: insets.bottom + 16 }}
      />

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + 16 }]} onPress={() => navigation.navigate('CreateExpense')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 16,
  },
  filterTab: { position: 'relative', paddingBottom: 4 },
  filterTabActive: {},
  filterText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase' },
  filterTextActive: { color: colors.textPrimary },
  filterUnderline: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: colors.primary, borderRadius: 2 },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.elevated,
    padding: 14, borderRadius: 10, marginBottom: 8,
    shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  itemContent: { flex: 1 },
  description: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 14, color: colors.textPrimary },
  meta: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  amount: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 15, color: colors.textPrimary },
  fab: {
    position: 'absolute', right: 24,
    width: 56, height: 56, borderRadius: 14, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: colors.shadow, shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
  },
  fabText: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 28, color: colors.textOnPrimary, marginTop: -2 },
});
