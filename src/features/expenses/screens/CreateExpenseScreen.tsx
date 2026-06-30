import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../core/api/client';
import { formatDate } from '../../../core/utils/helpers';
import { colors } from '../../../shared/theme';

const categories = ['FUEL', 'MAINTENANCE', 'PARKING', 'TOLL', 'OTHER'];

export default function CreateExpenseScreen() {
  const navigation = useNavigation();
  const [category, setCategory] = useState('FUEL');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCategories, setShowCategories] = useState(false);

  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) setReceipt(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      return Alert.alert('Error', 'Enter a valid amount');
    }
    if (!description.trim()) return Alert.alert('Error', 'Description is required');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('expense', JSON.stringify({
        category,
        amount: Number(amount),
        description: description.trim(),
        date: date.toISOString().split('T')[0],
      }));
      if (receipt) {
        formData.append('receipt', {
          uri: receipt,
          type: 'image/jpeg',
          name: 'receipt.jpg',
        } as any);
      }

      await api.post('/driver/expenses', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      Alert.alert('Success', 'Expense created');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to create expense');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Field label="CATEGORY">
        <TouchableOpacity style={styles.selector} onPress={() => setShowCategories(!showCategories)}>
          <Text style={styles.selectorText}>{category}</Text>
          <Text style={{ fontFamily: 'IBMPlexMono_500Medium', color: colors.textTertiary }}>▼</Text>
        </TouchableOpacity>
        {showCategories && (
          <View style={styles.dropdown}>
            {categories.map((c) => (
              <TouchableOpacity
                key={c}
                style={[styles.dropdownItem, category === c && styles.dropdownItemActive]}
                onPress={() => { setCategory(c); setShowCategories(false); }}
              >
                <Text style={[styles.dropdownText, category === c && styles.dropdownTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Field>

      <Field label="AMOUNT (LKR)">
        <TextInput
          style={[styles.amountInput]}
          value={amount}
          onChangeText={setAmount}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={colors.textTertiary}
        />
      </Field>

      <Field label="DESCRIPTION">
        <TextInput
          style={styles.textArea}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="What was this for?"
          placeholderTextColor={colors.textTertiary}
        />
      </Field>

      <Field label="DATE">
        <TouchableOpacity style={styles.selector} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.selectorText}>{formatDate(date)}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_event: any, selectedDate?: Date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) setDate(selectedDate);
            }}
          />
        )}
      </Field>

      <Field label="RECEIPT (OPTIONAL)">
        {receipt ? (
          <View>
            <Image source={{ uri: receipt }} style={styles.receiptPreview} />
            <TouchableOpacity onPress={() => setReceipt(null)}>
              <Text style={styles.removeText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.uploadBtn} onPress={pickReceipt}>
            <Ionicons name="camera-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.uploadBtnText}>Upload Receipt</Text>
          </TouchableOpacity>
        )}
      </Field>

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Expense'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24 },
  fieldGroup: { marginBottom: 20 },
  label: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary, marginBottom: 6, textTransform: 'uppercase' },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.separator, paddingVertical: 8 },
  selectorText: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 16, color: colors.textPrimary },
  dropdown: { backgroundColor: colors.elevated, borderRadius: 10, marginTop: 4, overflow: 'hidden', shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: colors.separator },
  dropdownItemActive: { backgroundColor: colors.primaryTint },
  dropdownText: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 14, color: colors.textPrimary },
  dropdownTextActive: { color: colors.primary, fontFamily: 'IBMPlexSans_500Medium' },
  amountInput: {
    borderBottomWidth: 1, borderBottomColor: colors.separator, paddingVertical: 8,
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 22, color: colors.textPrimary,
  },
  textArea: { borderBottomWidth: 1, borderBottomColor: colors.separator, paddingVertical: 8, fontFamily: 'IBMPlexSans_400Regular', fontSize: 16, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top' },
  receiptPreview: { width: '100%', height: 150, borderRadius: 10, marginBottom: 8 },
  removeText: { fontFamily: 'IBMPlexSans_400Regular', color: colors.danger, textAlign: 'center' },
  uploadBtn: { backgroundColor: colors.surface, borderRadius: 10, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: colors.separator, borderStyle: 'dashed', flexDirection: 'row', justifyContent: 'center' },
  uploadBtnText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 12, color: colors.primary },
  submitBtn: { backgroundColor: colors.primary, borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 16 },
  submitBtnText: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textOnPrimary },
});
