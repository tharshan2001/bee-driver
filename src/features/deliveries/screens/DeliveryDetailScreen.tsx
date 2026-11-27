import React, { useState, useCallback, useLayoutEffect } from 'react';
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
import { formatDate, formatDateTime, getStatusColor, formatMoney } from '../../../core/utils/helpers';
import SwipeToConfirm from '../../../shared/components/SwipeToConfirm';
import { useToast } from '../../../shared/context/ToastContext';
import { addressLines, formatPhone } from '../address';
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
  const [showDetails, setShowDetails] = useState(false);

  // The header carries the order number, and a menu for the rare case that something is wrong.
  const canReport = !!delivery && ['ASSIGNED', 'PICKED_UP', 'IN_TRANSIT'].includes(delivery.status.toUpperCase());
  useLayoutEffect(() => {
    if (!delivery) return;
    navigation.setOptions({
      headerTitle: () => <Text style={styles.headerTitle}>{delivery.orderInfo.orderNumber}</Text>,
      headerRight: canReport ? () => (
        <Touchable style={styles.headerButton} accessibilityRole="button" accessibilityLabel="More options"
          onPress={() => Alert.alert(delivery.customer.name, undefined, [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Report a problem', onPress: () => setShowIssueModal(true) },
          ])}>
          <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
        </Touchable>
      ) : undefined,
    });
  }, [navigation, delivery, canReport]);

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

  /** The one next step; reporting a problem lives in the header menu. */
  function nextStep(status: string) {
    switch (status.toUpperCase()) {
      case 'ASSIGNED':
        return { label: 'Mark picked up', swipe: true, action: () => updateStatus('PICKED_UP') };
      case 'PICKED_UP':
        return { label: 'Start transit', swipe: true, action: () => updateStatus('IN_TRANSIT') };
      case 'IN_TRANSIT':
        return { label: 'Complete delivery', swipe: false, action: async () => navigation.navigate('DeliveryComplete', { orderId }) };
      default:
        return null;
    }
  }

  if (loading) {
    return <ScrollView style={styles.container}><DetailSkeletons /></ScrollView>;
  }
  if (!delivery) {
    return <View style={styles.center}><Text style={{ fontFamily: 'IBMPlexSans_400Regular' }}>Delivery not found</Text></View>;
  }

  const status = delivery.status.toUpperCase();
  const next = nextStep(delivery.status);
  const failed = status.startsWith('FAILED');
  const done = status === 'DELIVERED';
  const { street, town } = addressLines(delivery.customer.address);
  const note = delivery.deliveryNotes?.trim();
  const owed = delivery.orderInfo.outstanding;
  const hidden = delivery.items.length - 2;

  return (
    <View style={styles.container}>
    <ScrollView contentContainerStyle={[styles.content, { paddingBottom: next ? 16 : insets.bottom + 16 }]}>
      <Progress status={status} />

      {/* Who and where */}
      <Appear>
        <Card padding={16}>
        <Text style={styles.name}>{delivery.customer.name}</Text>

        <Touchable style={styles.contactRow} accessibilityRole="button" accessibilityLabel={`Navigate to ${delivery.customer.address}`}
          onPress={() => openLink(mapUrl(delivery.customer.address), "Couldn't open a map")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.body}>{street}</Text>
            {!!town && <Text style={styles.sub}>{town}</Text>}
          </View>
          <View style={[styles.round, { backgroundColor: colors.primary }]}>
            <Ionicons name="navigate-outline" size={20} color={colors.textOnPrimary} />
          </View>
        </Touchable>

        <Touchable style={[styles.contactRow, styles.lastRow]} accessibilityRole="button" accessibilityLabel={`Call ${delivery.customer.phone}`}
          onPress={() => openLink(`tel:${delivery.customer.phone}`, "Couldn't open the phone")}>
          <View style={{ flex: 1 }}>
            <Text style={styles.body}>{formatPhone(delivery.customer.phone)}</Text>
            <Text style={styles.sub}>Phone</Text>
          </View>
          <View style={[styles.round, { backgroundColor: colors.successTint }]}>
            <Ionicons name="call-outline" size={20} color={colors.success} />
          </View>
        </Touchable>

        {!!note && (
          <View style={styles.note} accessible accessibilityLabel={`Delivery note: ${note}`}>
            <Ionicons name="document-text-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.noteText}>{note}</Text>
          </View>
        )}
        </Card>
      </Appear>

      {/* What to hand over and what to collect */}
      <Appear index={1}>
        <Card padding={16}>
        <View style={[styles.line, styles.firstRow, (failed || done) && styles.lastRow]}>
          <Ionicons name="cube-outline" size={20} color={colors.textSecondary} />
          <View style={{ flex: 1 }}>
            {delivery.items.slice(0, 2).map((item, idx) => (
              <Text key={idx} style={styles.item}>{item.quantity} × {item.name}</Text>
            ))}
            {hidden > 0 && <Text style={styles.item}>+ {hidden} more</Text>}
            <Text style={styles.sub}>{done ? 'Handed over' : 'To hand over'}</Text>
          </View>
        </View>

        {!failed && !done && (
          <View style={[styles.line, styles.lastRow]}>
            <Ionicons name="cash-outline" size={20} color={owed > 0 ? colors.textSecondary : colors.success} />
            {owed > 0 ? (
              <>
                <Text style={[styles.item, { flex: 1 }]}>Collect cash</Text>
                <Text style={styles.cash}>{formatMoney(owed)}</Text>
              </>
            ) : (
              <Text style={[styles.item, { color: colors.success }]}>Paid, nothing to collect</Text>
            )}
          </View>
        )}

        </Card>
      </Appear>

      <Appear index={2}>
        <Card padding={16}>
        <Touchable style={styles.toggle} accessibilityRole="button" accessibilityState={{ expanded: showDetails }}
          onPress={() => setShowDetails(!showDetails)}>
          <Text style={styles.item}>Order details</Text>
          <Ionicons name={showDetails ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
        </Touchable>

      {showDetails && (
        <View style={styles.details}>
          {delivery.scheduledDate && <InfoRow label="Scheduled" value={formatDate(delivery.scheduledDate)} />}
          <InfoRow label="Total" value={formatMoney(delivery.orderInfo.total)} />
          <InfoRow label="Paid" value={formatMoney(delivery.orderInfo.paid)} />
          <InfoRow label="Outstanding" value={formatMoney(owed)} />
          <InfoRow label="Payment" value={delivery.orderInfo.paymentStatus.replace(/_/g, ' ')} />

          <Text style={styles.heading}>Items</Text>
          {delivery.items.map((item, idx) => (
            <View key={idx} style={styles.itemRow}>
              <ItemImage imageUrl={item.imageUrl} />
              <Text style={[styles.sub, { flex: 1, color: colors.textPrimary }]}>{item.quantity} × {item.name}</Text>
              <Text style={styles.sub}>{formatMoney(item.unitPrice * item.quantity)}</Text>
            </View>
          ))}

          {delivery.timeline.length > 0 && <Text style={styles.heading}>History</Text>}
          {delivery.timeline.map((entry, idx) => (
            <View key={idx} style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: getStatusColor(entry.status) }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.sub, { color: colors.textPrimary }]}>{entry.status.replace(/_/g, ' ')}</Text>
                <Text style={styles.sub}>{formatDateTime(entry.timestamp)}</Text>
                {entry.note && <Text style={styles.sub}>{entry.note}</Text>}
              </View>
            </View>
          ))}
        </View>
      )}
        </Card>
      </Appear>

      {done && (delivery.photoUrl || delivery.signatureUrl) && (
        <Card padding={16}>
          <Text style={[styles.heading, { marginTop: 0 }]}>Delivery proof</Text>
          {[delivery.photoUrl, delivery.signatureUrl].filter(Boolean).map((url) => (
            <Touchable key={url} onPress={() => openLink(url!, "Couldn't open the file")}>
              <Image source={{ uri: url }} style={styles.proofImage} />
            </Touchable>
          ))}
        </Card>
      )}

      {!!delivery.driverNotes && (
        <Card padding={16}>
          <Text style={[styles.heading, { marginTop: 0 }]}>Your notes</Text>
          <Text style={styles.sub}>{delivery.driverNotes}</Text>
        </Card>
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
    {next && (
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 12 }]}>
        {next.swipe ? (
          // Keyed by label so the next step starts with a fresh slider.
          <SwipeToConfirm key={next.label} label={next.label} color={colors.primary} onConfirm={next.action} />
        ) : (
          <Touchable style={styles.actionButton} onPress={next.action} accessibilityRole="button">
            <Text style={styles.actionButtonText}>{next.label}</Text>
          </Touchable>
        )}
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

const STAGES: Record<string, { step: number; label: string }> = {
  ASSIGNED: { step: 0, label: 'Pick up the order' },
  PICKED_UP: { step: 1, label: 'Ready to start' },
  IN_TRANSIT: { step: 2, label: 'On the way' },
  DELIVERED: { step: 2, label: 'Delivered' },
};

/** Where the order is in the job, in three bars and a few words. */
function Progress({ status }: { status: string }) {
  const stage = STAGES[status];
  if (!stage) {
    const failed = status.startsWith('FAILED');
    return <Text style={[styles.stage, failed && { color: colors.danger }]}>{failed ? 'Delivery failed' : status.replace(/_/g, ' ')}</Text>;
  }
  return (
    <View accessible accessibilityLabel={`Stage: ${stage.label}`}>
      <View style={styles.bars}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.bar, i <= stage.step && { backgroundColor: status === 'DELIVERED' ? colors.success : colors.primary }]} />
        ))}
      </View>
      <Text style={[styles.stage, status === 'DELIVERED' && { color: colors.success }]}>{stage.label}</Text>
    </View>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.sub}>{label}</Text>
      <Text style={[styles.sub, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

// Standard sizes: 20 for the name and the cash, 15 for what is read, 13 for the rest.
const regular = 'IBMPlexSans_400Regular';
const medium = 'IBMPlexSans_500Medium';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  headerTitle: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 13, color: colors.textSecondary },
  headerButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  bars: { flexDirection: 'row', gap: 4 },
  bar: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.separator },
  stage: { fontFamily: medium, fontSize: 13, color: colors.primaryText, marginTop: 8 },
  name: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, color: colors.textPrimary, marginBottom: 4 },
  contactRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 72, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  body: { fontFamily: regular, fontSize: 15, color: colors.textPrimary },
  sub: { fontFamily: regular, fontSize: 13, color: colors.textSecondary },
  round: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  note: { flexDirection: 'row', gap: 10, backgroundColor: colors.primaryTint, borderRadius: 10, padding: 12, marginTop: 12 },
  noteText: { flex: 1, fontFamily: regular, fontSize: 14, color: colors.textPrimary },
  line: {
    flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.separator,
  },
  item: { fontFamily: medium, fontSize: 15, color: colors.textPrimary },
  cash: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, color: colors.textPrimary },
  firstRow: { paddingTop: 0 },
  lastRow: { borderBottomWidth: 0, paddingBottom: 0 },
  toggle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 24 },
  details: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.separator },
  heading: { fontFamily: medium, fontSize: 14, color: colors.textPrimary, marginTop: 16, marginBottom: 6 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, gap: 10 },
  itemImage: { width: 40, height: 40, borderRadius: 6, backgroundColor: colors.surface },
  itemImagePlaceholder: { width: 40, height: 40, borderRadius: 6, backgroundColor: colors.surface, justifyContent: 'center', alignItems: 'center' },
  timelineItem: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  proofImage: { width: '100%', height: 120, borderRadius: 10, marginBottom: 8 },
  actionBar: {
    paddingHorizontal: 16, paddingTop: 12, backgroundColor: colors.elevated,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.separator,
  },
  actionButton: { minHeight: 52, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  actionButtonText: { fontFamily: medium, fontSize: 15, color: colors.textOnPrimary },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.elevated, borderTopLeftRadius: 14, borderTopRightRadius: 14, padding: 24 },
  modalTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22, color: colors.textPrimary, marginBottom: 12 },
  modalInput: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, minHeight: 90, marginBottom: 16, textAlignVertical: 'top', fontFamily: 'IBMPlexSans_400Regular', fontSize: 15, color: colors.textPrimary },
  modalButton: { borderRadius: 10, padding: 14, alignItems: 'center', marginBottom: 12 },
  modalButtonText: { fontFamily: 'IBMPlexSans_500Medium', color: '#FFFFFF', fontSize: 15 },
  cancelText: { textAlign: 'center', fontFamily: 'IBMPlexSans_400Regular', color: colors.textSecondary, fontSize: 14 },
});
