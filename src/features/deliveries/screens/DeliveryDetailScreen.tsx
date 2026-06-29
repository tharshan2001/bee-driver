import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, TextInput, Modal, Linking, Image,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import api from '../../../core/api/client';
import type { DriverDelivery } from '../../../core/api/types';
import type { RootStackParamList, RootStackNav } from '../../../navigation/types';
import StatusBadge from '../../../shared/components/StatusBadge';
import { formatDateTime, getStatusColor, timeAgo } from '../../../core/utils/helpers';

type DetailRoute = RouteProp<RootStackParamList, 'DeliveryDetail'>;
type Nav = RootStackNav;

export default function DeliveryDetailScreen() {
  const route = useRoute<DetailRoute>();
  const navigation = useNavigation<Nav>();
  const { orderId } = route.params;
  const [delivery, setDelivery] = useState<DriverDelivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueReason, setIssueReason] = useState('');

  useEffect(() => {
    fetchDetail();
  }, [orderId]);

  async function fetchDetail() {
    try {
      const res = await api.get(`/driver/deliveries/${orderId}`);
      if (res.data?.success && res.data?.data) setDelivery(res.data.data);
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
          { label: 'Picked Up', action: () => updateStatus('PICKED_UP'), color: '#1976D2' },
          { label: 'Report Issue', action: () => setShowIssueModal(true), color: '#D32F2F' },
        ];
      case 'PICKED_UP':
        return [
          { label: 'In Transit', action: () => updateStatus('IN_TRANSIT'), color: '#FFA000' },
          { label: 'Report Issue', action: () => setShowIssueModal(true), color: '#D32F2F' },
        ];
      case 'IN_TRANSIT':
        return [
          { label: 'Complete Delivery', action: () => navigation.navigate('DeliveryComplete', { orderId }), color: '#388E3C' },
          { label: 'Report Issue', action: () => setShowIssueModal(true), color: '#D32F2F' },
        ];
      case 'FAILED':
        return [
          { label: 'Retry (Pick Up)', action: () => updateStatus('PICKED_UP'), color: '#1976D2' },
        ];
      default:
        return [];
    }
  }

  if (loading) {
    return <View style={styles.center}><Text>Loading...</Text></View>;
  }
  if (!delivery) {
    return <View style={styles.center}><Text>Delivery not found</Text></View>;
  }

  return (
    <ScrollView style={styles.container}>
      {/* Customer Card */}
      <View style={styles.card}>
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
        <TouchableOpacity onPress={() => Linking.openURL(`tel:${delivery.customer.phone}`)}>
          <Text style={styles.phone}>📞 {delivery.customer.phone}</Text>
        </TouchableOpacity>
        <Text style={styles.address}>📍 {delivery.customer.address}</Text>
      </View>

      {/* Order Info */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Order Info</Text>
        <InfoRow label="Order #" value={delivery.orderInfo.orderNumber} />
        <InfoRow label="Total" value={`$${delivery.orderInfo.total.toFixed(2)}`} />
        <InfoRow label="Paid" value={`$${delivery.orderInfo.paid.toFixed(2)}`} valueColor="#388E3C" />
        <InfoRow label="Outstanding" value={`$${delivery.orderInfo.outstanding.toFixed(2)}`} valueColor="#D32F2F" />
        <InfoRow label="Payment" value={delivery.orderInfo.paymentStatus.replace(/_/g, ' ')} />
      </View>

      {/* Items */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Items ({delivery.items.length})</Text>
        {delivery.items.map((item, idx) => (
          <View key={idx} style={styles.itemRow}>
            <Text style={{ flex: 1 }}>{item.name}</Text>
            <Text style={{ marginRight: 16 }}>x{item.quantity}</Text>
            <Text style={{ fontWeight: '600' }}>${(item.unitPrice * item.quantity).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      {/* Timeline */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status Timeline</Text>
        {delivery.timeline.map((entry, idx) => (
          <View key={idx} style={styles.timelineItem}>
            <View style={[styles.dot, { backgroundColor: getStatusColor(entry.status) }]} />
            <View style={styles.timelineContent}>
              <Text style={{ fontWeight: '600' }}>{entry.status.replace(/_/g, ' ')}</Text>
              <Text style={styles.timelineTime}>{formatDateTime(entry.timestamp)}</Text>
              {entry.note && <Text style={styles.timelineNote}>{entry.note}</Text>}
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      {getActions(delivery.status).map((btn, idx) => (
        <TouchableOpacity
          key={idx}
          style={[styles.actionButton, { backgroundColor: btn.color }]}
          onPress={btn.action}
        >
          <Text style={styles.actionButtonText}>{btn.label}</Text>
        </TouchableOpacity>
      ))}

      {/* Delivery Proof */}
      {delivery.status.toUpperCase() === 'DELIVERED' && (delivery.photoUrl || delivery.signatureUrl) && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Delivery Proof</Text>
          {delivery.photoUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(delivery.photoUrl!)}>
              <Image source={{ uri: delivery.photoUrl }} style={styles.proofImage} />
              <Text style={styles.proofLink}>📷 Tap to open photo</Text>
            </TouchableOpacity>
          )}
          {delivery.signatureUrl && (
            <TouchableOpacity onPress={() => Linking.openURL(delivery.signatureUrl!)}>
              <Image source={{ uri: delivery.signatureUrl }} style={styles.proofImage} />
              <Text style={styles.proofLink}>✍️ Tap to open signature</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Driver Notes */}
      {delivery.driverNotes && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Driver Notes</Text>
          <Text>{delivery.driverNotes}</Text>
        </View>
      )}

      <View style={{ height: 40 }} />

      {/* Report Issue Modal */}
      <Modal visible={showIssueModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Report Issue</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Describe the issue..."
              value={issueReason}
              onChangeText={setIssueReason}
              multiline
            />
            <TouchableOpacity style={styles.modalButton} onPress={handleReportIssue}>
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
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  cardTitle: { fontSize: 12, fontWeight: '600', color: '#999', marginBottom: 12, textTransform: 'uppercase' },
  customerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#1A237E', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  customerName: { fontSize: 16, fontWeight: '600' },
  district: { fontSize: 12, color: '#666' },
  phone: { fontSize: 14, color: '#1976D2', marginBottom: 8 },
  address: { fontSize: 14, color: '#333' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  infoLabel: { color: '#666' },
  infoValue: { fontWeight: '600' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  timelineItem: { flexDirection: 'row', marginBottom: 16 },
  dot: { width: 12, height: 12, borderRadius: 6, marginTop: 4, marginRight: 12 },
  timelineContent: { flex: 1 },
  timelineTime: { fontSize: 12, color: '#999', marginTop: 2 },
  timelineNote: { fontSize: 13, color: '#666', marginTop: 4 },
  actionButton: { borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 8 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  proofImage: { width: '100%', height: 120, borderRadius: 8, marginBottom: 4 },
  proofLink: { fontSize: 14, color: '#1976D2', marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  modalInput: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, fontSize: 16, minHeight: 100, textAlignVertical: 'top', marginBottom: 16 },
  modalButton: { backgroundColor: '#D32F2F', borderRadius: 12, padding: 16, alignItems: 'center', marginBottom: 12 },
  modalButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelText: { textAlign: 'center', color: '#666', fontSize: 14 },
});
