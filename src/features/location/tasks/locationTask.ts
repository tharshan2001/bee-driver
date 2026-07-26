import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../core/api/client';

export const LOCATION_TASK_NAME = 'LOCATION_TRACKING';

const THROTTLE_MS = 15_000;
const PENDING_LOC_KEY = 'pending-location-payload';

let lastSent = 0;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    if (__DEV__) console.warn('[LocationTask] Error:', error);
    return;
  }
  const raw = data as { locations: { coords: { latitude: number; longitude: number; accuracy: number | null; heading: number | null; speed: number | null } }[] } | undefined;
  const locations = raw?.locations;
  if (!locations?.length) {
    if (__DEV__) console.warn('[LocationTask] No locations in payload');
    return;
  }

  const now = Date.now();
  if (now - lastSent < THROTTLE_MS) {
    if (__DEV__) console.log('[LocationTask] Throttled, last sent', now - lastSent, 'ms ago');
    return;
  }
  lastSent = now;

  const { latitude, longitude, accuracy, heading, speed } = locations[0].coords;
  if (__DEV__) console.log('[LocationTask] Sending location:', latitude, longitude, accuracy, heading, speed);

  const payload = {
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    bearing: heading ?? null,
    speed: speed ?? null,
  };

  try {
    const response = await api.post('/driver/location', payload);
    if (__DEV__) console.log('[LocationTask] REST success:', response.status);
    try { await AsyncStorage.removeItem(PENDING_LOC_KEY); } catch {}
  } catch (e) {
    if (__DEV__) console.warn('[LocationTask] REST failed:', e);
    try {
      await AsyncStorage.setItem(PENDING_LOC_KEY, JSON.stringify(payload));
    } catch {}
  }

  try {
    const pending = await AsyncStorage.getItem(PENDING_LOC_KEY);
    if (pending) {
      const pendingPayload = JSON.parse(pending);
      if (__DEV__) console.log('[LocationTask] Retrying pending location');
      await api.post('/driver/location', pendingPayload);
      await AsyncStorage.removeItem(PENDING_LOC_KEY);
    }
  } catch {}
});
