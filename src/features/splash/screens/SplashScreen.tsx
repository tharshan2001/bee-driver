import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../shared/theme';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const navigated = useRef(false);
  const videoFinished = useRef(false);
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
    if (!isLoading && videoFinished.current) {
      navigateAway();
    }
  }, [isLoading, navigateAway]);

  function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (status.isLoaded && status.didJustFinish) {
      videoFinished.current = true;
      if (!isLoading) {
        navigateAway();
      }
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.stamp}>
          <Video
            source={require('../../../../assets/buzz-pkg.mov')}
            style={styles.video}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
            isLooping={false}
            onPlaybackStatusUpdate={onPlaybackStatusUpdate}
            onError={() => { videoFinished.current = true; if (!isLoading) navigateAway(); }}
          />
        </View>
        <Text style={styles.title}>eBee Go</Text>
        <Text style={styles.subtitle}>PARCEL MANIFEST SYSTEM</Text>
        <View style={styles.rule} />
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
  stamp: {
    width: 120,
    height: 120,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    backgroundColor: colors.primaryTint,
    padding: 6,
  },
  video: { width: '100%', height: '100%' },
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
  rule: {
    width: 120,
    height: 1,
    backgroundColor: colors.separator,
    marginTop: 16,
  },
});
