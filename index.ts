import { registerRootComponent } from 'expo';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { showLocalNotification } from './src/core/notifications/setupNotifications';
import App from './App';

if (Platform.OS !== 'web') {
  try {
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      try {
        await showLocalNotification(remoteMessage);
      } catch (e) {
        if (__DEV__) console.log('[FCM] Background handler error:', e);
      }
    });
  } catch (e) {
    if (__DEV__) console.log('[FCM] Failed to register background handler:', e);
  }
}

registerRootComponent(App);
