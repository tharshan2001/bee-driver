import React from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

const STEP_MS = 40;
// Only what fits on the first screen animates; rows reached by scrolling are just there.
const LIMIT = 8;

interface Props {
  children: React.ReactNode;
  /** Position in the list, for a short stagger. */
  index?: number;
  style?: StyleProp<ViewStyle>;
}

/** Fades content up into place once, when it mounts. Follows the system's reduce-motion setting. */
export default function Appear({ children, index = 0, style }: Props) {
  const entering = index < LIMIT
    ? FadeInDown.delay(index * STEP_MS).duration(260).easing(Easing.out(Easing.quad))
        .withInitialValues({ transform: [{ translateY: 12 }] })
    : undefined;
  return <Animated.View entering={entering} style={style}>{children}</Animated.View>;
}
