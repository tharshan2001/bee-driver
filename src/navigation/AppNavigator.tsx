import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../shared/theme';

import DashboardScreen from '../features/dashboard/screens/DashboardScreen';
import DeliveriesListScreen from '../features/deliveries/screens/DeliveriesListScreen';
import DeliveryDetailScreen from '../features/deliveries/screens/DeliveryDetailScreen';
import DeliveryCompleteScreen from '../features/deliveries/screens/DeliveryCompleteScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import ChangePasswordScreen from '../features/profile/screens/ChangePasswordScreen';
import ExpensesScreen from '../features/expenses/screens/ExpensesScreen';
import CreateExpenseScreen from '../features/expenses/screens/CreateExpenseScreen';
import StatsScreen from '../features/stats/screens/StatsScreen';
import AlertsScreen from '../features/alerts/screens/AlertsScreen';
import MoreScreen from '../features/more/screens/MoreScreen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type IoniconsName = keyof typeof Ionicons.glyphMap;

const tabIcons: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Dashboard: { active: 'grid', inactive: 'grid-outline' },
  Deliveries: { active: 'car', inactive: 'car-outline' },
  Alerts: { active: 'notifications', inactive: 'notifications-outline' },
  More: { active: 'ellipsis-horizontal-circle', inactive: 'ellipsis-horizontal-circle-outline' },
};

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = tabIcons[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Deliveries" component={DeliveriesListScreen} />
      <Tab.Screen name="Alerts" component={AlertsScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen
        name="DeliveryDetail"
        component={DeliveryDetailScreen}
        options={{ headerShown: true, headerTitle: 'Delivery Detail', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="DeliveryComplete"
        component={DeliveryCompleteScreen}
        options={{ headerShown: true, headerTitle: 'Complete Delivery', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ headerShown: true, headerTitle: 'Profile', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{ headerShown: true, headerTitle: 'Change Password', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Expenses"
        component={ExpensesScreen}
        options={{ headerShown: true, headerTitle: 'Expenses', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="CreateExpense"
        component={CreateExpenseScreen}
        options={{ headerShown: true, headerTitle: 'New Expense', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Stats"
        component={StatsScreen}
        options={{ headerShown: true, headerTitle: 'My Stats', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="Alerts"
        component={AlertsScreen}
        options={{ headerShown: true, headerTitle: 'Alerts', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
    </View>
  );
}
