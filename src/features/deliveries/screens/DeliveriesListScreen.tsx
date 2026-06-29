import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator,
  Animated, LayoutAnimation, Platform, UIManager, SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../../core/api/client';
import { cacheData, getCachedData } from '../../../core/storage/storage';
import type { PageResponse } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import StatusBadge from '../../../shared/components/StatusBadge';
import Card from '../../../shared/components/Card';
import Skeleton from '../../../shared/components/Skeleton';
import EmptyState from '../../../shared/components/EmptyState';
import ErrorScreen from '../../../shared/components/ErrorScreen';
import { timeAgo } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Nav = RootStackNav;

const statusFilters: (string | null)[] = [null, 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'];

function DeliverySkeletons() {
  return (
    <View style={{ padding: 16, paddingTop: 8, gap: 8 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Card key={i} style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="60%" height={14} />
            <Skeleton width="40%" height={12} />
          </View>
          <Skeleton width={70} height={22} borderRadius={8} />
        </Card>
      ))}
    </View>
  );
}

export default function DeliveriesListScreen() {
  const navigation = useNavigation<Nav>();
  const [data, setData] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fadeAnims = useRef<Animated.Value[]>([]);

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
          fadeAnims.current = pageData.content.map(() => new Animated.Value(0));
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

  function handleFilter(newFilter: string | null) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilter(newFilter);
  }

  function renderItem({ item, index }: { item: any; index: number }) {
    const anim = fadeAnims.current[index];
    const scale = anim?.interpolate({
      inputRange: [0, 1],
      outputRange: [0.95, 1],
    }) || 1;
    const opacity = anim ?? 1;

    if (anim) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 60,
        useNativeDriver: true,
      }).start();
    }

    return (
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Card
          onPress={() => navigation.navigate('DeliveryDetail', { orderId: item.orderId })}
          style={styles.item}
        >
          <View style={styles.itemLeft}>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
          </View>
          <StatusBadge status={item.status} />
          <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
        </Card>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Deliveries</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
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
            onPress={() => handleFilter(item)}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item?.replace(/_/g, ' ') || 'All'}
            </Text>
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <DeliverySkeletons />
      ) : error && data.length === 0 ? (
        <ErrorScreen message={error} onRetry={() => { setLoading(true); fetchDeliveries(0); }} />
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, idx) => `${item.orderId}-${idx}`}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<EmptyState icon="📭" title="No deliveries" />}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
          contentContainerStyle={data.length === 0 ? { flex: 1 } : { padding: 16, paddingTop: 8, paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, backgroundColor: colors.header,
  },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textOnPrimary },
  filterContainer: { padding: 16, paddingBottom: 8, gap: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { color: colors.textOnPrimary, fontWeight: '600' },
  item: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 8,
  },
  itemLeft: { flex: 1 },
  orderNumber: { fontWeight: '600', fontSize: 14, color: colors.textPrimary },
  customerName: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  timeAgo: { fontSize: 11, color: colors.textMuted, marginLeft: 8 },
});
