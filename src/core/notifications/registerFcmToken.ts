import { Platform, PermissionsAndroid } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import api from '../api/client';

export async function registerFcmToken(): Promise<void> {
  try {
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        'POST_NOTIFICATIONS' as any,
      );
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        if (__DEV__) console.log('[FCM] Notification permission not granted');
        return;
      }
    }

    const fcmToken = await messaging().getToken();
    if (fcmToken) {
      await api.post('/driver/device-token', { fcmToken });
      if (__DEV__) console.log('[FCM] Token registered:', fcmToken.substring(0, 30) + '...');
    }
  } catch (e) {
    if (__DEV__) console.warn('[FCM] Registration failed:', e);
  }
}
