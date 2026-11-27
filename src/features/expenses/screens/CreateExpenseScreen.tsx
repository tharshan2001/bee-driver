import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert, Image, Platform } from 'react-native';
import { haptics } from '../../../shared/haptics';
import Touchable from '../../../shared/components/Touchable';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import api from '../../../core/api/client';
import { formatDate } from '../../../core/utils/helpers';
import { useToast } from '../../../shared/context/ToastContext';
import { colors } from '../../../shared/theme';
import Button from '../../../shared/components/Button';
import TextField, { fieldLabel } from '../../../shared/components/TextField';

// Must be values of the backend's ExpenseCategory.
const categories = ['PETROL', 'MAINTENANCE', 'PARKING', 'TOLL', 'OTHER'];

// The date as picked on the phone. toISOString() is UTC, which is yesterday before 5.30am in Sri Lanka.
function localDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function CreateExpenseScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const toast = useToast();
  const [category, setCategory] = useState('PETROL');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function pickReceipt() {
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!result.canceled && result.assets[0]) setReceipt(result.assets[0].uri);
  }

  async function handleSubmit() {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      haptics.error();
      return toast.show({ type: 'error', title: 'Enter a valid amount' });
    }
    if (!description.trim()) {
      haptics.error();
      return toast.show({ type: 'error', title: 'Description is required' });
    }

    setLoading(true);
    try {
      const formData = new FormData();
      // The server only reads this part if it is labelled as JSON. React Native does that for
      // a { string, type } part; a plain string is rejected with 415.
      formData.append('expense', {
        string: JSON.stringify({
          category,
          amount: Number(amount),
          description: description.trim(),
          dateIncurred: localDate(date),
        }),
        type: 'application/json',
      } as any);
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
      haptics.success();
      toast.show({ type: 'success', title: 'Expense created' });
      navigation.goBack();
    } catch (err: any) {
      haptics.error();
      toast.show({ type: 'error', title: err?.response?.data?.message || 'Failed to create expense' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 16 }]} keyboardShouldPersistTaps="handled">
      <Text style={fieldLabel}>CATEGORY</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {categories.map((c) => (
          <Touchable key={c} style={[styles.chip, category === c && styles.chipOn]} onPress={() => setCategory(c)}
            accessibilityRole="tab" accessibilityState={{ selected: category === c }}>
            <Text style={[styles.chipText, category === c && styles.chipTextOn]}>{c}</Text>
          </Touchable>
        ))}
      </ScrollView>

      <TextField label="AMOUNT (LKR)" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="0.00" />
      <TextField label="DESCRIPTION" value={description} onChangeText={setDescription} multiline placeholder="What was this for?" />

      <Field label="DATE">
        <Touchable style={styles.selector} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.selectorText}>{formatDate(date)}</Text>
        </Touchable>
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
            <Touchable onPress={() => setReceipt(null)}>
              <Text style={styles.removeText}>Remove</Text>
            </Touchable>
          </View>
        ) : (
          <Touchable style={styles.uploadBtn} onPress={pickReceipt} accessibilityRole="button">
            <Ionicons name="image-outline" size={24} color={colors.primaryText} />
            <Text style={styles.uploadBtnText}>UPLOAD RECEIPT</Text>
          </Touchable>
        )}
      </Field>

      <Button title="Save Expense" onPress={handleSubmit} loading={loading} />
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View>
      <Text style={fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  chips: { gap: 18 },
  chip: { paddingVertical: 8, borderBottomWidth: 3, borderBottomColor: 'transparent' },
  chipOn: { borderBottomColor: colors.primary },
  chipText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 11, color: colors.textTertiary },
  chipTextOn: { color: colors.textPrimary },
  selector: { minHeight: 48, justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 14 },
  selectorText: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 15, color: colors.textPrimary },
  receiptPreview: { width: '100%', height: 150, borderRadius: 10, marginBottom: 8 },
  removeText: { fontFamily: 'IBMPlexSans_400Regular', color: colors.danger, textAlign: 'center' },
  uploadBtn: { height: 90, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', gap: 6 },
  uploadBtnText: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 12, color: colors.primaryText },
});
