import React from 'react';
import { Linking, Platform, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Touchable from './Touchable';
import { useToast } from '../context/ToastContext';
import { colors } from '../theme';

/** Large Call and Navigate buttons for a customer. */
export default function ContactButtons({ phone, address }: { phone: string; address: string }) {
  const toast = useToast();
  const open = (url: string, failure: string) =>
    Linking.openURL(url).catch(() => toast.show({ type: 'error', title: failure }));

  return (
    <View style={styles.row}>
      <Touchable style={styles.button} accessibilityRole="button" accessibilityLabel={`Call ${phone}`}
        onPress={() => open(`tel:${phone}`, "Couldn't open the phone")}>
        <Ionicons name="call-outline" size={18} color={colors.success} />
        <Text style={styles.text}>Call {phone}</Text>
      </Touchable>
      <Touchable style={styles.button} accessibilityRole="button" accessibilityLabel="Navigate to the address"
        onPress={() => open(mapUrl(address), "Couldn't open a map")}>
        <Ionicons name="navigate-outline" size={18} color={colors.success} />
        <Text style={styles.text}>Navigate</Text>
      </Touchable>
    </View>
  );
}

/** The phone's map app, searching for the address. */
function mapUrl(address: string): string {
  const q = encodeURIComponent(address);
  return Platform.OS === 'ios' ? `http://maps.apple.com/?q=${q}` : `geo:0,0?q=${q}`;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, marginTop: 8 },
  button: {
    flexGrow: 1, minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingHorizontal: 12, borderRadius: 10, backgroundColor: colors.successTint,
  },
  text: { fontFamily: 'IBMPlexSans_500Medium', fontSize: 14, color: colors.success },
});
