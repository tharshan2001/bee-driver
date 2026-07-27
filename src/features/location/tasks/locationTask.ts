import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../core/api/client';

export const LOCATION_TASK_NAME = 'LOCATION_TRACKING';

const THROTTLE_MS = 3_000;
const PENDING_LOC_KEY = 'pending-locations';
const MAX_PENDING = 10;
const MAX_RETRIES = 5;

interface PendingLocation {
  payload: {
    latitude: number;
    longitude: number;
    accuracy: number | null;
    bearing: number | null;
    speed: number | null;
  };
  retries: number;
  timestamp: number;
}

let lastSent = 0;

async function savePendingLocations(locations: PendingLocation[]): Promise<void> {
  try {
    await AsyncStorage.setItem(PENDING_LOC_KEY, JSON.stringify(locations));
  } catch {}
}

async function loadPendingLocations(): Promise<PendingLocation[]> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_LOC_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function sendLocationRest(payload: {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  bearing: number | null;
  speed: number | null;
}): Promise<boolean> {
  try {
    await api.post('/driver/location', payload);
    return true;
  } catch {
    return false;
  }
}

async function retryPendingLocations(): Promise<void> {
  const pending = await loadPendingLocations();
  if (!pending.length) return;

  const updated: PendingLocation[] = [];
  for (const item of pending) {
    const delay = Math.min(1000 * Math.pow(1.5, item.retries), 60_000);
    if (Date.now() - item.timestamp < delay) {
      updated.push(item);
      continue;
    }
    const ok = await sendLocationRest(item.payload);
    if (!ok) {
      if (item.retries < MAX_RETRIES) {
        updated.push({ ...item, retries: item.retries + 1, timestamp: Date.now() });
      }
    }
  }
  await savePendingLocations(updated);
}

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    if (__DEV__) console.warn('[LocationTask] Error:', error);
    await retryPendingLocations();
    return;
  }

  const raw = data as { locations: { coords: { latitude: number; longitude: number; accuracy: number | null; heading: number | null; speed: number | null } }[] } | undefined;
  const locations = raw?.locations;
  if (!locations?.length) {
    if (__DEV__) console.warn('[LocationTask] No locations in payload');
    await retryPendingLocations();
    return;
  }

  const now = Date.now();
  if (now - lastSent < THROTTLE_MS) {
    if (__DEV__) console.log('[LocationTask] Throttled, last sent', now - lastSent, 'ms ago');
    await retryPendingLocations();
    return;
  }
  lastSent = now;

  const { latitude, longitude, accuracy, heading, speed } = locations[0].coords;
  if (__DEV__) console.log('[LocationTask] Sending location:', latitude.toFixed(5), longitude.toFixed(5), 'acc:', accuracy);

  const payload = {
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    bearing: heading ?? null,
    speed: speed ?? null,
  };

  const ok = await sendLocationRest(payload);
  if (!ok) {
    if (__DEV__) console.warn('[LocationTask] REST failed, storing pending');
    const pending = await loadPendingLocations();
    pending.push({ payload, retries: 0, timestamp: Date.now() });
    if (pending.length > MAX_PENDING) pending.shift();
    await savePendingLocations(pending);
  } else {
    if (__DEV__) console.log('[LocationTask] REST success');
  }

  await retryPendingLocations();
});
