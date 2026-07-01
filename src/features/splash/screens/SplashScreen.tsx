import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { colors } from '../../../shared/theme';

export default function SplashScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const navigated = useRef(false);

  const navigateAway = useCallback(() => {
    if (navigated.current) return;
    navigated.current = true;
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'App' }],
      })
    );
  }, [navigation]);

  function onPlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (status.isLoaded && status.didJustFinish) {
      navigateAway();
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={styles.content}>
        <View style={styles.stamp}>
          <View style={styles.stampRing}>
            <View style={styles.stampInner}>
              <Video
                source={require('../../../../assets/buzz-pkg.webm')}
                style={styles.video}
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
                isLooping={false}
                onPlaybackStatusUpdate={onPlaybackStatusUpdate}
                onError={navigateAway}
              />
            </View>
          </View>
        </View>
        <Text style={styles.title}>BEE DRIVER</Text>
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
    width: 96,
    height: 96,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  stampRing: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stampInner: {
    width: 72,
    height: 72,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.primaryTint,
  },
  video: { width: 72, height: 72 },
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
