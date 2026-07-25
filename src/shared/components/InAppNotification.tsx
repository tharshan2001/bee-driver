import React, { useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, PanResponder, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

export interface InAppNotificationData {
  id: string;
  title: string;
  body?: string;
  type?: string;
  onPress?: () => void;
  onDismiss?: () => void;
}

const AUTO_DISMISS_MS = 5000;

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  WARNING: 'warning-outline',
  DELIVERY: 'cube-outline',
  SYSTEM: 'settings-outline',
  INFO: 'information-circle-outline',
};

const iconColorMap: Record<string, string> = {
  WARNING: colors.warning,
  DELIVERY: '#1976D2',
  SYSTEM: colors.textSecondary,
  INFO: colors.success,
};

export default function InAppNotification({
  data,
}: {
  data: InAppNotificationData | null;
}) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-200)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
  };

  const dismiss = () => {
    clearTimer();
    Animated.parallel([
      Animated.timing(translateY, { toValue: -200, duration: 250, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => data?.onDismiss?.());
  };

  useEffect(() => {
    if (!data) return;
    translateY.setValue(-200);
    opacity.setValue(0);

    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();

    clearTimer();
    dismissTimer.current = setTimeout(dismiss, AUTO_DISMISS_MS);

    return clearTimer;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.id]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy < -5,
      onPanResponderMove: (_, gesture) => {
        translateY.setValue(Math.min(0, gesture.dy));
        opacity.setValue(Math.max(0, 1 + gesture.dy / 120));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -40) {
          dismiss();
        } else {
          Animated.parallel([
            Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      },
    }),
  ).current;

  if (!data) return null;

  const type = (data.type || 'INFO').toUpperCase();
  const icon = iconMap[type] || 'information-circle-outline';
  const icColor = iconColorMap[type] || colors.textTertiary;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: (StatusBar.currentHeight || 0) + insets.top + 8,
          transform: [{ translateY }],
          opacity,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={() => {
          dismiss();
          data.onPress?.();
        }}
        style={styles.card}
      >
        <View style={styles.accentStrip} />
        <View style={[styles.iconCircle, { backgroundColor: icColor + '15' }]}>
          <Ionicons name={icon} size={20} color={icColor} />
        </View>
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>{data.title}</Text>
          {data.body ? (
            <Text style={styles.body} numberOfLines={2}>{data.body}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={dismiss} style={styles.closeBtn} hitSlop={8}>
          <Ionicons name="close" size={18} color={colors.textTertiary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
    elevation: 10,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: 12,
    padding: 14,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  accentStrip: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'IBMPlexSans_500Medium',
    fontSize: 15,
    color: colors.textPrimary,
  },
  body: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
