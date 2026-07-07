import React, { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useAuth } from '../../../context/AuthContext';
import { colors } from '../../../shared/theme';

const SPLASH_VIDEO = Platform.OS === 'web'
  ? require('../../../../assets/buzz-calm.mp4')
  : require('../../../../assets/buzz-pkg.mov');

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const navigated = useRef(false);
  const videoFinished = useRef(false);
  const { isLoading, isAuthenticated, mustChangePassword } = useAuth();

  const player = useVideoPlayer(SPLASH_VIDEO, (player) => {
    player.loop = false;
    player.muted = true;
    player.play();
  });

  useEffect(() => {
    player.play();
  }, [player]);

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

  useEffect(() => {
    const onEnd = () => {
      videoFinished.current = true;
      if (!isLoading) navigateAway();
    };
    const onStatusChange = (e: { status: string }) => {
      if (e.status === 'error') {
        videoFinished.current = true;
        if (!isLoading) navigateAway();
      }
    };
    player.addListener('playToEnd', onEnd);
    player.addListener('statusChange', onStatusChange);
    return () => {
      player.removeListener('playToEnd', onEnd);
      player.removeListener('statusChange', onStatusChange);
    };
  }, [player, isLoading, navigateAway]);

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.stamp}>
          <VideoView
            style={styles.video}
            player={player}
            contentFit="contain"
            nativeControls={false}
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
