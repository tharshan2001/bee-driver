import React, { useEffect } from 'react';
import { Image, View } from 'react-native';
import Animated, {
  cancelAnimation, Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming,
} from 'react-native-reanimated';

// The waving clip as a grid of cut-out frames, so the mascot can sit on any background.
const FRAME_W = 236;
const FRAME_H = 351;
const COLS = 5;
const ROWS = 3;
const FRAMES = 15;
const LOOP_MS = 1250;

interface Props {
  height: number;
  /** The mascot looks away, e.g. while a password is being typed. */
  eyesClosed?: boolean;
}

export default function Bee({ height, eyesClosed }: Props) {
  const reduceMotion = useReducedMotion();
  const scale = height / FRAME_H;
  const width = FRAME_W * scale;
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion || eyesClosed) { progress.value = 0; return; }
    progress.value = withRepeat(withTiming(FRAMES, { duration: LOOP_MS, easing: Easing.linear }), -1);
    return () => cancelAnimation(progress);
  }, [reduceMotion, eyesClosed, progress]);

  const frame = useAnimatedStyle(() => {
    const n = Math.floor(progress.value) % FRAMES;
    return { transform: [{ translateX: -(n % COLS) * width }, { translateY: -Math.floor(n / COLS) * height }] };
  }, [width, height]);

  return (
    <View style={{ width, height, overflow: 'hidden' }} accessible accessibilityRole="image"
      accessibilityLabel={eyesClosed ? 'eBee mascot with eyes closed' : 'eBee mascot waving'}>
      {eyesClosed ? (
        <Image source={require('../../../assets/bee-eyes-closed.png')} style={{ width, height }} fadeDuration={0} />
      ) : (
        <Animated.View style={[{ width: width * COLS, height: height * ROWS }, frame]}>
          <Image source={require('../../../assets/bee-wave-frames.png')}
            style={{ width: width * COLS, height: height * ROWS }} fadeDuration={0} />
        </Animated.View>
      )}
    </View>
  );
}
