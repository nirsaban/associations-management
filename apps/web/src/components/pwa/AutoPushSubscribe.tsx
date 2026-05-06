'use client';

import { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import {
  isPushNotificationSupported,
  subscribeToPushNotifications,
  isSubscribedToPush,
} from '@/lib/push';
import api from '@/lib/api';

const DISMISS_KEY = 'push-banner-dismissed';

export function AutoPushSubscribe() {
  const { isAuthenticated } = useAuthStore();
  const [showBanner, setShowBanner] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isPushNotificationSupported()) return;

    const check = async () => {
      try {
        // Already subscribed — nothing to do
        const alreadySubscribed = await isSubscribedToPush();
        if (alreadySubscribed) return;

        // Permission was denied — can't ask again
        if (Notification.permission === 'denied') return;

        // User dismissed the banner before — don't show again this session
        if (sessionStorage.getItem(DISMISS_KEY)) return;

        // Check VAPID is configured
        try {
          const res = await api.get('/activation/push/vapid-public-key');
          if (!res.data?.data?.vapidPublicKey) return;
        } catch {
          return;
        }

        // If already granted, subscribe silently
        if (Notification.permission === 'granted') {
          await subscribeToPushNotifications();
          return;
        }

        // Show banner to ask user
        setShowBanner(true);
      } catch (err) {
        console.warn('[Push] Check failed:', err);
      }
    };

    const timer = setTimeout(check, 1500);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleEnable = async () => {
    setSubscribing(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribeToPushNotifications();
        setShowBanner(false);
      } else {
        setShowBanner(false);
      }
    } catch (err) {
      console.warn('[Push] Subscribe failed:', err);
    }
    setSubscribing(false);
  };

  const handleDismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setShowBanner(false);
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-start gap-3 rounded-2xl bg-surface-container p-4 shadow-lg border border-outline-variant">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Bell className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-title-sm text-on-surface font-medium">קבלו התראות בזמן אמת</p>
          <p className="text-body-sm text-on-surface-variant mt-0.5">
            הפעילו התראות כדי לקבל עדכונים על הזמנות, חלוקות ותזכורות
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleEnable}
              disabled={subscribing}
              className="rounded-full bg-primary px-4 py-2 text-label-md text-on-primary font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {subscribing ? 'מפעיל...' : 'הפעלת התראות'}
            </button>
            <button
              onClick={handleDismiss}
              className="rounded-full px-4 py-2 text-label-md text-on-surface-variant hover:bg-surface-variant transition-colors"
            >
              לא עכשיו
            </button>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="shrink-0 p-1 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
          aria-label="סגירה"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
