import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { connect, disconnect, sendLocation } from '../../../core/api/stompClient';

const STOMP_THROTTLE_MS = 5_000;
const CONNECT_RETRY_INTERVAL_MS = 10_000;

export function useStompLocationFeed(isActive: boolean) {
  const lastSentRef = useRef(0);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectedRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);

  const clearRetryTimer = () => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  };

  const scheduleRetry = useCallback(() => {
    clearRetryTimer();
    retryTimerRef.current = setTimeout(() => {
      if (isConnectedRef.current) return;
      if (__DEV__) console.log('[STOMP] Retrying connection... attempt', reconnectAttemptsRef.current + 1);
      reconnectAttemptsRef.current += 1;
      connect()
        .then(() => {
          isConnectedRef.current = true;
          reconnectAttemptsRef.current = 0;
          startForegroundWatch();
        })
        .catch(() => {
          scheduleRetry();
        });
    }, CONNECT_RETRY_INTERVAL_MS);
  }, []);

  const startForegroundWatch = useCallback(async () => {
    if (watchRef.current) return;

    try {
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 5,
          timeInterval: 2_000,
        },
        (location) => {
          const now = Date.now();
          if (now - lastSentRef.current < STOMP_THROTTLE_MS) return;
          lastSentRef.current = now;

          const { latitude, longitude, accuracy, heading, speed } = location.coords;
          const success = sendLocation({
            latitude,
            longitude,
            accuracy: accuracy ?? null,
            bearing: heading ?? null,
            speed: speed ?? null,
          });
          if (__DEV__) console.log('[STOMP] Location sent:', latitude.toFixed(5), longitude.toFixed(5), success ? 'OK' : 'FAILED');
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
      isConnectedRef.current = false;
      reconnectAttemptsRef.current = 0;
      clearRetryTimer();
      disconnect();
      stopForegroundWatch();
      return;
    }

    connect()
      .then(() => {
        isConnectedRef.current = true;
        reconnectAttemptsRef.current = 0;
        if (__DEV__) console.log('[STOMP] Connected successfully');
        startForegroundWatch();
      })
      .catch((e) => {
        if (__DEV__) console.warn('[STOMP] Initial connection failed:', e?.message);
        scheduleRetry();
      });

    const sub = AppState.addEventListener('change', (next) => {
      const prev = appStateRef.current;
      appStateRef.current = next;

      if (prev.match(/active/) && next.match(/inactive|background/)) {
        if (__DEV__) console.log('[STOMP] App backgrounded, stopping watch');
        stopForegroundWatch();
      } else if (prev.match(/inactive|background/) && next === 'active') {
        if (__DEV__) console.log('[STOMP] App foregrounded, reconnecting');
        if (!isConnectedRef.current) {
          connect()
            .then(() => {
              isConnectedRef.current = true;
              startForegroundWatch();
            })
            .catch(() => {
              scheduleRetry();
            });
        } else {
          startForegroundWatch();
        }
      }
    });

    return () => {
      isConnectedRef.current = false;
      reconnectAttemptsRef.current = 0;
      clearRetryTimer();
      disconnect();
      stopForegroundWatch();
      sub.remove();
    };
  }, [isActive, startForegroundWatch, stopForegroundWatch, scheduleRetry]);
}
