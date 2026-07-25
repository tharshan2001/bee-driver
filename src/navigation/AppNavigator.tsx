import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import AlertDetailScreen from '../features/alerts/screens/AlertDetailScreen';
import LiveLocationScreen from '../features/location/screens/LiveLocationScreen';
import MoreScreen from '../features/more/screens/MoreScreen';
import type { RootStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

type IoniconsName = keyof typeof Ionicons.glyphMap;

const tabIcons: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Deliveries: { active: 'cube', inactive: 'cube-outline' },
  Alerts: { active: 'notifications', inactive: 'notifications-outline' },
  More: { active: 'ellipsis-horizontal-circle', inactive: 'ellipsis-horizontal-circle-outline' },
};

function MainTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => {
          const icons = tabIcons[route.name];
          return (
            <Ionicons
              name={focused ? icons.active : icons.inactive}
              size={22}
              color={focused ? colors.tabActive : colors.tabInactive}
            />
          );
        },
        tabBarActiveTintColor: colors.textPrimary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopWidth: 0,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 8,
          height: insets.bottom > 0 ? 56 + insets.bottom : 64,
        },
        tabBarLabelStyle: { fontFamily: 'IBMPlexMono_500Medium', fontSize: 10, textTransform: 'uppercase' },
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
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
      <Stack.Screen
        name="AlertDetail"
        component={AlertDetailScreen}
        options={{ headerShown: true, headerTitle: 'Alert Detail', headerBackTitle: 'Back' }}
      />
      <Stack.Screen
        name="LiveLocation"
        component={LiveLocationScreen}
        options={{ headerShown: true, headerTitle: 'Live Location', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
    </View>
  );
}
