import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../core/api/client';
import { cacheData, getCachedData } from '../../../core/storage/storage';
import type { PageResponse } from '../../../core/api/types';
import type { RootStackParamList, RootStackNav } from '../../../navigation/types';
import StatusBadge from '../../../shared/components/StatusBadge';
import EmptyState from '../../../shared/components/EmptyState';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import { timeAgo } from '../../../core/utils/helpers';

type Nav = RootStackNav;

const statusFilters: (string | null)[] = [null, 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

export default function DeliveriesListScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async (pageNum: number, append = false) => {
    setError(null);
    const cacheKey = `deliveries_${filter || 'all'}_page_${pageNum}`;
    try {
      const res = await api.get('/driver/deliveries', {
        params: { status: filter, page: pageNum, size: 20 },
      });
      const pageData = res.data?.data as PageResponse<any>;
      if (pageData) {
        if (append) {
          setData((prev) => [...prev, ...pageData.content]);
        } else {
          setData(pageData.content);
        }
        setHasMore(!pageData.last);
        cacheData(cacheKey, pageData);
      }
    } catch (err: any) {
      if (!append) {
        const cached = await getCachedData<PageResponse<any>>(cacheKey);
        if (cached) {
          setData(cached.content);
          setHasMore(!cached.last);
        } else {
          setError(err?.message || 'Failed to load deliveries');
        }
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    setPage(0);
    fetchDeliveries(0);
  }, [filter, fetchDeliveries]);

  const onRefresh = () => {
    setRefreshing(true);
    setPage(0);
    fetchDeliveries(0);
  };

  const loadMore = () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    fetchDeliveries(nextPage, true);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => navigation.navigate('DeliveryDetail', { orderId: item.orderId })}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.orderNumber}>{item.orderNumber}</Text>
        <Text style={styles.customerName}>{item.customerName}</Text>
      </View>
      <StatusBadge status={item.status} />
      <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.headerTitle}>My Deliveries</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
          <Text style={styles.bell}>🔔</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        horizontal
        data={statusFilters}
        keyExtractor={(item) => item || 'all'}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item?.replace(/_/g, ' ') || 'All'}
            </Text>
          </TouchableOpacity>
        )}
      />

      {error && data.length === 0 ? (
        <ErrorScreen message={error} onRetry={() => { setLoading(true); fetchDeliveries(0); }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, idx) => `${item.orderId}-${idx}`}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={loading ? null : <EmptyState icon="📭" title="No deliveries" />}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
          contentContainerStyle={data.length === 0 ? { flex: 1 } : { padding: 16, paddingTop: 8, paddingBottom: insets.bottom + 16 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: '#000000',
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  bell: { fontSize: 22 },
  filterContainer: { padding: 16, paddingBottom: 8, gap: 8 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd' },
  filterChipActive: { backgroundColor: '#000000', borderColor: '#000000' },
  filterText: { fontSize: 13, color: '#666' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  item: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginBottom: 8, padding: 14, borderRadius: 12,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  itemLeft: { flex: 1 },
  orderNumber: { fontWeight: '600', fontSize: 14, color: '#333' },
  customerName: { fontSize: 12, color: '#666', marginTop: 2 },
  timeAgo: { fontSize: 11, color: '#999', marginLeft: 8 },
});
