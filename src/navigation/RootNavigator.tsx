import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Notifications from 'expo-notifications';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../features/auth/screens/LoginScreen';
import LoadingScreen from '../shared/components/LoadingScreen';
import SplashScreen from '../features/splash/screens/SplashScreen';
import AppNavigator from './AppNavigator';

type RootParamList = {
  Splash: undefined;
  Login: undefined;
  App: undefined;
};

const RootStack = createNativeStackNavigator<RootParamList>();

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function navigateToDelivery(orderId: string, navigationRef: React.RefObject<NavigationContainerRef<RootParamList> | null>) {
  const nav = navigationRef.current;
  if (!nav) return;
  nav.navigate('App' as any);
  setTimeout(() => {
    (nav as any)?.navigate?.('DeliveryDetail', { orderId });
  }, 300);
}

function extractOrderId(notification: Notifications.Notification): string | null {
  const data = notification.request.content.data;
  if (!data || typeof data !== 'object') return null;
  const type = (data as any).type as string | undefined;
  const orderId = (data as any).orderId as string | undefined;
  const deliveryTypes = ['delivery_assigned', 'delivery_status', 'delivery_retry', 'delivery_failed', 'delivery_failed_permanent'];
  if (type && deliveryTypes.includes(type) && orderId) {
    return orderId;
  }
  return null;
}

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootParamList>>(null);
  const pendingScreenRef = useRef<{ name: string; orderId: string } | null>(null);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const tapSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const orderId = extractOrderId(response.notification);
      if (!orderId) return;
      if (isAuthenticatedRef.current) {
        navigateToDelivery(orderId, navigationRef);
      } else {
        pendingScreenRef.current = { name: 'DeliveryDetail', orderId };
      }
    });

    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const orderId = extractOrderId(response.notification);
        if (orderId) {
          setTimeout(() => {
            if (isAuthenticatedRef.current) {
              navigateToDelivery(orderId, navigationRef);
            } else {
              pendingScreenRef.current = { name: 'DeliveryDetail', orderId };
            }
          }, 500);
        }
      }
    });

    return () => tapSub.remove();
  }, []);

  useEffect(() => {
    if (isAuthenticated && pendingScreenRef.current) {
      const pending = pendingScreenRef.current;
      pendingScreenRef.current = null;
      setTimeout(() => navigateToDelivery(pending.orderId, navigationRef), 600);
    }
  }, [isAuthenticated]);

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Group>
            <RootStack.Screen name="Splash" component={SplashScreen} />
            <RootStack.Screen name="App" component={AppNavigator} />
          </RootStack.Group>
        ) : (
          <RootStack.Screen
            name="Login"
            component={LoginScreen}
            options={{ animationTypeForReplace: 'pop' }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
