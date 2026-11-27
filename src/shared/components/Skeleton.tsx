import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { colors } from '../theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export default function Skeleton({ width = '100%', height = 16, borderRadius = 4, style }: SkeletonProps) {
  const shimmer = useRef(new Animated.Value(0)).current;

  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (reduceMotion) { shimmer.setValue(0.5); return; } // a still placeholder
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [shimmer, reduceMotion]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[{ width: width as any, height, borderRadius, backgroundColor: colors.separator, opacity }, style]}
    />
  );
}
