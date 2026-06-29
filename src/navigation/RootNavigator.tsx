import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import LoginScreen from '../features/auth/screens/LoginScreen';
import LoadingScreen from '../shared/components/LoadingScreen';
import AppNavigator from './AppNavigator';

type RootParamList = {
  Login: undefined;
  App: undefined;
};

const RootStack = createNativeStackNavigator<RootParamList>();

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();

  if (isLoading) return <LoadingScreen />;

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <RootStack.Screen name="App" component={AppNavigator} />
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
