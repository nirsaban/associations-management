'use client';

import React, { useState, useEffect } from 'react';
import { isWebAuthnSupported, registerWebAuthn, getDeviceName } from '@/lib/webauthn';

interface BiometryStepProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function BiometryStep({ onComplete, onSkip }: BiometryStepProps) {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [status, setStatus] = useState<'checking' | 'ready' | 'registering' | 'done' | 'error'>('checking');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      const isSupported = await isWebAuthnSupported();
      setSupported(isSupported);
      if (!isSupported) {
        // Device doesn't support biometry — auto-skip after brief message
        setStatus('done');
      } else {
        setStatus('ready');
      }
    }
    check();
  }, []);

  // Auto-advance if not supported
  useEffect(() => {
    if (supported === false) {
      const timer = setTimeout(onSkip, 1500);
      return () => clearTimeout(timer);
    }
  }, [supported, onSkip]);

  const handleRegister = async () => {
    setStatus('registering');
    setError(null);
    try {
      const deviceName = getDeviceName();
      await registerWebAuthn(deviceName);
      setStatus('done');
      setTimeout(onComplete, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('NotAllowedError') || message.includes('cancelled')) {
        setError('הזיהוי בוטל. ניתן לנסות שוב או לדלג.');
      } else {
        setError('שגיאה ברישום זיהוי ביומטרי. ני��ן לנסות שוב או לדלג.');
      }
      setStatus('error');
    }
  };

  if (status === 'checking') {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (supported === false) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h3 className="text-title-lg font-medium">זיהוי ביומטרי לא נתמך</h3>
        <p className="text-body-md text-on-surface-variant">
          המכשיר שלך לא תומך ב��יהוי ביו��טרי. ממשיכים הלאה...
        </p>
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
        <h3 className="text-title-lg font-medium">זיהוי ביומטרי נרשם בהצלחה!</h3>
        <p className="text-body-md text-on-surface-variant">
          בהתחברות הבאה תוכל/י להשתמש ב-Face ID / Touch ID.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-purple-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
          </svg>
        </div>
        <h3 className="text-title-lg font-medium">הפעלת זיהוי ביומטרי</h3>
        <p className="text-body-md text-on-surface-variant mt-2">
          הפעל Face ID / Touch ID כדי להתחבר מהר יותר בפעם הבאה — בלי להמתין לקוד.
        </p>
        <p className="text-body-sm text-on-surface-variant mt-1">
          שלב זה מומלץ אך לא חובה.
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      <button
        onClick={handleRegister}
        disabled={status === 'registering'}
        className="btn-primary w-full py-3 text-title-md"
      >
        {status === 'registering' ? 'רושם...' : 'הפעל זי��וי ביומטרי'}
      </button>

      <button
        onClick={onSkip}
        disabled={status === 'registering'}
        className="btn-ghost w-full py-3 text-title-md"
      >
        דלג לעת עתה
      </button>
    </div>
  );
}
