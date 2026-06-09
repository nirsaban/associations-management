'use client';

import { useCallback, useEffect, useState } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import {
  isPushNotificationSupported,
  isSubscribedToPush,
  subscribeToPushNotifications,
} from '@/lib/push';

type GateStatus =
  | 'checking'
  | 'unsupported'
  | 'needs-permission'
  | 'denied'
  | 'subscribing'
  | 'subscribed'
  | 'error';

/**
 * Hard gate: blocks the entire dashboard until the user has granted
 * notification permission AND a push subscription is registered on the server.
 *
 * Until that's true we render a full-screen prompt and ignore `children`.
 * The user cannot reach the home page or any tab without subscribing.
 */
export function PushNotificationGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<GateStatus>('checking');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 767px)').matches);
  }, []);

  const refresh = useCallback(async () => {
    if (!isPushNotificationSupported()) {
      setStatus('unsupported');
      return;
    }
    try {
      const subscribed = await isSubscribedToPush();
      if (subscribed && Notification.permission === 'granted') {
        setStatus('subscribed');
        return;
      }
      if (Notification.permission === 'denied') {
        setStatus('denied');
        return;
      }
      setStatus('needs-permission');
    } catch {
      setStatus('needs-permission');
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleEnable = useCallback(async () => {
    setErrorMessage(null);
    setStatus('subscribing');
    try {
      await subscribeToPushNotifications();
      await refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg);
      if (typeof Notification !== 'undefined' && Notification.permission === 'denied') {
        setStatus('denied');
      } else {
        setStatus('error');
      }
    }
  }, [refresh]);

  // Bypass the gate entirely on non-mobile (desktop/tablet) viewports —
  // push notifications are a mobile/PWA-first experience.
  if (isMobile === false || status === 'subscribed') {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-surface px-4 py-8"
      dir="rtl"
    >
      <div className="w-full max-w-md rounded-3xl border border-outline/30 bg-surface-container p-6 shadow-lg text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          {status === 'denied' || status === 'unsupported' ? (
            <BellOff className="h-8 w-8 text-primary" />
          ) : status === 'checking' || status === 'subscribing' ? (
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          ) : (
            <Bell className="h-8 w-8 text-primary" />
          )}
        </div>

        <h1 className="text-headline-sm font-headline text-on-surface">הפעלת התראות נדרשת</h1>

        <p className="text-body-md text-on-surface-variant mt-3 leading-relaxed">
          {status === 'checking' && 'בודק מצב התראות...'}
          {status === 'needs-permission' &&
            'כדי להמשיך לאפליקציה יש להפעיל התראות. כך נוכל לעדכן אותך על הזמנות, חלוקות ותזכורות חשובות.'}
          {status === 'subscribing' && 'מפעיל התראות...'}
          {status === 'denied' &&
            'ההתראות חסומות בהגדרות הדפדפן. יש לפתוח את הגדרות האתר ולאפשר התראות, ואז לרענן את הדף.'}
          {status === 'unsupported' &&
            'הדפדפן הזה אינו תומך בהתראות Push. אנא הוסיפו את האפליקציה למסך הבית (PWA) או השתמשו בדפדפן עדכני.'}
          {status === 'error' &&
            'אירעה שגיאה בעת הפעלת ההתראות. אנא נסו שוב או בדקו את הרשאות הדפדפן.'}
        </p>

        {errorMessage && status === 'error' && (
          <p className="mt-3 text-label-sm text-error">{errorMessage}</p>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {(status === 'needs-permission' || status === 'error') && (
            <button
              type="button"
              onClick={handleEnable}
              className="w-full rounded-full bg-primary px-6 py-3 text-label-lg font-medium text-on-primary hover:opacity-90 transition-opacity"
            >
              הפעלת התראות
            </button>
          )}

          {status === 'subscribing' && (
            <button
              type="button"
              disabled
              className="w-full rounded-full bg-primary px-6 py-3 text-label-lg font-medium text-on-primary opacity-60"
            >
              מפעיל...
            </button>
          )}

          {(status === 'denied' || status === 'unsupported') && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full rounded-full bg-primary px-6 py-3 text-label-lg font-medium text-on-primary hover:opacity-90 transition-opacity"
            >
              רענון הדף
            </button>
          )}
        </div>

        <p className="mt-5 text-label-sm text-on-surface-variant">
          אין אפשרות לדלג על שלב זה — כניסה לאפליקציה מחייבת הפעלת התראות.
        </p>
      </div>
    </div>
  );
}
