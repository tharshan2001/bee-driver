import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

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

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Dashboard: '🏠',
    Deliveries: '🚚',
    More: '⚙️',
  };
  return <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icons[label] || '📋'}</Text>;
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => <TabIcon label={route.name} focused={focused} />,
        tabBarActiveTintColor: '#1A237E',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#eee',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Deliveries" component={DeliveriesListScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
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
  );
}
