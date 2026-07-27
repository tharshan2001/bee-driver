import { useEffect, useRef, useState } from 'react';
import { cacheData, getCachedData, getTokens } from '../../../core/storage/storage';
import { startNativeLocation, stopNativeLocation, setNativeDriverId } from '../services/NativeLocationModule';

const TRACKING_PREF_KEY = 'location-tracking-enabled';

export function useLocationTracking(isActive: boolean, driverId?: string) {
  const [isTracking, setIsTracking] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !driverId) {
      stopNativeTracking();
      return;
    }

    initTracking(driverId).catch((e) => {
      if (__DEV__) console.log('[Tracking] initTracking error:', e);
      startedRef.current = false;
      setIsTracking(false);
    });
  }, [isActive, driverId]);

  async function initTracking(driverId: string) {
    if (startedRef.current) return;
    startedRef.current = true;

    const pref = await getCachedData<boolean>(TRACKING_PREF_KEY);
    if (pref === false) {
      startedRef.current = false;
      return;
    }

    await setNativeDriverId(driverId);
    await doStart();
  }

  async function doStart() {
    try {
      const tokens = await getTokens();
      const authToken = tokens?.accessToken ?? '';

      if (!authToken) {
        if (__DEV__) console.warn('[Tracking] No auth token');
        startedRef.current = false;
        setIsTracking(false);
        return;
      }

      await startNativeLocation(authToken);
      cacheData(TRACKING_PREF_KEY, true);
      setIsTracking(true);
    } catch (e) {
      if (__DEV__) console.log('[Tracking] doStart error:', e);
      startedRef.current = false;
      setIsTracking(false);
    }
  }

  async function stopNativeTracking() {
    if (!startedRef.current) return;
    try {
      await stopNativeLocation();
    } catch (e) {
      if (__DEV__) console.log('[Tracking] stop error:', e);
    }
    startedRef.current = false;
    setIsTracking(false);
  }

  return { isTracking };
}
