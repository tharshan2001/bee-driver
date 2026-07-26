import { useEffect, useRef, useCallback } from 'react';
import { AppState } from 'react-native';
import * as Location from 'expo-location';
import { connect, disconnect, sendLocation } from '../../../core/api/stompClient';

const STOMP_THROTTLE_MS = 5_000;
const POLL_INTERVAL_MS = 3_000;
const CONNECT_RETRY_INTERVAL_MS = 10_000;

export function useStompLocationFeed(isActive: boolean) {
  const lastSentRef = useRef(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const pollLocation = useCallback(async () => {
    if (!isConnectedRef.current) return;
    const now = Date.now();
    if (now - lastSentRef.current < STOMP_THROTTLE_MS) return;
    lastSentRef.current = now;

    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.BestForNavigation,
      });
      const { latitude, longitude, accuracy, heading, speed } = location.coords;
      if (__DEV__) console.log('[STOMP] Poll pos:', latitude.toFixed(5), longitude.toFixed(5), 'acc:', accuracy);
      const success = sendLocation({
        latitude,
        longitude,
        accuracy: accuracy ?? null,
        bearing: heading ?? null,
        speed: speed ?? null,
      });
      if (__DEV__) console.log('[STOMP] Location sent:', latitude.toFixed(5), longitude.toFixed(5), success ? 'OK' : 'FAILED');
    } catch (e) {
      if (__DEV__) console.warn('[STOMP] Poll error:', e);
    }
  }, []);

  const startForegroundWatch = useCallback(() => {
    if (pollIntervalRef.current) return;
    pollLocation();
    pollIntervalRef.current = setInterval(pollLocation, POLL_INTERVAL_MS);
    if (__DEV__) console.log('[STOMP] Poll started at', POLL_INTERVAL_MS, 'ms interval');
  }, [pollLocation]);

  const stopForegroundWatch = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
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
