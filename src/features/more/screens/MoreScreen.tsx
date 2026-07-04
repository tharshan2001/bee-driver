import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../../context/AuthContext';
import type { RootStackNav } from '../../../navigation/types';
import { colors } from '../../../shared/theme';

export default function MoreScreen() {
  const navigation = useNavigation<RootStackNav>();
  const insets = useSafeAreaInsets();
  const { availability, setAvailability } = useAuth();

  function toggleAvailability(value: boolean) {
    Alert.alert(
      'Change Status',
      value ? 'Go online and start receiving deliveries?' : 'Go offline and stop receiving deliveries?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => setAvailability(value) },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>More</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
        <View style={styles.statusCard}>
          <View style={styles.statusInfo}>
            <Text style={styles.statusLabel}>DRIVER STATUS</Text>
            <Text style={[styles.statusValue, { color: availability ? colors.success : colors.danger }]}>
              {availability ? 'ONLINE' : 'OFFLINE'}
            </Text>
          </View>
          <Switch
            value={availability}
            onValueChange={toggleAvailability}
            trackColor={{ false: colors.separator, true: colors.primary }}
            thumbColor={colors.background}
          />
        </View>

        <MenuItem icon="person-outline" label="Profile" onPress={() => navigation.navigate('Profile')} />
        <MenuItem icon="receipt-outline" label="Expenses" onPress={() => navigation.navigate('Expenses')} />
        <MenuItem icon="bar-chart-outline" label="Statistics" onPress={() => navigation.navigate('Stats')} />
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, label, onPress }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: 20 },
  headerTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 28, color: colors.textPrimary },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.elevated,
    padding: 16, borderRadius: 10, marginBottom: 8,
    shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primaryTint,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuLabel: { flex: 1, fontFamily: 'IBMPlexSans_500Medium', fontSize: 16, color: colors.textPrimary },
  menuArrow: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 18, color: colors.textTertiary },
  statusCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.elevated, padding: 16, borderRadius: 10, marginBottom: 8,
    shadowColor: colors.shadow, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 2 }, elevation: 3,
  },
  statusInfo: { gap: 4 },
  statusLabel: {
    fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, color: colors.textTertiary, textTransform: 'uppercase',
  },
  statusValue: {
    fontFamily: 'SpaceGrotesk_700Bold', fontSize: 20, textTransform: 'uppercase',
  },
});
