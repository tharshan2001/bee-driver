import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, RefreshControl, StyleSheet, ActivityIndicator,
  Animated, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import api from '../../../core/api/client';
import { cacheData, getCachedData } from '../../../core/storage/storage';
import type { PageResponse } from '../../../core/api/types';
import type { RootStackNav } from '../../../navigation/types';
import Badge from '../../../shared/components/StatusBadge';
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
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}>
          <View style={{ flex: 1, gap: 6 }}>
            <Skeleton width="40%" height={12} />
            <Skeleton width="60%" height={14} />
          </View>
          <Skeleton width={60} height={14} />
        </View>
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

  function renderItem({ item, index }: { item: any; index: number }) {
    const anim = fadeAnims.current[index];
    const opacity = anim ?? 1;
    const translateY = anim?.interpolate({
      inputRange: [0, 1],
      outputRange: [10, 0],
    }) || 0;

    if (anim) {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    }

    return (
      <Animated.View style={{ opacity, transform: [{ translateY }] }}>
        <TouchableOpacity
          onPress={() => navigation.navigate('DeliveryDetail', { orderId: item.orderId })}
          style={styles.item}
        >
          <View style={styles.itemLeft}>
            <Text style={styles.orderNumber}>{item.orderNumber}</Text>
            <Text style={styles.customerName}>{item.customerName}</Text>
          </View>
          <View style={styles.itemRight}>
            <Badge status={item.status} compact />
            <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Deliveries</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Alerts')}>
          <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {statusFilters.map((item) => (
          <TouchableOpacity
            key={item || 'all'}
            style={[styles.filterTab, filter === item && styles.filterTabActive]}
            onPress={() => {
              setFilter(item);
            }}
          >
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>
              {item?.replace(/_/g, ' ') || 'All'}
            </Text>
            {filter === item && <View style={styles.filterUnderline} />}
          </TouchableOpacity>
        ))}
      </View>

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
          ListEmptyComponent={<EmptyState title="No deliveries" subtitle="All clear for now" />}
          ListFooterComponent={loadingMore ? <ActivityIndicator style={{ padding: 16 }} /> : null}
          contentContainerStyle={data.length === 0 ? { flex: 1 } : { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20,
  },
  headerTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 16,
    backgroundColor: colors.background,
  },
  filterTab: { position: 'relative', paddingBottom: 4 },
  filterTabActive: {},
  filterText: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary,
    textTransform: 'uppercase',
  },
  filterTextActive: { color: colors.textPrimary },
  filterUnderline: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: colors.primary, borderRadius: 2,
  },
  item: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  itemLeft: { flex: 1 },
  orderNumber: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.textTertiary,
  },
  customerName: {
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textPrimary, marginTop: 2,
  },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  timeAgo: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary,
  },
});
