import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from '@/lib/api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let registered = false;

export async function registerForPushAsync(): Promise<string | null> {
  if (registered) return null;
  if (!Device.isDevice) return null;
  if (Platform.OS === 'web') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const req = await Notifications.requestPermissionsAsync();
    status = req.status;
  }
  if (status !== 'granted') return null;

  const projectId =
    (Constants.expoConfig?.extra as any)?.eas?.projectId ??
    (Constants.easConfig as any)?.projectId;

  const token = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;

  try {
    await api.post('/activation/push/subscribe', {
      endpoint: `expo:${token}`,
      keys: { p256dh: 'expo', auth: 'expo' },
      userAgent: `${Platform.OS} expo-mobile`,
    });
    registered = true;
  } catch {}

  return token;
}
