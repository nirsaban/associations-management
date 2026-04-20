import api from './api';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

export function getPushPermission(): NotificationPermission | 'unsupported' {
  if (!isPushSupported()) return 'unsupported';
  return Notification.permission;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported');
  }

  // Request permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('PERMISSION_DENIED');
  }

  // Get VAPID public key
  const vapidRes = await api.get('/activation/push/vapid-public-key');
  const vapidPublicKey = vapidRes.data.data.vapidPublicKey;

  // Wait for service worker
  const registration = await waitForServiceWorker();

  // Subscribe
  const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: applicationServerKey.buffer as ArrayBuffer,
  });

  const subJson = subscription.toJSON();

  // Send to server
  await api.post('/activation/push/subscribe', {
    endpoint: subJson.endpoint,
    keys: {
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
    },
    userAgent: navigator.userAgent,
  });

  return true;
}

async function waitForServiceWorker(): Promise<ServiceWorkerRegistration> {
  const maxAttempts = 10;
  for (let i = 0; i < maxAttempts; i++) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration?.active) {
      return registration;
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error('Service worker not available');
}

export async function isAlreadySubscribed(): Promise<boolean> {
  if (!isPushSupported()) return false;
  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) return false;
  const subscription = await registration.pushManager.getSubscription();
  return !!subscription;
}
