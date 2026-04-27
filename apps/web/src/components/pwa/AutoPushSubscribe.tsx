'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import {
  isPushNotificationSupported,
  subscribeToPushNotifications,
  isSubscribedToPush,
} from '@/lib/push';

export function AutoPushSubscribe() {
  const { isAuthenticated } = useAuthStore();
  const attempted = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || attempted.current) return;
    if (!isPushNotificationSupported()) return;

    attempted.current = true;

    const autoSubscribe = async () => {
      try {
        const alreadySubscribed = await isSubscribedToPush();
        if (alreadySubscribed) return;

        if (Notification.permission === 'denied') return;

        if (Notification.permission === 'default') {
          const permission = await Notification.requestPermission();
          if (permission !== 'granted') return;
        }

        await subscribeToPushNotifications();
        console.log('[Push] Auto-subscribed successfully');
      } catch (err) {
        console.warn('[Push] Auto-subscribe failed:', err);
      }
    };

    const timer = setTimeout(autoSubscribe, 2000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  return null;
}
