import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { connect, disconnect, sendLocation } from '../../../core/api/stompClient';

const STOMP_THROTTLE_MS = 3_000;

export function useStompLocationFeed(isActive: boolean) {
  const lastSentRef = useRef(0);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const appStateRef = useRef(AppState.currentState);

  const startForegroundWatch = useCallback(async () => {
    if (watchRef.current) return;

    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 3,
          timeInterval: 2_000,
        },
        (location) => {
          const now = Date.now();
          if (now - lastSentRef.current < STOMP_THROTTLE_MS) return;
          lastSentRef.current = now;

          const { latitude, longitude, accuracy, heading, speed } = location.coords;
          sendLocation({
            latitude,
            longitude,
            accuracy: accuracy ?? null,
            bearing: heading ?? null,
            speed: speed ?? null,
          });
        }
      );
      watchRef.current = sub;
    } catch (e) {
      if (__DEV__) console.warn('[STOMP] Failed to start foreground watch:', e);
    }
  }, []);

  const stopForegroundWatch = useCallback(() => {
    watchRef.current?.remove();
    watchRef.current = null;
  }, []);

  useEffect(() => {
    if (!isActive) {
      disconnect();
      stopForegroundWatch();
      return;
    }

    connect().catch((e) => {
      if (__DEV__) console.warn('[STOMP] Connection failed:', e);
    });
    startForegroundWatch();

    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (prev.match(/active/) && next.match(/inactive|background/)) {
        // App went to background — stop STOMP watch (background task handles REST)
        stopForegroundWatch();
      } else if (prev.match(/inactive|background/) && next === 'active') {
        // App came to foreground — reconnect STOMP + restart watch
        connect().catch(() => {});
        startForegroundWatch();
      }
    });

    return () => {
      sub.remove();
      disconnect();
      stopForegroundWatch();
    };
  }, [isActive, startForegroundWatch, stopForegroundWatch]);
}
