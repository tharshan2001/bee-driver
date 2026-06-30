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
import WaybillCard from '../../../shared/components/Card';
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
          <WaybillCard padding={16} style={{ alignItems: 'center' }}>
            {photo ? (
              <View style={{ width: '100%' }}>
                <Image source={{ uri: photo }} style={styles.previewImage} />
                <TouchableOpacity onPress={() => setPhoto(null)}>
                  <Text style={styles.removeText}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={handlePhotoPick}>
                <Ionicons name="camera-outline" size={32} color={colors.primary} style={{ marginBottom: 8 }} />
                <Text style={styles.uploadText}>Add photo</Text>
              </TouchableOpacity>
            )}
          </WaybillCard>
        );
      case 1:
        return (
          <WaybillCard padding={16} style={{ minHeight: 280 }}>
            {signature ? (
              <View>
                <Image
                  source={{ uri: signatureBase64! }}
                  style={styles.signaturePreview}
                  resizeMode="contain"
                />
                <TouchableOpacity onPress={handleSignatureClear}>
                  <Text style={styles.removeText}>Clear & redo</Text>
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
                backgroundColor={colors.paper}
                webStyle={`.m-signature-pad--footer { display: none; } .m-signature-pad { border: none; }`}
                style={styles.signaturePad}
              />
            )}
          </WaybillCard>
        );
      case 2:
        return (
          <WaybillCard padding={0} style={{ overflow: 'hidden' }}>
            <TextInput
              style={styles.notesInput}
              placeholder="Add any notes about this delivery…"
              placeholderTextColor={colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </WaybillCard>
        );
      case 3:
        return (
          <WaybillCard padding={16} style={{ gap: 12 }}>
            <ReviewRow icon="camera-outline" label="Photo" done={!!photo} />
            <ReviewRow icon="create-outline" label="Signature" done={!!signature} />
            <ReviewRow icon="document-text-outline" label="Notes" done={notes.trim().length > 0} detail={notes.trim() || undefined} />
          </WaybillCard>
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
              idx < step ? styles.progressDotCompleted : idx === step ? styles.progressDotCurrent : styles.progressDotInactive,
            ]}
          />
        ))}
      </View>

      <View style={styles.stepHeader}>
        <Ionicons name={steps[step].icon} size={22} color={colors.primary} style={{ marginRight: 12 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.stepTitle}>{steps[step].title}</Text>
          <Text style={styles.stepSubtitle}>{steps[step].subtitle}</Text>
        </View>
      </View>

      <View style={styles.stepContent}>{renderStep()}</View>

      <View style={styles.navRow}>
        {step > 0 && (
          <TouchableOpacity style={[styles.navButton, styles.navButtonSecondary]} onPress={goBack} disabled={loading}>
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={goNext}
          disabled={loading}
        >
          <Text style={[styles.navButtonText, { color: colors.paper }]}>
            {loading ? 'Submitting...' : step < 3 ? 'Next' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function ReviewRow({ icon, label, done, detail }: { icon: keyof typeof Ionicons.glyphMap; label: string; done: boolean; detail?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View style={[styles.reviewMark, { backgroundColor: done ? colors.successTint : 'transparent', borderColor: done ? colors.success : colors.border }]}>
        <Text style={{ fontFamily: 'IBMPlexMono_500Medium', fontSize: 14, color: done ? colors.success : colors.textMuted }}>
          {done ? '✓' : '✗'}
        </Text>
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textPrimary }}>{label}</Text>
        {detail && <Text style={{ fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary }}>{detail}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.kraft },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24, marginTop: 8 },
  progressDot: { width: 40, height: 4, borderRadius: 2 },
  progressDotCompleted: { backgroundColor: colors.primary },
  progressDotCurrent: { backgroundColor: colors.primary, borderWidth: 1, borderColor: colors.primary, height: 4 },
  progressDotInactive: { backgroundColor: colors.border },
  stepHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, color: colors.textPrimary },
  stepSubtitle: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 13, color: colors.textSecondary },
  stepContent: { minHeight: 200 },
  uploadArea: {
    height: 180, borderWidth: 1.5, borderColor: colors.border, borderRadius: 4,
    borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: colors.paper, width: '100%',
  },
  uploadText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 12, color: colors.primary, textTransform: 'uppercase' },
  previewImage: { width: '100%', height: 200, borderRadius: 4, marginBottom: 8 },
  signaturePad: { height: 250, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  signaturePreview: { width: '100%', height: 200, borderRadius: 4, marginBottom: 8, backgroundColor: colors.paper },
  removeText: { fontFamily: 'IBMPlexSans_400Regular', color: colors.danger, textAlign: 'center', marginTop: 8, fontSize: 14 },
  notesInput: {
    borderRadius: 4, padding: 14, fontSize: 16, fontFamily: 'IBMPlexSans_400Regular',
    minHeight: 120, textAlignVertical: 'top', color: colors.textPrimary,
    borderBottomWidth: 1.5, borderBottomColor: colors.border,
  },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 40 },
  navButton: { flex: 1, borderRadius: 4, padding: 14, alignItems: 'center', justifyContent: 'center' },
  navButtonSecondary: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.border },
  navButtonPrimary: { backgroundColor: colors.primary },
  navButtonText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textPrimary },
  reviewMark: {
    width: 28, height: 28, borderRadius: 4, borderWidth: 1.5,
    justifyContent: 'center', alignItems: 'center',
  },
});
