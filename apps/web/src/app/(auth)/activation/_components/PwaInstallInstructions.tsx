'use client';

import React, { useState, useEffect } from 'react';

type Platform = 'ios' | 'android' | 'desktop';

function detectPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return 'desktop';
}

function isStandalone(): boolean {
  if ('standalone' in navigator && (navigator as { standalone?: boolean }).standalone) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
}

interface PwaInstallInstructionsProps {
  onAcknowledge: () => void;
}

export function PwaInstallInstructions({ onAcknowledge }: PwaInstallInstructionsProps) {
  const [platform, setPlatform] = useState<Platform>('desktop');
  const [alreadyInstalled, setAlreadyInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    setPlatform(detectPlatform());
    setAlreadyInstalled(isStandalone());

    // Capture the beforeinstallprompt event for Android/desktop Chrome
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setAlreadyInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (alreadyInstalled) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-title-lg font-medium">האפליקציה כבר מותקנת!</h3>
        <p className="text-body-md text-on-surface-variant">
          את/ה כבר משתמש/ת באפליקציה במצב מותקן.
        </p>
        <button onClick={onAcknowledge} className="btn-primary w-full py-3 text-title-md">
          המשך
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </div>
        <h3 className="text-title-lg font-medium">התקנת האפליקציה</h3>
        <p className="text-body-md text-on-surface-variant">
          להתנסות הטובה ביותר, מומלץ להתקין את האפליקציה במכשיר שלך
        </p>
      </div>

      {deferredPrompt ? (
        <button onClick={handleInstallClick} className="btn-primary w-full py-3 text-title-md">
          התקן עכשיו
        </button>
      ) : (
        <>
          {platform === 'ios' && <IosInstructions />}
          {platform === 'android' && <AndroidInstructions />}
          {platform === 'desktop' && <DesktopInstructions />}
        </>
      )}

      <button onClick={onAcknowledge} className="btn-primary w-full py-3 text-title-md">
        הבנתי, המשך
      </button>
    </div>
  );
}

// Type for the beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function IosInstructions() {
  return (
    <div className="space-y-4 bg-surface-container-low rounded-xl p-4">
      <h4 className="text-title-sm font-medium">הוראות התקנה — iOS (Safari)</h4>
      <ol className="space-y-3 text-body-md">
        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-body-sm font-bold">1</span>
          <span>לחץ על כפתור השיתוף בתחתית המסך</span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-body-sm font-bold">2</span>
          <span>גלול למטה ובחר &quot;הוסף למסך הבית&quot;</span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-body-sm font-bold">3</span>
          <span>לחץ &quot;הוסף&quot; בפינה הימנית העליונה</span>
        </li>
      </ol>
    </div>
  );
}

function AndroidInstructions() {
  return (
    <div className="space-y-4 bg-surface-container-low rounded-xl p-4">
      <h4 className="text-title-sm font-medium">הוראות התקנה — Android (Chrome)</h4>
      <ol className="space-y-3 text-body-md">
        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-body-sm font-bold">1</span>
          <span>לחץ על תפריט הדפדפן (שלוש נקודות) בפינה הימנית העליונה</span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-body-sm font-bold">2</span>
          <span>בחר &quot;התקן אפליקציה&quot; או &quot;הוסף למסך הבית&quot;</span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-body-sm font-bold">3</span>
          <span>אשר את ההתקנה בחלון שיופיע</span>
        </li>
      </ol>
    </div>
  );
}

function DesktopInstructions() {
  return (
    <div className="space-y-4 bg-surface-container-low rounded-xl p-4">
      <h4 className="text-title-sm font-medium">הוראות התקנה — מחשב (Chrome / Edge)</h4>
      <ol className="space-y-3 text-body-md">
        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-body-sm font-bold">1</span>
          <span>חפש את אייקון ההתקנה בצד ימין של שורת הכתובת</span>
        </li>
        <li className="flex gap-3 items-start">
          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center text-body-sm font-bold">2</span>
          <span>לחץ עליו ואשר &quot;התקן&quot;</span>
        </li>
      </ol>
    </div>
  );
}
