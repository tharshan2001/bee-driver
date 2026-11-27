import React, { useEffect, useRef } from 'react';
import { Modal, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { Easing, FadeIn, ZoomIn } from 'react-native-reanimated';
import { colors } from '../theme';

const SHOW_MS = 1500;

interface Props {
  visible: boolean;
  title: string;
  /** Called once: after a moment, on a tap, or on the back button. */
  onDone: () => void;
}

/** Full-screen confirmation for something worth a pause, such as a finished delivery. */
export default function SuccessOverlay({ visible, title, onDone }: Props) {
  const called = useRef(false);
  const latest = useRef(onDone);
  latest.current = onDone;

  const finish = () => {
    if (called.current) return;
    called.current = true;
    latest.current();
  };

  useEffect(() => {
    if (!visible) return;
    called.current = false;
    const timer = setTimeout(finish, SHOW_MS);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <Modal visible={visible} transparent statusBarTranslucent animationType="fade" onRequestClose={finish}>
      <Pressable style={styles.screen} onPress={finish} accessibilityRole="alert" accessibilityLabel={title}>
        <Animated.View style={styles.circle} entering={ZoomIn.duration(320).easing(Easing.out(Easing.cubic))}>
          <Ionicons name="checkmark" size={56} color="#FFFFFF" />
        </Animated.View>
        <Animated.Text style={styles.title} entering={FadeIn.delay(180).duration(220)}>{title}</Animated.Text>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, backgroundColor: colors.background },
  circle: { width: 112, height: 112, borderRadius: 56, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.success },
  title: { fontFamily: 'SpaceGrotesk_700Bold', fontSize: 22, color: colors.textPrimary },
});
