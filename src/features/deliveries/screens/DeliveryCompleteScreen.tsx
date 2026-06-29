import React, { useState } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, TextInput,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { Paths, File } from 'expo-file-system';
import SignatureView from 'react-native-signature-canvas';
import api from '../../../core/api/client';
import type { RootStackParamList } from '../../../navigation/types';

type CompleteRoute = RouteProp<RootStackParamList, 'DeliveryComplete'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const steps = [
  { title: 'Delivery Photo', subtitle: 'Take a photo of the delivered items' },
  { title: 'Customer Signature', subtitle: 'Ask the customer to sign' },
  { title: 'Driver Notes', subtitle: 'Optional notes about the delivery' },
  { title: 'Review & Submit', subtitle: 'Confirm and submit' },
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
        const sigFile = new File(Paths.cache, 'signature.png');
        sigFile.create({ overwrite: true });
        sigFile.write(signatureBase64.replace(/^data:image\/\w+;base64,/, ''), { encoding: 'base64' });
        formData.append('signature', {
          uri: sigFile.uri,
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

  function handleNext() {
    if (step === 3) {
      handleSubmit();
    } else {
      setStep(step + 1);
    }
  }

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <View>
            {photo ? (
              <View>
                <Image source={{ uri: photo }} style={styles.previewImage} />
                <TouchableOpacity onPress={() => setPhoto(null)}>
                  <Text style={styles.removeText}>Remove Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.uploadArea} onPress={handlePhotoPick}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        );
      case 1:
        return (
          <View style={styles.signatureContainer}>
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
                backgroundColor="#fff"
                style={styles.signaturePad}
              />
            )}
          </View>
        );
      case 2:
        return (
          <TextInput
            style={styles.notesInput}
            placeholder="Add any notes about the delivery..."
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        );
      case 3:
        return (
          <View>
            <Text style={styles.reviewLabel}>Photo: {photo ? '✅ Attached' : '❌ Not attached'}</Text>
            <Text style={styles.reviewLabel}>Signature: {signature ? '✅ Captured' : '❌ Not captured'}</Text>
            <Text style={styles.reviewLabel}>Notes: {notes.trim() ? notes.trim() : 'None'}</Text>
          </View>
        );
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.progressRow}>
        {steps.map((_, idx) => (
          <View
            key={idx}
            style={[
              styles.progressDot,
              { backgroundColor: idx <= step ? '#000000' : '#ddd' },
            ]}
          />
        ))}
      </View>

      <Text style={styles.stepTitle}>{steps[step].title}</Text>
      <Text style={styles.stepSubtitle}>{steps[step].subtitle}</Text>

      <View style={styles.stepContent}>{renderStep()}</View>

      <View style={styles.navRow}>
        {step > 0 && (
          <TouchableOpacity
            style={styles.navButton}
            onPress={() => setStep(step - 1)}
            disabled={loading}
          >
            <Text style={styles.navButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.navButton, styles.navButtonPrimary]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={[styles.navButtonText, styles.navButtonPrimaryText]}>
            {loading ? 'Submitting...' : step < 3 ? 'Next' : 'Submit'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5', padding: 16 },
  progressRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginBottom: 24, marginTop: 8 },
  progressDot: { width: 40, height: 4, borderRadius: 2 },
  stepTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  stepSubtitle: { fontSize: 14, color: '#666', marginBottom: 24 },
  stepContent: { flex: 1, minHeight: 200 },
  uploadArea: { height: 180, borderWidth: 2, borderColor: '#ddd', borderRadius: 12, borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  uploadIcon: { fontSize: 40, marginBottom: 8 },
  uploadText: { fontSize: 16, color: '#FFC107', fontWeight: '600' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8 },
  signatureContainer: { flex: 1, minHeight: 250 },
  signaturePad: { height: 250, borderRadius: 12, borderWidth: 1, borderColor: '#ddd' },
  signaturePreview: { width: '100%', height: 200, borderRadius: 12, marginBottom: 8, backgroundColor: '#fff' },
  capturedText: { fontSize: 16, fontWeight: '600', color: '#388E3C', textAlign: 'center', marginVertical: 40 },
  removeText: { color: '#D32F2F', textAlign: 'center', marginTop: 8 },
  notesInput: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, minHeight: 120, textAlignVertical: 'top' },
  reviewLabel: { fontSize: 16, marginBottom: 12, color: '#333' },
  submitButton: { backgroundColor: '#388E3C', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 40 },
  navButton: { flex: 1, borderRadius: 12, padding: 16, alignItems: 'center', backgroundColor: '#fff' },
  navButtonPrimary: { backgroundColor: '#000000' },
  navButtonText: { fontSize: 16, fontWeight: '600', color: '#333' },
  navButtonPrimaryText: { color: '#fff' },
});
