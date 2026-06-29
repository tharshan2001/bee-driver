import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

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

    const config = Constants.expoConfig as Record<string, any> | null;
    const projectId = config?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    if (tokenData.data) {
      await api.post('/driver/device-token', { fcmToken: tokenData.data });
      console.log('[FCM] Token registered:', tokenData.data.substring(0, 30) + '...');
    }
  } catch (e) {
    console.warn('[FCM] Registration failed:', e);
  }
}
