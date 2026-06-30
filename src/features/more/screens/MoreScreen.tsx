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
  container: { flex: 1, backgroundColor: colors.kraft },
  header: { padding: 20, backgroundColor: colors.paper, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 18, color: colors.textPrimary },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paper,
    padding: 16, borderRadius: 4, marginBottom: 8, borderWidth: 1, borderColor: colors.border,
    shadowColor: colors.shadow, shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 1 }, elevation: 2,
  },
  menuIcon: {
    width: 40, height: 40, borderRadius: 4, borderWidth: 1.5, borderColor: colors.primary,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  menuLabel: { flex: 1, fontFamily: 'IBMPlexSans_500Medium', fontSize: 16, color: colors.textPrimary },
  menuArrow: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 18, color: colors.textMuted },
});
