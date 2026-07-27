import { useEffect, useRef } from 'react';
import { Alert, Linking, Platform } from 'react-native';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { cacheData, getCachedData } from '../../../core/storage/storage';

const PERMISSION_CHECKED_KEY = 'permissions-checked-v2';

export function useAppPermissions() {
  const requestedRef = useRef(false);

  useEffect(() => {
    if (requestedRef.current) return;
    requestedRef.current = true;
    requestAllPermissions();
  }, []);
}

async function requestAllPermissions() {
  const alreadyChecked = await getCachedData<boolean>(PERMISSION_CHECKED_KEY);
  if (alreadyChecked) return;

  if (Platform.OS !== 'android') return;

  // 1. Foreground location
  const fg = await Location.getForegroundPermissionsAsync();
  if (fg.status !== 'granted') {
    const result = await Location.requestForegroundPermissionsAsync();
    if (result.status !== 'granted') {
      Alert.alert(
        'Location Required',
        'eBee Go needs location access to track your position.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }],
      );
      return;
    }
  }

  // 2. Background location (Android 10+)
  const bg = await Location.getBackgroundPermissionsAsync();
  if (bg.status !== 'granted') {
    const result = await Location.requestBackgroundPermissionsAsync();
    if (result.status !== 'granted') {
      Alert.alert(
        'Background Location Required',
        'eBee Go needs "Allow all the time" location to keep tracking when the screen is off.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }],
      );
      return;
    }
  }

  // 3. Notification (Android 13+)
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Notifications Required',
        'eBee Go needs notification permission to alert you of new deliveries.',
        [{ text: 'Open Settings', onPress: () => Linking.openSettings() }],
      );
    }
  }

  cacheData(PERMISSION_CHECKED_KEY, true);
}
