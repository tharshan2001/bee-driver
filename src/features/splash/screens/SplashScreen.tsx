import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import Bee from '../../../shared/components/Bee';
import { colors } from '../../../shared/theme';

const SPLASH_MIN_MS = 1_600; // long enough to see the mascot wave
const SPLASH_TIMEOUT_MS = 4_000;
const BAR_WIDTH = 120;

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const navigated = useRef(false);
  const [shown, setShown] = useState(false);
  const { isLoading, isAuthenticated, mustChangePassword } = useAuth();
  const progress = useSharedValue(0);

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
    progress.value = withTiming(1, { duration: SPLASH_MIN_MS, easing: Easing.out(Easing.quad) });
    const timer = setTimeout(() => setShown(true), SPLASH_MIN_MS);
    return () => clearTimeout(timer);
  }, [progress]);

  useEffect(() => {
    if (shown && !isLoading) {
      navigateAway();
    }
  }, [shown, isLoading, navigateAway]);

  useEffect(() => {
    const timer = setTimeout(() => {
      navigateAway();
    }, SPLASH_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [navigateAway]);

  const bar = useAnimatedStyle(() => ({ width: BAR_WIDTH * progress.value }));

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Bee height={260} />
      <Animated.View entering={FadeInDown.delay(150).duration(350)} style={styles.words}>
        <Text style={styles.title}>eBee Go</Text>
        <Text style={styles.subtitle}>Delivering with you</Text>
      </Animated.View>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, bar]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.primaryTint, alignItems: 'center', justifyContent: 'center' },
  words: { alignItems: 'center', marginTop: 16 },
  title: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 34, color: colors.textPrimary },
  subtitle: { fontFamily: 'IBMPlexSans_400Regular', fontSize: 15, color: colors.textSecondary },
  track: { width: BAR_WIDTH, height: 4, borderRadius: 2, backgroundColor: colors.background, marginTop: 32, overflow: 'hidden' },
  fill: { height: 4, backgroundColor: colors.primary },
});
