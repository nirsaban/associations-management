/**
 * Push Notification Utilities for ניהול עמותות
 * Handles PWA service worker registration and push subscription management
 */

import { api } from './api';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

/**
 * Check if push notifications are supported in the browser
 */
export function isPushNotificationSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/**
 * Check the current notification permission status
 */
export function getNotificationPermissionStatus(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Request notification permission from the user
 * @returns The permission status after the request
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported in this browser');
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission === 'denied') {
    throw new Error('Notification permission was previously denied');
  }

  const permission = await Notification.requestPermission();
  return permission;
}

/**
 * Register the service worker
 * @returns The service worker registration
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service Worker is not supported in this browser');
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Wait for the service worker to be ready
    await navigator.serviceWorker.ready;

    return registration;
  } catch (error) {
    console.error('Service Worker registration failed:', error);
    throw error;
  }
}

/**
 * Get the current push subscription or create a new one
 * @param vapidPublicKey - The VAPID public key from the server
 * @returns The push subscription object
 */
export async function getPushSubscription(vapidPublicKey: string): Promise<PushSubscription> {
  if (!isPushNotificationSupported()) {
    throw new Error('Push notifications are not supported');
  }

  const registration = await navigator.serviceWorker.ready;

  // Check for existing subscription
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    // Create new subscription
    const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: applicationServerKey as BufferSource,
    });
  }

  return subscription;
}

/**
 * Subscribe to push notifications
 * Requests permission, registers service worker, and sends subscription to backend
 * @param vapidPublicKey - The VAPID public key from the server (optional, will fetch if not provided)
 * @returns The subscription data
 */
export async function subscribeToPushNotifications(
  vapidPublicKey?: string,
): Promise<PushSubscriptionData> {
  // Request notification permission
  const permission = await requestNotificationPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted');
  }

  // Register service worker
  await registerServiceWorker();

  // Get VAPID public key if not provided
  if (!vapidPublicKey) {
    const response = await api.get('/activation/push/vapid-public-key');
    vapidPublicKey = response.data?.data?.vapidPublicKey || response.data?.publicKey;
  }

  if (!vapidPublicKey) {
    throw new Error('VAPID public key not available');
  }

  // Get push subscription
  const subscription = await getPushSubscription(vapidPublicKey);

  // Convert subscription to format expected by backend
  const subscriptionData = subscriptionToData(subscription);

  // Send subscription to backend (flat format matching PushSubscribeDto)
  await api.post('/activation/push/subscribe', {
    endpoint: subscriptionData.endpoint,
    keys: subscriptionData.keys,
    userAgent: navigator.userAgent,
  });

  return subscriptionData;
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<void> {
  if (!isPushNotificationSupported()) {
    return;
  }

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();

  if (subscription) {
    const subscriptionData = subscriptionToData(subscription);

    // Unsubscribe on the client
    await subscription.unsubscribe();

    // Notify backend
    try {
      await api.delete('/activation/push/unsubscribe', {
        params: { endpoint: subscriptionData.endpoint },
      });
    } catch (error) {
      console.error('Failed to notify backend of unsubscription:', error);
    }
  }
}

/**
 * Check if the user is currently subscribed to push notifications
 */
export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushNotificationSupported()) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking push subscription status:', error);
    return false;
  }
}

/**
 * Get the current push subscription data
 */
export async function getCurrentPushSubscription(): Promise<PushSubscriptionData | null> {
  if (!isPushNotificationSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return null;
    }

    return subscriptionToData(subscription);
  } catch (error) {
    console.error('Error getting push subscription:', error);
    return null;
  }
}

/**
 * Convert PushSubscription to plain data object
 */
function subscriptionToData(subscription: PushSubscription): PushSubscriptionData {
  const key = subscription.getKey('p256dh');
  const auth = subscription.getKey('auth');

  if (!key || !auth) {
    throw new Error('Failed to get subscription keys');
  }

  return {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: arrayBufferToBase64(key),
      auth: arrayBufferToBase64(auth),
    },
  };
}

/**
 * Convert ArrayBuffer to Base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert URL-safe Base64 to Uint8Array
 * Used for VAPID public key conversion
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

/**
 * Show a test notification (for development/testing)
 */
export async function showTestNotification(): Promise<void> {
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    throw new Error('Notification permission not granted');
  }

  const registration = await navigator.serviceWorker.ready;

  await registration.showNotification('ניהול עמותות', {
    body: 'זוהי הודעת בדיקה',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    dir: 'rtl',
    lang: 'he',
    tag: 'test-notification',
    requireInteraction: false,
  });
}
