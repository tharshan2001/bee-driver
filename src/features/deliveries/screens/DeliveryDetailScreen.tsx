import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Linking, Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import api from '../../../core/api/client';
import type { DriverDelivery } from '../../../core/api/types';
import type { RootStackParamList, RootStackNav } from '../../../navigation/types';
import Card from '../../../shared/components/Card';
import Skeleton from '../../../shared/components/Skeleton';
import { formatDateTime, getStatusColor, timeAgo } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

type DetailRoute = RouteProp<RootStackParamList, 'DeliveryDetail'>;
type Nav = RootStackNav;

function DetailSkeletons() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} padding={16} style={{ gap: 10 }}>
          <Skeleton width="40%" height={12} borderRadius={4} />
          <Skeleton width="80%" height={16} />
          <Skeleton width="60%" height={14} />
        </Card>
      ))}
    </View>
  );
}

export default function DeliveryDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const { orderId } = route.params;
  const [delivery, setDelivery] = useState<DriverDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueReason, setIssueReason] = useState('');
  const cardAnims = useRef([0, 1, 2, 3, 4, 5].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    fetchDetail();
  }, [orderId]);

  async function fetchDetail() {
    try {
      const res = await api.get(`/driver/deliveries/${orderId}`);
      if (res.data?.success && res.data?.data) {
        setDelivery(res.data.data);
        Animated.stagger(100, cardAnims.map((a) =>
          Animated.timing(a, { toValue: 1, duration: 300, useNativeDriver: true })
        )).start();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(status: string, reason?: string) {
    try {
      await api.patch(`/driver/deliveries/${orderId}/status`, { status, reason });
      Alert.alert('Success', 'Status updated');
      fetchDetail();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed');
    }
  }

  function handleReportIssue() {
    if (!issueReason.trim()) return Alert.alert('Error', 'Please enter a reason');
    updateStatus('FAILED', issueReason.trim());
    setShowIssueModal(false);
    setIssueReason('');
  }

  function getActions(status: string) {
    switch (status.toUpperCase()) {
      case 'ASSIGNED':
        return [
          { label: 'Picked Up', action: () => updateStatus('PICKED_UP'), color: colors.primary, textColor: colors.textOnPrimary },
          { label: 'Report Issue', action: () => setShowIssueModal(true), color: colors.danger, textColor: '#ffffff' },
        ];
      case 'PICKED_UP':
        return [
          { label: 'In Transit', action: () => updateStatus('IN_TRANSIT'), color: colors.warning, textColor: colors.warningContent },
          { label: 'Report Issue', action: () => setShowIssueModal(true), color: colors.danger, textColor: '#ffffff' },
        ];
      case 'IN_TRANSIT':
        return [
          { label: 'Complete Delivery', action: () => navigation.navigate('DeliveryComplete', { orderId }), color: colors.primary, textColor: colors.textOnPrimary },
          { label: 'Report Issue', action: () => setShowIssueModal(true), color: colors.danger, textColor: '#ffffff' },
        ];
      case 'FAILED':
        return [
          { label: 'Retry (Pick Up)', action: () => updateStatus('PICKED_UP'), color: colors.primary, textColor: colors.textOnPrimary },
        ];
      default:
        return [];
    }
  }

  function AnimatedCard({ children, index, style }: { children: React.ReactNode; index: number; style?: any }) {
    const opacity = cardAnims[index] || 1;
    return (
      <Animated.View style={{ opacity, transform: [{ translateY: cardAnims[index]?.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) || 0 }] }}>
        <Card padding={16} style={style}>{children}</Card>
      </Animated.View>
    );
  }

  if (loading) {
    return <ScrollView style={styles.container}><DetailSkeletons /></ScrollView>;
  }
  if (!delivery) {
    return <View style={styles.center}><Text>Delivery not found</Text></View>;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <AnimatedCard index={0}>
        <Text style={styles.cardTitle}>Customer</Text>
        <View style={styles.customerRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{delivery.customer.name[0]}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{delivery.customer.name}</Text>
            {delivery.customer.district && <Text style={styles.district}>{delivery.customer.district}</Text>}
          </View>
        </View>
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${delivery.customer.phone}`)} style={styles.linkRow}>
          <Ionicons name="call-outline" size={16} color={colors.accent} />
          <Text style={styles.linkText}> {delivery.customer.phone}</Text>
        </TouchableOpacity>
        <View style={styles.linkRow}>
          <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.linkText, { color: colors.textPrimary }]}> {delivery.customer.address}</Text>
        </View>
      </AnimatedCard>

      <AnimatedCard index={1}>
        <Text style={styles.cardTitle}>Order Info</Text>
        <InfoRow label="Order #" value={delivery.orderInfo.orderNumber} />
        <InfoRow label="Total" value={`LKR ${delivery.orderInfo.total.toFixed(2)}`} />
        <InfoRow label="Paid" value={`LKR ${delivery.orderInfo.paid.toFixed(2)}`} valueColor={colors.success} />
        <InfoRow label="Outstanding" value={`LKR ${delivery.orderInfo.outstanding.toFixed(2)}`} valueColor={colors.danger} />
        <InfoRow label="Payment" value={delivery.orderInfo.paymentStatus.replace(/_/g, ' ')} />
      </AnimatedCard>

      <AnimatedCard index={2}>
        <Text style={styles.cardTitle}>Items ({delivery.items.length})</Text>
        {delivery.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={{ flex: 1, color: colors.textPrimary }}>{item.name}</Text>
            <Text style={{ marginRight: 16, color: colors.textSecondary }}>x{item.quantity}</Text>
            <Text style={{ fontWeight: '600', color: colors.textPrimary }}>LKR {(item.unitPrice * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </AnimatedCard>

      <AnimatedCard index={3}>
        <Text style={styles.cardTitle}>Status Timeline</Text>
        {delivery.timeline.map((entry, idx) => (
          <View key={idx} style={styles.timelineItem}>
            <View style={styles.timelineDotCol}>
              <View style={[styles.timelineDot, { backgroundColor: getStatusColor(entry.status) }]} />
              {idx < delivery.timeline.length - 1 && <View style={styles.timelineLine} />}
            </View>
            <View style={styles.timelineContent}>
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                {entry.status.replace(/_/g, ' ')}
              </Text>
              <Text style={styles.timelineTime}>{formatDateTime(entry.timestamp)}</Text>
              {entry.note && <Text style={styles.timelineNote}>{entry.note}</Text>}
            </View>
          </View>
        ))}
      </AnimatedCard>

      {getActions(delivery.status).map((btn: any, idx: number) => (
        <TouchableOpacity
          key={idx}
          style={[styles.actionButton, { backgroundColor: btn.color }]}
          onPress={btn.action}
        >
          <Text style={[styles.actionButtonText, { color: btn.textColor }]}>{btn.label}</Text>
        </TouchableOpacity>
      ))}

      {delivery.status.toUpperCase() === 'DELIVERED' && (delivery.photoUrl || delivery.signatureUrl) && (
        <AnimatedCard index={4}>
          <Text style={styles.cardTitle}>Delivery Proof</Text>
          {delivery.photoUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(delivery.photoUrl!)} style={{ marginBottom: 8 }}>
              <Image source={{ uri: delivery.photoUrl }} style={styles.proofImage} />
              <View style={styles.linkRow}>
                <Ionicons name="camera-outline" size={16} color={colors.accent} />
                <Text style={styles.linkText}> Tap to open photo</Text>
              </View>
            </TouchableOpacity>
          )}
          {delivery.signatureUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(delivery.signatureUrl!)}>
              <Image source={{ uri: delivery.signatureUrl }} style={styles.proofImage} />
              <View style={styles.linkRow}>
                <Ionicons name="create-outline" size={16} color={colors.accent} />
                <Text style={styles.linkText}> Tap to open signature</Text>
              </View>
            </TouchableOpacity>
          )}
        </AnimatedCard>
      )}

      {delivery.driverNotes && (
        <AnimatedCard index={5}>
          <Text style={styles.cardTitle}>Driver Notes</Text>
          <Text style={{ color: colors.textPrimary }}>{delivery.driverNotes}</Text>
        </AnimatedCard>
      )}

      <View style={{ height: 40 }} />

      <Modal visible={showIssueModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Issue</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Describe the issue..."
              placeholderTextColor={colors.textMuted}
              value={issueReason}
              onChangeText={setIssueReason}
              multiline
            />
            <TouchableOpacity style={[styles.modalButton, { backgroundColor: colors.danger }]} onPress={handleReportIssue}>
              <Text style={styles.modalButtonText}>Submit Report</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowIssueModal(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, valueColor ? { color: valueColor } : undefined]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted, marginBottom: 12, textTransform: 'uppercase' },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: colors.textOnPrimary, fontSize: 20, fontWeight: 'bold' },
  customerName: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  district: { fontSize: 12, color: colors.textSecondary },
  linkRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  linkText: { fontSize: 14, color: colors.successDeep },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  infoValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.canvas },
  timelineItem: { flexDirection: 'row', marginBottom: 4 },
  timelineDotCol: { alignItems: 'center', width: 20, marginRight: 12 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, marginTop: 4 },
  timelineLine: { width: 2, flex: 1, backgroundColor: colors.border, marginVertical: 4 },
  timelineContent: { flex: 1, paddingBottom: 16 },
  timelineTime: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  timelineNote: { fontSize: 13, color: colors.textSecondary, marginTop: 4 },
  actionButton: { borderRadius: 24, padding: 16, alignItems: 'center', marginBottom: 8, marginHorizontal: 16 },
  actionButtonText: { fontSize: 16, fontWeight: '600' },
  proofImage: { width: '100%', height: 120, borderRadius: 12, marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 16 },
  modalInput: { backgroundColor: colors.canvas, borderRadius: 12, padding: 14, fontSize: 16, color: colors.textPrimary, minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
  modalButton: { borderRadius: 24, padding: 16, alignItems: 'center', marginBottom: 12 },
  modalButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '600' },
  cancelText: { textAlign: 'center', color: colors.textSecondary, fontSize: 14 },
});
