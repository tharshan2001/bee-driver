import React, { useState } from 'react';
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const KNOB = 48;
const PAD = 4;

/**
 * For steps that can't be undone: the driver slides the knob to the end, so a stray tap or a
 * pocket does nothing. Screen readers get a normal button ("activate").
 */
export default function SwipeToConfirm({ label, color, onConfirm }: {
  label: string;
  color: string;
  onConfirm: () => Promise<unknown>;
}) {
  const [busy, setBusy] = useState(false);
  const [width, setWidth] = useState(0);
  const x = useSharedValue(0);
  const end = Math.max(0, width - KNOB - PAD * 2);

  async function confirm() {
    if (busy) return;
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      // Still here means it didn't move on (e.g. refused): ready for another try.
      setBusy(false);
      x.value = withTiming(0);
    }
  }

  const pan = Gesture.Pan()
    .enabled(!busy)
    .activeOffsetX(10) // leave vertical drags to the page's scrolling
    .failOffsetY([-14, 14])
    .onUpdate((e) => { x.value = Math.min(Math.max(e.translationX, 0), end); })
    .onEnd(() => {
      if (end > 0 && x.value >= end * 0.85) {
        x.value = withTiming(end);
        scheduleOnRN(confirm);
      } else {
        x.value = withSpring(0, { damping: 20, stiffness: 220 });
      }
    });

  const knob = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const text = useAnimatedStyle(() => ({ opacity: end > 0 ? 1 - Math.min(x.value / end, 1) * 0.8 : 1 }), [end]);

  return (
    <View
      style={[styles.track, { backgroundColor: color }]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityActions={[{ name: 'activate' }]}
      onAccessibilityAction={confirm}
    >
      <Animated.Text style={[styles.label, text]}>Slide to {label.charAt(0).toLowerCase() + label.slice(1)}</Animated.Text>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.knob, knob]}>
          {busy ? <ActivityIndicator color={colors.textPrimary} /> : <Ionicons name="chevron-forward" size={24} color={colors.textPrimary} />}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: KNOB + PAD * 2, borderRadius: 14, justifyContent: 'center' },
  label: { textAlign: 'center', paddingLeft: KNOB, fontFamily: 'IBMPlexSans_500Medium', fontSize: 15, color: colors.textOnPrimary },
  knob: {
    position: 'absolute', left: PAD, width: KNOB, height: KNOB, borderRadius: 11,
    backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center',
  },
});
