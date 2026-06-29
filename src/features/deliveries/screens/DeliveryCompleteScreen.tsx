import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, TextInput,
  LayoutAnimation, Platform, UIManager,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import SignatureView from 'react-native-signature-canvas';
import api from '../../../core/api/client';
import Card from '../../../shared/components/Card';
import type { RootStackParamList } from '../../../navigation/types';
import { colors } from '../../../shared/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type CompleteRoute = RouteProp<RootStackParamList, 'DeliveryComplete'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const steps = [
  { title: 'Delivery Photo', subtitle: 'Take a photo of the delivered items', icon: 'camera-outline' as const },
  { title: 'Customer Signature', subtitle: 'Ask the customer to sign', icon: 'create-outline' as const },
  { title: 'Driver Notes', subtitle: 'Optional notes about the delivery', icon: 'document-text-outline' as const },
  { title: 'Review & Submit', subtitle: 'Confirm and submit', icon: 'checkmark-circle-outline' as const },
];

export default function DeliveryCompleteScreen() {
  const route = useRoute<CompleteRoute>();
  const navigation = useNavigation<Nav>();
  const { orderId } = route.params;

  const [step, setStep] = useState(0);
  const [photo, setPhoto] = useState<string | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [signatureBase64, setSignatureBase64] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Camera permission is required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) setPhoto(result.assets[0].uri);
  }

  function handlePhotoPick() {
    Alert.alert('Add Photo', '', [
      { text: 'Take Photo', onPress: takePhoto },
      { text: 'Choose from Gallery', onPress: pickPhoto },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  function handleSignature(sig: string) {
    setSignatureBase64(sig);
    setSignature('captured');
  }

  function handleSignatureClear() {
    setSignature(null);
    setSignatureBase64(null);
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      const formData = new FormData();
      if (photo) {
        formData.append('photo', {
          uri: photo,
          type: 'image/jpeg',
          name: 'delivery_photo.jpg',
        } as any);
      }
      if (signatureBase64) {
        formData.append('signature', {
          uri: signatureBase64,
          type: 'image/png',
          name: 'signature.png',
        } as any);
      }
      if (notes.trim()) formData.append('driverNotes', notes.trim());

      await api.post(`/driver/deliveries/${orderId}/complete`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Delivery Completed!', 'The delivery has been successfully completed.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Submission failed');
    } finally {
      setLoading(false);
    }
  }

  function goNext() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (step === 3) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  }

  function goBack() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep(step - 1);
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <Card padding={16} style={{ alignItems: 'center' }}>
            {photo ? (
              <View style={{ width: '100%' }}>
                <Image source={{ uri: photo }} style={styles.previewImage} />
                <TouchableOpacity onPress={() => setPhoto(null)}>
                  <Text style={styles.removeText}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={handlePhotoPick}>
                <Ionicons name="camera-outline" size={40} color={colors.accent} style={{ marginBottom: 8 }} />
                <Text style={styles.uploadText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </Card>
        );
      case 1:
        return (
          <Card padding={16} style={{ minHeight: 280 }}>
            {signature ? (
              <View>
                <Image
                  source={{ uri: signatureBase64! }}
                  style={styles.signaturePreview}
                  resizeMode="contain"
                />
                <TouchableOpacity onPress={handleSignatureClear}>
                  <Text style={styles.removeText}>Clear & Redo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <SignatureView
                onOK={handleSignature}
                onEmpty={() => Alert.alert('Error', 'Please sign first')}
                descriptionText="Sign here"
                clearText="Clear"
                confirmText="Save"
                autoClear={false}
                backgroundColor={colors.card}
                style={styles.signaturePad}
              />
            )}
          </Card>
        );
      case 2:
        return (
          <Card padding={0} style={{ overflow: 'hidden' }}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes about the delivery..."
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </Card>
        );
      case 3:
        return (
          <Card padding={16} style={{ gap: 12 }}>
            <ReviewRow icon="camera-outline" label="Photo" done={!!photo} />
            <ReviewRow icon="create-outline" label="Signature" done={!!signature} />
            <ReviewRow icon="document-text-outline" label="Notes" done={notes.trim().length > 0} detail={notes.trim() || undefined} />
          </Card>
        );
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.progressRow}>
        {steps.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              idx <= step ? styles.progressDotActive : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.stepHeader}>
        <Ionicons name={steps[step].icon} size={24} color={colors.primary} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>{steps[step].title}</Text>
          <Text style={styles.stepSubtitle}>{steps[step].subtitle}</Text>
        </View>
      </View>

      <View style={styles.stepContent}>{renderStep()}</View>

      <View style={styles.navRow}>
        {step > 0 && (
          <TouchableOpacity style={styles.navButton} onPress={goBack} disabled={loading}>
            <Ionicons name="arrow-back-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.navButtonText}> Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={goNext}
          disabled={loading}
        >
          <Text style={[styles.navButtonText, styles.navButtonPrimaryText]}>
            {loading ? 'Submitting...' : step < 3 ? 'Next' : 'Submit'}
          </Text>
          {!loading && <Ionicons name="arrow-forward-outline" size={18} color={colors.textOnPrimary} style={{ marginLeft: 4 }} />}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ReviewRow({ icon, label, done, detail }: { icon: keyof typeof Ionicons.glyphMap; label: string; done: boolean; detail?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Ionicons name={icon} size={20} color={done ? colors.success : colors.textMuted} style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontWeight: '600', color: colors.textPrimary, fontSize: 15 }}>{label}</Text>
        {detail && <Text style={{ fontSize: 13, color: colors.textSecondary }}>{detail}</Text>}
      </View>
      <Ionicons name={done ? 'checkmark-circle' : 'close-circle'} size={22} color={done ? colors.success : colors.textMuted} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24, marginTop: 8 },
  progressDot: { width: 48, height: 4, borderRadius: 2 },
  progressDotActive: { backgroundColor: colors.primary },
  progressDotInactive: { backgroundColor: colors.border },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  stepSubtitle: { fontSize: 14, color: colors.textSecondary },
  stepContent: { minHeight: 200 },
  uploadArea: {
    height: 180, borderWidth: 2, borderColor: colors.border, borderRadius: 12,
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.card, width: '100%',
  },
  uploadText: { fontSize: 16, color: colors.accent, fontWeight: '600' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
  signatureContainer: { flex: 1, minHeight: 250 },
  signaturePad: { height: 250, borderRadius: 12, borderWidth: 1, borderColor: colors.border },
  signaturePreview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8, backgroundColor: colors.card },
  removeText: { color: colors.danger, textAlign: 'center', marginTop: 8, fontSize: 14, fontWeight: '500' },
  notesInput: { borderRadius: 12, padding: 14, fontSize: 16, minHeight: 120, textAlignVertical: 'top', color: colors.textPrimary },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 40 },
  navButton: {
    flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.card, flexDirection: 'row',
  },
  navButtonPrimary: { backgroundColor: colors.primary },
  navButtonText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  navButtonPrimaryText: { color: colors.textOnPrimary },
});
