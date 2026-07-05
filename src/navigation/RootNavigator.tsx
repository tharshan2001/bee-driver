import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import messaging from '@react-native-firebase/messaging';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../features/auth/screens/LoginScreen';
import SetPasswordScreen from '../features/auth/screens/SetPasswordScreen';
import SplashScreen from '../features/splash/screens/SplashScreen';
import AppNavigator from './AppNavigator';

type RootParamList = {
  Splash: undefined;
  Login: undefined;
  SetPassword: undefined;
  App: undefined;
};

const RootStack = createNativeStackNavigator<RootParamList>();

function navigateToDelivery(orderId: string, navigationRef: React.RefObject<NavigationContainerRef<RootParamList> | null>) {
  const nav = navigationRef.current;
  if (!nav) return;
  nav.navigate('App' as any, { screen: 'DeliveryDetail', params: { orderId } });
}

function extractOrderId(data: Record<string, any> | undefined): string | null {
  if (!data) return null;
  const type = data.type as string | undefined;
  const orderId = data.orderId as string | undefined;
  const deliveryTypes = ['delivery_assigned', 'delivery_status', 'delivery_retry', 'delivery_failed', 'delivery_failed_permanent'];
  if (type && deliveryTypes.includes(type) && orderId) {
    return orderId;
  }
  return null;
}

export default function RootNavigator() {
  const { isAuthenticated, mustChangePassword } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootParamList>>(null);
  const pendingScreenRef = useRef<{ name: string; orderId: string } | null>(null);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const unsubOnOpened = messaging().onNotificationOpenedApp((remoteMessage) => {
      const orderId = extractOrderId(remoteMessage.data as Record<string, any>);
      if (!orderId) return;
      if (isAuthenticatedRef.current) {
        navigateToDelivery(orderId, navigationRef);
      } else {
        pendingScreenRef.current = { name: 'DeliveryDetail', orderId };
      }
    });

    messaging().getInitialNotification().then((remoteMessage) => {
      if (remoteMessage) {
        const orderId = extractOrderId(remoteMessage.data as Record<string, any>);
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

    return () => unsubOnOpened();
  }, []);

  useEffect(() => {
    if (isAuthenticated && pendingScreenRef.current) {
      const pending = pendingScreenRef.current;
      pendingScreenRef.current = null;
      setTimeout(() => navigateToDelivery(pending.orderId, navigationRef), 600);
    }
  }, [isAuthenticated]);

  return (
    <NavigationContainer ref={navigationRef}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Splash" component={SplashScreen} />
        {isAuthenticated ? (
          mustChangePassword ? (
            <RootStack.Screen name="SetPassword" component={SetPasswordScreen} />
          ) : (
            <RootStack.Screen name="App" component={AppNavigator} />
          )
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
