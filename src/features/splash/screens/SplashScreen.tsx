import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../shared/theme';

const SPLASH_TIMEOUT_MS = 4_000;

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const navigated = useRef(false);
  const { isLoading, isAuthenticated, mustChangePassword } = useAuth();

  const navigateAway = useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    if (isAuthenticated) {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: mustChangePassword ? [{ name: 'SetPassword' }] : [{ name: 'App' }],
        })
      );
    } else {
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Login' }],
        })
      );
    }
  }, [navigation, isAuthenticated, mustChangePassword]);

  useEffect(() => {
    if (!isLoading) {
      navigateAway();
    }
  }, [isLoading, navigateAway]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigateAway();
    }, SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [navigateAway]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>eBee</Text>
        </View>
        <Text style={styles.title}>eBee Go</Text>
        <Text style={styles.subtitle}>PARCEL MANIFEST SYSTEM</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { alignItems: 'center' },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.primaryTint,
  },
  logoText: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 32,
    color: colors.primary,
  },
  title: {
    fontFamily: 'SpaceGrotesk_700Bold',
    fontSize: 22,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'IBMPlexMono_500Medium',
    fontSize: 10,
    color: colors.textTertiary,
    letterSpacing: 1,
    marginTop: 6,
  },
});
