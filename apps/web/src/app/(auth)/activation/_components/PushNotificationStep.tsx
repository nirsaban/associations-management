'use client';

import React, { useState, useEffect } from 'react';
import { isPushSupported, getPushPermission, subscribeToPush, isAlreadySubscribed } from '@/lib/push-notifications';

interface PushNotificationStepProps {
  onComplete: () => void;
}

export function PushNotificationStep({ onComplete }: PushNotificationStepProps) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'requesting' | 'denied' | 'unsupported' | 'done'>('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (!isPushSupported()) {
        // Device doesn't support push — skip this step
        setStatus('unsupported');
        return;
      }

      // Already subscribed?
      const subscribed = await isAlreadySubscribed();
      if (subscribed) {
        setStatus('done');
        return;
      }

      const permission = getPushPermission();
      if (permission === 'denied') {
        setStatus('denied');
      } else {
        setStatus('ready');
      }
    }
    check();
  }, []);

  // Auto-advance if already subscribed or unsupported
  useEffect(() => {
    if (status === 'done' || status === 'unsupported') {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
  }, [status, onComplete]);

  const handleEnable = async () => {
    setStatus('requesting');
    setError(null);
    try {
      await subscribeToPush();
      setStatus('done');
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'PERMISSION_DENIED') {
        setStatus('denied');
        setError('ההתראות נחסמו. יש לאפשר התראות בהגדרות הדפדפן ולנסות שוב.');
      } else {
        setError('שגיאה בהפעלת ההתראות. אנא נסה שוב.');
        setStatus('ready');
      }
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === 'done') {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-title-lg font-medium">התראות הופעלו בהצלחה!</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </div>
        <h3 className="text-title-lg font-medium">הפעלת התראות</h3>
        <p className="text-body-md text-on-surface-variant mt-2">
          כדי לקבל עדכונים חשובים על הזמנות, תשלומים וחלוקות — יש להפעיל התראות.
        </p>
        <p className="text-body-sm text-on-surface-variant mt-1">
          שלב זה הוא חובה.
        </p>
      </div>

      {status === 'denied' && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          <p className="font-medium">ההתראות חסומות בדפדפן</p>
          <p className="mt-1">
            יש לפתוח את הגדרות הדפדפן, לאפשר התראות לאתר זה, ולרענן את הדף.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      <button
        onClick={handleEnable}
        disabled={status === 'requesting'}
        className="btn-primary w-full py-3 text-title-md"
      >
        {status === 'requesting' ? 'מפעיל...' : 'הפעל התראות'}
      </button>
    </div>
  );
}
