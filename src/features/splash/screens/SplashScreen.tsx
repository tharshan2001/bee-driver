import React, { useCallback, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { useNavigation, CommonActions } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const MASCOT_SIZE = Math.min(width * 0.45, 180);

export default function SplashScreen() {
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
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.mascotWrapper}>
          <View style={styles.mascotCircle}>
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

        <Text style={styles.welcome}>Welcome</Text>
        <Text style={styles.subtitle}>Bee Driver</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  mascotWrapper: {
    marginBottom: 32,
  },
  mascotCircle: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
    borderRadius: MASCOT_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  video: {
    width: MASCOT_SIZE,
    height: MASCOT_SIZE,
  },
  welcome: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFC107',
    letterSpacing: 1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
