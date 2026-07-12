import { Alert, AppState, Linking, Platform } from 'react-native';
import { useEffect, useRef, useState } from 'react';
import * as Location from 'expo-location';
import { cacheData, getCachedData } from '../../../core/storage/storage';
import { LOCATION_TASK_NAME } from '../tasks/locationTask';

const THROTTLE_MS = 10_000;
const GPS_PROBE_INTERVAL = 5_000;
const TRACKING_PREF_KEY = 'location-tracking-enabled';
const PERMISSION_CHECKED_KEY = 'location-permission-checked';
const BATTERY_OPT_DISMISSED_KEY = 'battery-opt-dismissed';

export function useLocationTracking(isActive: boolean) {
  const [isTracking, setIsTracking] = useState(false);
  const startedRef = useRef(false);
  const locationServicesOffRef = useRef(false);
  const gpsAlertShownRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      stopTracking();
      return;
    }

    initTracking().catch((e) => {
      if (__DEV__) console.log('[Tracking] initTracking error:', e);
      startedRef.current = false;
      setIsTracking(false);
    });

    return () => { stopTracking(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (!isActive || Platform.OS === 'web') return;
    const sub = AppState.addEventListener('change', async (state) => {
      if (state !== 'active') return;
      try {
        const hasMethod = Location.hasStartedLocationUpdatesAsync && typeof Location.hasStartedLocationUpdatesAsync === 'function';
        let started = false;
        if (hasMethod) {
          started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        }
        if (!started) {
          startedRef.current = false;
          try { await tryRestart(); } catch (e) { if (__DEV__) console.log('[Tracking] tryRestart error:', e); }
        }
      } catch (e) {
        if (__DEV__) console.log('[Tracking] AppState check error:', e);
        startedRef.current = false;
        try { await tryRestart(); } catch (e2) { if (__DEV__) console.log('[Tracking] tryRestart error:', e2); }
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (!isActive || Platform.OS === 'web') return;

    const checkGpsAndTracking = async () => {
      try {
        const probe = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }).catch(() => null);

        if (!probe) {
          if (!locationServicesOffRef.current) {
            locationServicesOffRef.current = true;
            if (!gpsAlertShownRef.current) {
              gpsAlertShownRef.current = true;
              Alert.alert(
                'Location Services Off',
                'Location services are turned off. Please enable them to continue sharing your location.',
                [
                  { text: 'Cancel', style: 'cancel', onPress: () => { gpsAlertShownRef.current = false; } },
                  {
                    text: 'Open Settings', onPress: () => {
                      gpsAlertShownRef.current = false;
                      Linking.openSettings();
                    },
                  },
                ],
              );
            }
            if (startedRef.current) {
              startedRef.current = false;
              setIsTracking(false);
            }
          }
          return;
        }

        locationServicesOffRef.current = false;

        const hasMethod = Location.hasStartedLocationUpdatesAsync && typeof Location.hasStartedLocationUpdatesAsync === 'function';
        if (!hasMethod) return;

        const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (!started && startedRef.current) {
          startedRef.current = false;
          await tryRestart();
        }
      } catch (e) {
        if (__DEV__) console.log('[Tracking] GPS probe error:', e);
      }
    };

    checkGpsAndTracking();
    const interval = setInterval(checkGpsAndTracking, GPS_PROBE_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  async function initTracking() {
    if (startedRef.current) return;
    startedRef.current = true;

    const pref = await getCachedData<boolean>(TRACKING_PREF_KEY);
    const permissionChecked = await getCachedData<boolean>(PERMISSION_CHECKED_KEY);

    const hasMethod = Location.hasStartedLocationUpdatesAsync && typeof Location.hasStartedLocationUpdatesAsync === 'function';
    let alreadyStarted = false;

    if (hasMethod && Platform.OS !== 'web') {
      try {
        alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      } catch (e) {
        if (__DEV__) console.log('Failed to check if location tracking already started:', e);
        alreadyStarted = false;
      }
    }

    if (alreadyStarted) {
      startedRef.current = true;
      setIsTracking(true);
      if (!pref) cacheData(TRACKING_PREF_KEY, true);
      return;
    }

    if (pref === false) {
      startedRef.current = false;
      return;
    }

    if (permissionChecked) {
      await tryRestart();
      return;
    }

    await startTracking();
  }

  async function tryRestart() {
    try {
      const fg = await Location.getForegroundPermissionsAsync();
      if (fg.status !== 'granted') {
        startedRef.current = false;
        setIsTracking(false);
        return;
      }
      const bg = await Location.getBackgroundPermissionsAsync();
      if (bg.status !== 'granted') {
        startedRef.current = false;
        setIsTracking(false);
        return;
      }
      if (Platform.OS !== 'web') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: THROTTLE_MS,
          distanceInterval: 5,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'eBee Go',
            notificationBody: 'Sharing your live location',
            notificationColor: '#FFC107',
          },
          activityType: Location.ActivityType.AutomotiveNavigation,
        });
      }
      cacheData(TRACKING_PREF_KEY, true);
      locationServicesOffRef.current = false;
      gpsAlertShownRef.current = false;
      setIsTracking(true);
      startedRef.current = true;
      showBatteryOptOnce();
    } catch (e) {
      if (__DEV__) console.log('Failed to restart tracking:', e);
      startedRef.current = false;
      setIsTracking(false);
    }
  }

  async function startTracking() {
    try {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (fg.status !== 'granted') {
        cacheData(PERMISSION_CHECKED_KEY, true);
        startedRef.current = false;
        setIsTracking(false);
        return;
      }

      const bg = await Location.requestBackgroundPermissionsAsync();
      if (bg.status !== 'granted') {
        cacheData(PERMISSION_CHECKED_KEY, true);
        startedRef.current = false;
        setIsTracking(false);
        Alert.alert(
          'Background Location Needed',
          'eBee Go needs "Always" location access to continuously share your location even when the app is closed. Please enable it in Settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }

      const hasMethod = Location.hasStartedLocationUpdatesAsync && typeof Location.hasStartedLocationUpdatesAsync === 'function';
      if (hasMethod && Platform.OS !== 'web') {
        const alreadyStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (alreadyStarted) {
          setIsTracking(true);
          cacheData(TRACKING_PREF_KEY, true);
          return;
        }
      }

      if (Platform.OS !== 'web') {
        await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: THROTTLE_MS,
          distanceInterval: 5,
          pausesUpdatesAutomatically: false,
          showsBackgroundLocationIndicator: true,
          foregroundService: {
            notificationTitle: 'eBee Go',
            notificationBody: 'Sharing your live location',
            notificationColor: '#FFC107',
          },
          activityType: Location.ActivityType.AutomotiveNavigation,
        });
      }

      cacheData(PERMISSION_CHECKED_KEY, true);
      cacheData(TRACKING_PREF_KEY, true);
      locationServicesOffRef.current = false;
      gpsAlertShownRef.current = false;
      startedRef.current = true;
      setIsTracking(true);
      showBatteryOptOnce();
    } catch (e) {
      if (__DEV__) console.log('Failed to start tracking:', e);
      startedRef.current = false;
      setIsTracking(false);
      Alert.alert(
        'Location Tracking Failed',
        'Could not start location tracking. Please check your location permissions and try again.',
        [
          { text: 'OK', style: 'default' },
        ],
      );
    }
  }

  async function stopTracking() {
    if (startedRef.current) {
      try {
        const hasMethod = Location.hasStartedLocationUpdatesAsync && typeof Location.hasStartedLocationUpdatesAsync === 'function';
        if (hasMethod) {
          const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
          if (started) {
            await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
          }
        }
        startedRef.current = false;
        setIsTracking(false);
      } catch (e) {
        if (__DEV__) console.log('Failed to stop tracking:', e);
        startedRef.current = false;
        setIsTracking(false);
      }
    }
  }

  async function showBatteryOptOnce() {
    const dismissed = await getCachedData<boolean>(BATTERY_OPT_DISMISSED_KEY);
    if (dismissed) return;
    Alert.alert(
      'Keep Location Active',
      'To keep sharing your location even when the screen is off, disable battery optimization for eBee Go in your system settings.',
      [
        { text: 'Not Now', style: 'cancel', onPress: () => cacheData(BATTERY_OPT_DISMISSED_KEY, true) },
        { text: 'Open Settings', onPress: () => { cacheData(BATTERY_OPT_DISMISSED_KEY, true); Linking.openSettings(); } },
      ],
    );
  }

  return { isTracking };
}
