'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { PushNotificationStep } from './_components/PushNotificationStep';
import { BiometryStep } from './_components/BiometryStep';
import { PwaInstallInstructions } from './_components/PwaInstallInstructions';
import api from '@/lib/api';

type Step = 'push' | 'biometry' | 'pwa';

const STEPS: Step[] = ['push', 'biometry', 'pwa'];

export default function ActivationPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState<Step>('push');

  const goToNext = useCallback(async (fromStep: Step) => {
    const idx = STEPS.indexOf(fromStep);
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1]);
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
  }, [router, user]);

  const currentIndex = STEPS.indexOf(currentStep);

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
          {STEPS.map((step, idx) => (
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
          שלב {currentIndex + 1} מתוך {STEPS.length}
        </p>
      </div>
    </div>
  );
}
