import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { connect, disconnect, sendLocation } from '../../../core/api/stompClient';

const STOMP_THROTTLE_MS = 3_000;
const CONNECT_RETRY_INTERVAL_MS = 10_000;

export function useStompLocationFeed(isActive: boolean) {
  const lastSentRef = useRef(0);
  const watchRef = useRef<Location.LocationSubscription | null>(null);
  const appStateRef = useRef(AppState.currentState);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isConnectedRef = useRef(false);

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
      if (__DEV__) console.log('[STOMP] Retrying connection...');
      connect()
        .then(() => {
          isConnectedRef.current = true;
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
      isConnectedRef.current = false;
      clearRetryTimer();
      disconnect();
      stopForegroundWatch();
      return;
    }

    connect()
      .then(() => {
        isConnectedRef.current = true;
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
        stopForegroundWatch();
      } else if (prev.match(/inactive|background/) && next === 'active') {
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
      clearRetryTimer();
      disconnect();
      stopForegroundWatch();
      sub.remove();
    };
  }, [isActive, startForegroundWatch, stopForegroundWatch, scheduleRetry]);
}
