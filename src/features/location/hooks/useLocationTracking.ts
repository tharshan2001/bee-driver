import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { LOCATION_TASK_NAME } from '../tasks/locationTask';

const THROTTLE_MS = 15_000;

export function useLocationTracking(isActive: boolean) {
  const [isTracking, setIsTracking] = useState(false);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      stopTracking();
      return;
    }
    if (startedRef.current) return;
    startedRef.current = true;

    startTracking();

    return () => { stopTracking(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  async function startTracking() {
    const fg = await Location.requestForegroundPermissionsAsync();
    if (fg.status !== 'granted') {
      startedRef.current = false;
      setIsTracking(false);
      return;
    }

    await Location.requestBackgroundPermissionsAsync();

    const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (alreadyStarted) {
      setIsTracking(true);
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: THROTTLE_MS,
      distanceInterval: 10,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Bee Driver',
        notificationBody: 'Sharing your live location',
        notificationColor: '#000000',
      },
      activityType: Location.ActivityType.AutomotiveNavigation,
    });

    setIsTracking(true);
  }

  async function stopTracking() {
    if (startedRef.current) {
      const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (started) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      startedRef.current = false;
      setIsTracking(false);
    }
  }

  return { isTracking };
}
