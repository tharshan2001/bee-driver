import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../../../core/api/client';

export const LOCATION_TASK_NAME = 'LOCATION_TRACKING';

let lastSent = 0;
const THROTTLE_MS = 15_000;
const PENDING_LOC_KEY = 'pending-location-payload';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const raw = data as { locations: { coords: { latitude: number; longitude: number; accuracy: number | null; heading: number | null; speed: number | null } }[] } | undefined;
  const locations = raw?.locations;
  if (!locations?.length) return;

  const now = Date.now();
  if (now - lastSent < THROTTLE_MS) return;
  lastSent = now;

  const { latitude, longitude, accuracy, heading, speed } = locations[0].coords;
  const payload = {
    latitude,
    longitude,
    accuracy: accuracy ?? null,
    bearing: heading ?? null,
    speed: speed ?? null,
  };

  try {
    await api.post('/driver/location', payload);
    // Send succeeded — clear any cached pending payload
    try { await AsyncStorage.removeItem(PENDING_LOC_KEY); } catch {}
  } catch {
    // Network failed — cache payload for retry on next successful send
    try {
      await AsyncStorage.setItem(PENDING_LOC_KEY, JSON.stringify(payload));
    } catch {}
  }

  // Try sending any previously failed payload
  try {
    const pending = await AsyncStorage.getItem(PENDING_LOC_KEY);
    if (pending) {
      const pendingPayload = JSON.parse(pending);
      await api.post('/driver/location', pendingPayload);
      await AsyncStorage.removeItem(PENDING_LOC_KEY);
    }
  } catch {}
});
