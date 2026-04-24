'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PushNotificationStep } from './_components/PushNotificationStep';
import { BiometryStep } from './_components/BiometryStep';
import { PwaInstallInstructions } from './_components/PwaInstallInstructions';
import { GroupConfirmStep } from './_components/GroupConfirmStep';
import api from '@/lib/api';

type Step = 'group' | 'push' | 'biometry' | 'pwa';

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  if ('standalone' in navigator && (navigator as unknown as { standalone?: boolean }).standalone) return true;
  if (window.matchMedia('(display-mode: standalone)').matches) return true;
  return false;
}

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * Build step list based on platform capabilities and user role:
 * - Non-admin users get a group confirmation step first
 * - iOS non-PWA: push won't work → show PWA install first, then biometry
 * - Already in PWA: skip PWA step → push + biometry
 * - Android/Desktop browser: push works → push + biometry + PWA
 */
function buildSteps(isAdmin: boolean): Step[] {
  const standalone = isStandalone();
  const ios = isIosDevice();

  const groupStep: Step[] = isAdmin ? [] : ['group'];

  if (standalone) {
    return [...groupStep, 'push', 'biometry'];
  }

  if (ios) {
    return [...groupStep, 'pwa', 'biometry'];
  }

  return [...groupStep, 'push', 'biometry', 'pwa'];
}

export default function ActivationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.systemRole === 'ADMIN' || user?.platformRole === 'SUPER_ADMIN';
  const [steps, setSteps] = useState<Step[]>(['push', 'biometry', 'pwa']);
  const [currentStep, setCurrentStep] = useState<Step>('push');

  // Compute steps on client only (needs navigator)
  useEffect(() => {
    const computed = buildSteps(!!isAdmin);
    setSteps(computed);
    setCurrentStep(computed[0]);
  }, [isAdmin]);

  const goToNext = useCallback(async (fromStep: Step) => {
    const idx = steps.indexOf(fromStep);
    if (idx < steps.length - 1) {
      setCurrentStep(steps[idx + 1]);
    } else {
      // All steps done — mark activation complete
      try {
        await api.post('/activation/complete');
      } catch {
        // Best effort — if it fails the user can retry next login
      }

      // Navigate to appropriate landing
      if (user?.platformRole === 'SUPER_ADMIN') {
        router.replace('/platform');
      } else {
        router.replace('/');
      }
    }
  }, [router, user, steps]);

  const currentIndex = useMemo(() => steps.indexOf(currentStep), [steps, currentStep]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-container/20 to-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-headline-lg font-headline mb-2">הגדרה ראשונית</h1>
          <p className="text-body-md text-on-surface-variant">
            עוד כמה צעדים קצרים לפני שמתחילים
          </p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((step, idx) => (
            <div
              key={step}
              className={`h-2 rounded-full transition-all ${
                idx <= currentIndex
                  ? 'w-8 bg-primary'
                  : 'w-4 bg-on-surface/20'
              }`}
            />
          ))}
        </div>

        {/* Card */}
        <div className="card-elevated">
          {currentStep === 'group' && (
            <GroupConfirmStep onComplete={() => goToNext('group')} />
          )}
          {currentStep === 'push' && (
            <PushNotificationStep onComplete={() => goToNext('push')} />
          )}
          {currentStep === 'biometry' && (
            <BiometryStep
              onComplete={() => goToNext('biometry')}
              onSkip={() => goToNext('biometry')}
            />
          )}
          {currentStep === 'pwa' && (
            <PwaInstallInstructions onAcknowledge={() => goToNext('pwa')} />
          )}
        </div>

        {/* Step label */}
        <p className="text-center text-body-sm text-on-surface-variant mt-4">
          שלב {currentIndex + 1} מתוך {steps.length}
        </p>
      </div>
    </div>
  );
}
