import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, Animated, TouchableOpacity, PanResponder, StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
}

interface ToastContextType {
  show: (message: Omit<ToastMessage, 'id'>) => void;
  hide: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const AUTO_DISMISS_MS = 3000;

const iconMap: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle-outline',
  error: 'alert-circle-outline',
  info: 'information-circle-outline',
  warning: 'warning-outline',
};

const colorMap: Record<ToastType, { icon: string; bg: string }> = {
  success: { icon: colors.success, bg: colors.successTint },
  error: { icon: colors.danger, bg: colors.dangerTint },
  info: { icon: '#1976D2', bg: '#E3F2FD' },
  warning: { icon: colors.warning, bg: colors.warningTint },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const timers = useRef<Record<string, NodeJS.Timeout>>({});

  const hide = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const show = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...toast, id }]);
    timers.current[id] = setTimeout(() => hide(id), AUTO_DISMISS_MS);
  }, [hide]);

  return (
    <ToastContext.Provider value={{ show, hide }}>
      {children}
      <ToastContainer toasts={toasts} hide={hide} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastContainer({ toasts, hide }: { toasts: ToastMessage[]; hide: (id: string) => void }) {
  const insets = useSafeAreaInsets();
  if (toasts.length === 0) return null;

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { top: (StatusBar.currentHeight || 0) + insets.top + 8 }]}>
      {toasts.map((toast, index) => (
        <ToastItem key={toast.id} toast={toast} index={index} onHide={() => hide(toast.id)} />
      ))}
    </View>
  );
}

function ToastItem({ toast, index, onHide }: { toast: ToastMessage; index: number; onHide: () => void }) {
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const { icon, bg } = colorMap[toast.type];

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, friction: 8, tension: 40, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy < -5,
      onPanResponderMove: (_, gesture) => {
        translateY.setValue(Math.min(0, gesture.dy));
        opacity.setValue(Math.max(0, 1 + gesture.dy / 100));
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy < -40) {
          Animated.parallel([
            Animated.timing(translateY, { toValue: -120, duration: 200, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
          ]).start(onHide);
        } else {
          Animated.parallel([
            Animated.spring(translateY, { toValue: 0, friction: 8, useNativeDriver: true }),
            Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }),
          ]).start();
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY }],
          opacity,
          marginTop: index > 0 ? 8 : 0,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.iconCircle, { backgroundColor: bg }]}>
        <Ionicons name={iconMap[toast.type]} size={20} color={icon} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{toast.title}</Text>
        {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
      </View>
      <TouchableOpacity onPress={onHide} style={styles.closeBtn} hitSlop={8}>
        <Ionicons name="close" size={18} color={colors.textTertiary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999,
    elevation: 10,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.elevated,
    borderRadius: 12,
    padding: 12,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
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
    fontSize: 14,
    color: colors.textPrimary,
  },
  message: {
    fontFamily: 'IBMPlexSans_400Regular',
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
});
