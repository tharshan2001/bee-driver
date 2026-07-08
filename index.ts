import { registerRootComponent } from 'expo';
import messaging from '@react-native-firebase/messaging';
import { showLocalNotification } from './src/core/notifications/setupNotifications';
import App from './App';

messaging().setBackgroundMessageHandler(async (remoteMessage) => {
  await showLocalNotification(remoteMessage);
});

registerRootComponent(App);
