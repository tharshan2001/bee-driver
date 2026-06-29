import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

export type RootStackParamList = {
  MainTabs: undefined;
  DeliveryDetail: { orderId: string };
  DeliveryComplete: { orderId: string };
  Profile: undefined;
  ChangePassword: undefined;
  Expenses: undefined;
  CreateExpense: undefined;
  Stats: undefined;
  Alerts: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Deliveries: undefined;
  More: undefined;
};

export type RootStackNav = NativeStackNavigationProp<RootStackParamList>;
export type TabNav = BottomTabNavigationProp<TabParamList>;
