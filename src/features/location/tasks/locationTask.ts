import * as TaskManager from 'expo-task-manager';
import api from '../../../core/api/client';

export const LOCATION_TASK_NAME = 'LOCATION_TRACKING';

let lastSent = 0;
const THROTTLE_MS = 15_000;

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const raw = data as { locations: { coords: { latitude: number; longitude: number; accuracy: number | null; heading: number | null; speed: number | null } }[] } | undefined;
  const locations = raw?.locations;
  if (!locations?.length) return;

  const now = Date.now();
  if (now - lastSent < THROTTLE_MS) return;
  lastSent = now;

  const { latitude, longitude, accuracy, heading, speed } = locations[0].coords;

  try {
    await api.post('/driver/location', {
      latitude,
      longitude,
      accuracy: accuracy ?? null,
      bearing: heading ?? null,
      speed: speed ?? null,
    });
  } catch {
    // silent — network errors shouldn't stop tracking
  }
});
