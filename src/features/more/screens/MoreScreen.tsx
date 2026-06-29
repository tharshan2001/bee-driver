import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { RootStackParamList, RootStackNav } from '../../../navigation/types';

export default function MoreScreen() {
  const navigation = useNavigation<RootStackNav>();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>More</Text>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <MenuItem icon="👤" label="Profile" color="#1976D2" onPress={() => navigation.navigate('Profile')} />
        <MenuItem icon="🧾" label="Expenses" color="#FFA000" onPress={() => navigation.navigate('Expenses')} />
        <MenuItem icon="📊" label="Statistics" color="#7B1FA2" onPress={() => navigation.navigate('Stats')} />
        <MenuItem icon="🔔" label="Alerts" color="#00897B" onPress={() => navigation.navigate('Alerts')} />
      </ScrollView>
    </View>
  );
}

function MenuItem({ icon, label, color, onPress }: {
  icon: string; label: string; color: string; onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={[styles.menuIcon, { backgroundColor: color + '18' }]}>
        <Text style={styles.menuIconText}>{icon}</Text>
      </View>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuArrow}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#1A237E' },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    padding: 16, borderRadius: 12, marginBottom: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 3, elevation: 1,
  },
  menuIcon: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  menuIconText: { fontSize: 22 },
  menuLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  menuArrow: { fontSize: 22, color: '#999' },
});
