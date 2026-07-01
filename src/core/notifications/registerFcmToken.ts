import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

import api from '../api/client';

export async function registerFcmToken(): Promise<void> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[FCM] Notification permission not granted');
      return;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
      });
    }

    const tokenData = await Notifications.getDevicePushTokenAsync();
    if (tokenData.data) {
      await api.post('/driver/device-token', { fcmToken: tokenData.data });
      console.log('[FCM] Native token registered (type:', tokenData.type, '):', tokenData.data.substring(0, 30) + '...');
    }
  } catch (e) {
    console.warn('[FCM] Registration failed:', e);
    if (e instanceof Error) {
      console.error('[FCM] Error details:', e.message, e.stack);
    }
  }
}
