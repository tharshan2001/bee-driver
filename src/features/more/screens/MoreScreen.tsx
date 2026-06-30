import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStackNav } from '../../../navigation/types';
import { colors } from '../../../shared/theme';

export default function MoreScreen() {
  const navigation = useNavigation<RootStackNav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>More</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 16 }}>
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
});
