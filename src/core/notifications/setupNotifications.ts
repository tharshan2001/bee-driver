import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'delivery-alerts';
const CHANNEL_NAME = 'Delivery Alerts';

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: CHANNEL_NAME,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 100, 50, 100],
      lightColor: '#FFC107',
    });
  }
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function showLocalNotification(remoteMessage: any) {
  const data = remoteMessage?.data as Record<string, any> | undefined;
  const title = data?.title || 'eBee Go';
  const body = data?.message || data?.body || '';
  const orderId = data?.orderId;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data: { orderId },
      sound: true,
      ...(Platform.OS === 'android' ? { channelId: CHANNEL_ID } : {}),
    },
    trigger: null,
  });
}
