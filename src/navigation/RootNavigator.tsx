import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
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

export default function RootNavigator() {
  const { isAuthenticated, mustChangePassword, registerFcmNavigationHandler } = useAuth();
  const navigationRef = useRef<NavigationContainerRef<RootParamList>>(null);
  const pendingScreenRef = useRef<{ name: string; orderId: string } | null>(null);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  useEffect(() => {
    const unregister = registerFcmNavigationHandler((orderId, isAuth) => {
      if (isAuth) {
        navigateToDelivery(orderId, navigationRef);
      } else {
        pendingScreenRef.current = { name: 'DeliveryDetail', orderId };
      }
    });
    return unregister;
  }, [registerFcmNavigationHandler]);

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
