import React from 'react';
import { Pressable, PressableProps, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = Omit<PressableProps, 'style' | 'children'> & {
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

const ease = Easing.out(Easing.quad);

/**
 * The app's one pressable: it dims and shrinks slightly while held. No vibration.
 * With "remove animations" on, it only dims.
 */
export default function Touchable({ style, onPressIn, onPressOut, ...rest }: Props) {
  const pressed = useSharedValue(0);
  const reduceMotion = useReducedMotion();
  // Keep a style's own opacity (e.g. a disabled button) and dim from there.
  const baseOpacity = (StyleSheet.flatten(style)?.opacity as number | undefined) ?? 1;

  const feedback = useAnimatedStyle(() => ({
    opacity: baseOpacity * (1 - pressed.value * 0.15),
    transform: [{ scale: reduceMotion ? 1 : 1 - pressed.value * 0.03 }],
  }), [baseOpacity, reduceMotion]);

  return (
    <AnimatedPressable
      {...rest}
      style={[style, feedback]}
      onPressIn={(e) => { pressed.value = withTiming(1, { duration: 90, easing: ease }); onPressIn?.(e); }}
      onPressOut={(e) => { pressed.value = withTiming(0, { duration: 180, easing: ease }); onPressOut?.(e); }}
    />
  );
}
