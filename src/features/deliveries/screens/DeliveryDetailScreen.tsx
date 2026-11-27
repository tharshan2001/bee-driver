import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, TextInput, Modal, Linking, Image, Platform } from 'react-native';
import { haptics } from '../../../shared/haptics';
import Touchable from '../../../shared/components/Touchable';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../core/api/client';
import type { DriverDelivery } from '../../../core/api/types';
import type { RootStackParamList, RootStackNav } from '../../../navigation/types';
import Card from '../../../shared/components/Card';
import Appear from '../../../shared/components/Appear';
import Skeleton from '../../../shared/components/Skeleton';
import { formatDate, formatDateTime, getStatusColor, timeAgo, formatMoney } from '../../../core/utils/helpers';
import SwipeToConfirm from '../../../shared/components/SwipeToConfirm';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';

type DetailRoute = RouteProp<RootStackParamList, 'DeliveryDetail'>;
type Nav = RootStackNav;

function DetailSkeletons() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} padding={16} style={{ gap: 10 }}>
          <Skeleton width="30%" height={12} />
          <Skeleton width="70%" height={16} />
          <Skeleton width="50%" height={14} />
        </Card>
      ))}
    </View>
  );
}

export default function DeliveryDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const toast = useToast();
  const { orderId } = route.params;
  const [delivery, setDelivery] = useState<DriverDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueReason, setIssueReason] = useState('');

  // Also on return, e.g. after completing the delivery, so the status and actions are current.
  useFocusEffect(useCallback(() => {
    fetchDetail();
  }, [orderId]));

  async function fetchDetail() {
    try {
      const res = await api.get(`/driver/deliveries/${orderId}`);
      if (res.data?.success && res.data?.data) {
        setDelivery(res.data.data);
        if (__DEV__) {
          console.log('[DeliveryDetail] RAW response:', JSON.stringify(res.data.data));
          console.log('[DeliveryDetail] items count:', res.data.data.items?.length);
          res.data.data.items?.forEach((item: any, i: number) => {
            console.log(`[DeliveryDetail] item[${i}]:`, JSON.stringify(item));
          });
        }
      }
    } catch (err: any) {
      toast.show({ type: 'error', title: err?.message || 'Failed to load' });
    } finally {
      setLoading(false);
    }
  }

  function openLink(url: string, failure: string) {
    Linking.openURL(url).catch(() => toast.show({ type: 'error', title: failure }));
  }

  async function updateStatus(status: string, reason?: string) {
    try {
      await api.patch(`/driver/deliveries/${orderId}/status`, { status, reason });
      haptics.confirm();
      toast.show({ type: 'success', title: 'Status updated' });
      await fetchDetail(); // the slider stays busy until the next step is on screen
    } catch (err: any) {
      haptics.error();
      toast.show({ type: 'error', title: err?.response?.data?.message || 'Failed to update status' });
    }
  }

  function handleReportIssue() {
    if (!issueReason.trim()) return toast.show({ type: 'error', title: 'Please enter a reason' });
    updateStatus('FAILED', issueReason.trim());
    setShowIssueModal(false);
    setIssueReason('');
  }

  function getActions(status: string) {
    switch (status.toUpperCase()) {
      case 'ASSIGNED':
        return [
          { label: 'Mark Picked Up', swipe: true, action: () => updateStatus('PICKED_UP'), color: colors.primary, textColor: colors.textOnPrimary },
          { label: 'Report Issue', action: () => setShowIssueModal(true), color: 'transparent', textColor: colors.danger, outline: true },
        ];
      case 'PICKED_UP':
        return [
          { label: 'Start Transit', swipe: true, action: () => updateStatus('IN_TRANSIT'), color: colors.primary, textColor: colors.textOnPrimary },
          { label: 'Report Issue', action: () => setShowIssueModal(true), color: 'transparent', textColor: colors.danger, outline: true },
        ];
      case 'IN_TRANSIT':
        return [
          { label: 'Complete Delivery', action: () => navigation.navigate('DeliveryComplete', { orderId }), color: colors.primary, textColor: colors.textOnPrimary },
          { label: 'Report Issue', action: () => setShowIssueModal(true), color: 'transparent', textColor: colors.danger, outline: true },
        ];
      case 'FAILED':
        return [];
      default:
        return [];
    }
  }

  if (loading) {
    return <ScrollView style={styles.container}><DetailSkeletons /></ScrollView>;
  }
  if (!delivery) {
    return <View style={styles.center}><Text style={{ fontFamily: 'IBMPlexSans_400Regular' }}>Delivery not found</Text></View>;
  }

  const actions = getActions(delivery.status);

  return (
    <View style={styles.container}>
    <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: actions.length ? 16 : insets.bottom + 16, gap: 12 }}>
      <AnimatedCard index={0}>
        <Text style={styles.cardCaption}>CUSTOMER</Text>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{delivery.customer.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{delivery.customer.name}</Text>
            {delivery.customer.district && <Text style={styles.district}>{delivery.customer.district}</Text>}
          </View>
        </View>
        <View style={styles.linkRow}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={{ fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textPrimary, flex: 1 }}>{delivery.customer.address}</Text>
        </View>
        <View style={styles.contactRow}>
          <Touchable style={styles.contactButton} accessibilityRole="button" accessibilityLabel={`Call ${delivery.customer.phone}`}
            onPress={() => openLink(`tel:${delivery.customer.phone}`, "Couldn't open the phone")}>
            <Ionicons name="call-outline" size={18} color={colors.success} />
            <Text style={styles.contactText}>Call {delivery.customer.phone}</Text>
          </Touchable>
          <Touchable style={styles.contactButton} accessibilityRole="button" accessibilityLabel="Navigate to the address"
            onPress={() => openLink(mapUrl(delivery.customer.address), "Couldn't open a map")}>
            <Ionicons name="navigate-outline" size={18} color={colors.success} />
            <Text style={styles.contactText}>Navigate</Text>
          </Touchable>
        </View>
      </AnimatedCard>

      {delivery.orderInfo.outstanding > 0 && !['DELIVERED', 'FAILED', 'FAILED_PERMANENT'].includes(delivery.status.toUpperCase()) && (
        <Appear index={1} style={styles.collect}>
          <Text style={styles.collectLabel}>TO COLLECT</Text>
          <Text style={styles.collectAmount}>{formatMoney(delivery.orderInfo.outstanding)}</Text>
        </Appear>
      )}

      <AnimatedCard index={1}>
        <Text style={styles.cardCaption}>ORDER INFO</Text>
        <InfoRow label="Order #" value={delivery.orderInfo.orderNumber} mono />
        {delivery.scheduledDate && (
          <InfoRow label="Scheduled" value={formatDate(delivery.scheduledDate)} />
        )}
        <InfoRow label="Total" value={formatMoney(delivery.orderInfo.total)} mono />
        <InfoRow label="Paid" value={formatMoney(delivery.orderInfo.paid)} valueColor={colors.success} mono />
        <InfoRow label="Outstanding" value={formatMoney(delivery.orderInfo.outstanding)} valueColor={colors.danger} mono />
        <InfoRow label="Payment" value={delivery.orderInfo.paymentStatus.replace(/_/g, ' ')} />
      </AnimatedCard>

      <AnimatedCard index={2}>
        <Text style={styles.cardCaption}>ITEMS ({delivery.items.length})</Text>
        {delivery.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <ItemImage imageUrl={item.imageUrl} />
            <Text style={{ flex: 1, fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textPrimary }}>{item.name}</Text>
            <Text style={{ marginRight: 16, fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.textSecondary }}>x{item.quantity}</Text>
            <Text style={{ fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.textPrimary }}>{formatMoney(item.unitPrice * item.quantity)}</Text>
          </View>
        ))}
      </AnimatedCard>

      <AnimatedCard index={3}>
        <Text style={styles.cardCaption}>STATUS TIMELINE</Text>
        {delivery.timeline.map((entry, idx) => (
          <View key={idx} style={styles.timelineItem}>
            <View style={styles.timelineDotCol}>
              <View style={[styles.timelineDot, { backgroundColor: getStatusColor(entry.status) }]} />
              {idx < delivery.timeline.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={{ fontFamily: 'IBMPlexSans_500Medium', fontSize: 14, color: colors.textPrimary }}>
                {entry.status.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.timelineTime}>{formatDateTime(entry.timestamp)}</Text>
              {entry.note && <Text style={styles.timelineNote}>{entry.note}</Text>}
            </View>
          </View>
        ))}
      </AnimatedCard>

      {delivery.status.toUpperCase() === 'DELIVERED' && (delivery.photoUrl || delivery.signatureUrl) && (
        <AnimatedCard index={4}>
          <Text style={styles.cardCaption}>DELIVERY PROOF</Text>
          {delivery.photoUrl && (
            <Touchable onPress={() => Linking.openURL(delivery.photoUrl!)} style={{ marginBottom: 8 }}>
              <Image source={{ uri: delivery.photoUrl }} style={styles.proofImage} />
              <View style={styles.linkRow}>
                <Ionicons name="camera-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.linkText}>Tap to open photo</Text>
              </View>
            </Touchable>
          )}
          {delivery.signatureUrl && (
            <Touchable onPress={() => Linking.openURL(delivery.signatureUrl!)}>
              <Image source={{ uri: delivery.signatureUrl }} style={styles.proofImage} />
              <View style={styles.linkRow}>
                <Ionicons name="create-outline" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                <Text style={styles.linkText}>Tap to open signature</Text>
              </View>
            </Touchable>
          )}
        </AnimatedCard>
      )}

      {delivery.driverNotes && (
        <AnimatedCard index={5}>
          <Text style={styles.cardCaption}>DRIVER NOTES</Text>
          <Text style={{ fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textSecondary }}>{delivery.driverNotes}</Text>
        </AnimatedCard>
      )}

      <Modal visible={showIssueModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report an Issue</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Describe the issue..."
              placeholderTextColor={colors.textTertiary}
              value={issueReason}
              onChangeText={setIssueReason}
              multiline
            />
            <Touchable style={[styles.modalButton, { backgroundColor: colors.danger }]} onPress={handleReportIssue}>
              <Text style={styles.modalButtonText}>Submit Report</Text>
            </Touchable>
            <Touchable onPress={() => setShowIssueModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Touchable>
          </View>
        </View>
      </Modal>
    </ScrollView>

    {/* Pinned, so the next step is always in view and clear of the system gesture area. */}
    {actions.length > 0 && (
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
        {actions.map((btn: any, idx: number) => btn.swipe ? (
          // Keyed by label so the next step starts with a fresh slider.
          <SwipeToConfirm key={btn.label} label={btn.label} color={btn.color} onConfirm={btn.action} />
        ) : (
          <Touchable
            key={idx}
            style={[
              styles.actionButton,
              { backgroundColor: btn.color },
              btn.outline && { borderWidth: 1.5, borderColor: colors.danger },
            ]}
            onPress={btn.action}
          >
            <Text style={[styles.actionButtonText, { color: btn.textColor }]}>{btn.label}</Text>
          </Touchable>
        ))}
      </View>
    )}
    </View>
  );
}

/** The phone's map app, searching for the address. */
function mapUrl(address: string): string {
  const q = encodeURIComponent(address);
  return Platform.OS === 'ios' ? `http://maps.apple.com/?q=${q}` : `geo:0,0?q=${q}`;
}

function AnimatedCard({ children, index, style }: { children: React.ReactNode; index: number; style?: any }) {
  return (
    <Appear index={index}>
      <Card padding={16} style={style}>{children}</Card>
    </Appear>
  );
}

function ItemImage({ imageUrl }: { imageUrl?: string }) {
  const [failed, setFailed] = useState(false);

  if (!imageUrl || failed) {
    return (
      <View style={styles.itemImagePlaceholder}>
        <Ionicons name="image-outline" size={18} color={colors.textTertiary} />
      </View>
    );
  }

  return (
    <Image
      source={{ uri: imageUrl }}
      style={styles.itemImage}
      resizeMode="cover"
      onError={() => setFailed(true)}
    />
  );
}

function InfoRow({ label, value, valueColor, mono }: { label: string; value: string; valueColor?: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && { fontFamily: 'IBMPlexMono_500Medium' }, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardCaption: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, color: colors.textTertiary,
    textTransform: 'uppercase', marginBottom: 12,
  },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primaryTint,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  avatarText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 18, color: colors.primaryText },
  customerName: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 16, color: colors.textPrimary },
  district: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 12, color: colors.textSecondary },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  contactRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  contactButton: {
    flexGrow: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.successTint,
  },
  contactText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 14, color: colors.success },
  collect: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: colors.primaryTint, borderRadius: 14, padding: 16,
  },
  collectLabel: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 13, color: colors.textPrimary },
  collectAmount: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 22, color: colors.textPrimary },
  linkText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 12, color: colors.success },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, textTransform: 'uppercase' },
  infoValue: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 14, color: colors.textPrimary },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  itemImage: { width: 40, height: 40, borderRadius: 6, backgroundColor: colors.surface },
  itemImagePlaceholder: { width: 40, height: 40, borderRadius: 6, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  timelineItem: { flexDirection: 'row', marginBottom: 4 },
  timelineDotCol: { alignItems: 'center', width: 20, marginRight: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.separator, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineTime: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  timelineNote: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  actionBar: {
    paddingHorizontal: 16, paddingTop: 12, gap: 8, backgroundColor: colors.elevated,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator,
  },
  actionButton: { borderRadius: 10, padding: 14, alignItems: 'center' },
  actionButtonText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15 },
  proofImage: { width: '100%', height: 120, borderRadius: 10, marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.elevated, borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 24 },
  modalTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, color: colors.textPrimary, marginBottom: 16 },
  modalInput: {
    borderBottomWidth: 1, borderBottomColor: colors.separator, paddingVertical: 8,
    fontFamily: 'IBMPlexSans_400Regular', fontSize: 16, color: colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top', marginBottom: 16,
  },
  modalButton: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 12 },
  modalButtonText: { fontFamily: 'IBMPlexSans_500Medium', color: '#FFFFFF', fontSize: 15 },
  cancelText: { textAlign: 'center', fontFamily: 'IBMPlexSans_400Regular', color: colors.textSecondary, fontSize: 14 },
});
