import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity, StyleSheet, Alert, Image, Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../core/api/client';
import { formatDate } from '../../../core/utils/helpers';

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
      <Text style={styles.label}>Category</Text>
      <TouchableOpacity style={styles.selector} onPress={() => setShowCategories(!showCategories)}>
        <Text style={styles.selectorText}>{category}</Text>
        <Text style={{ color: '#999' }}>▼</Text>
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

      <Text style={styles.label}>Amount ($)</Text>
      <TextInput
        style={styles.input}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        placeholder="0.00"
      />

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={description}
        onChangeText={setDescription}
        multiline
        placeholder="What was this for?"
      />

      <Text style={styles.label}>Date</Text>
      <TouchableOpacity
        style={styles.selector}
        onPress={() => setShowDatePicker(true)}
      >
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

      <Text style={styles.label}>Receipt (Optional)</Text>
      {receipt ? (
        <View>
          <Image source={{ uri: receipt }} style={styles.receiptPreview} />
          <TouchableOpacity onPress={() => setReceipt(null)}>
            <Text style={styles.removeText}>Remove</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadBtn} onPress={pickReceipt}>
          <Text style={styles.uploadBtnText}>📎 Upload Receipt</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.submitBtnText}>{loading ? 'Submitting...' : 'Submit Expense'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { padding: 24 },
  label: { fontSize: 13, fontWeight: '600', color: '#666', marginBottom: 6, marginTop: 16 },
  input: { backgroundColor: '#fff', borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1, borderColor: '#ddd' },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  selector: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#ddd' },
  selectorText: { fontSize: 16, color: '#333' },
  dropdown: { backgroundColor: '#fff', borderRadius: 12, marginTop: 4, overflow: 'hidden', borderWidth: 1, borderColor: '#ddd' },
  dropdownItem: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  dropdownItemActive: { backgroundColor: '#FFF8E1' },
  dropdownText: { fontSize: 14, color: '#333' },
  dropdownTextActive: { color: '#FFC107', fontWeight: '600' },
  receiptPreview: { width: '100%', height: 150, borderRadius: 12, marginBottom: 8 },
  removeText: { color: '#D32F2F', textAlign: 'center' },
  uploadBtn: { backgroundColor: '#fff', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ddd', borderStyle: 'dashed' },
  uploadBtnText: { fontSize: 14, color: '#FFC107' },
  submitBtn: { backgroundColor: '#000000', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 32 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
