'use client';

import React from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';

type WizardNavigationProps = {
  canGoBack: boolean;
  canGoNext: boolean;
  canSkip: boolean;
  isLastStep: boolean;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
};

export function WizardNavigation({
  canGoBack,
  canGoNext,
  canSkip,
  isLastStep,
  onBack,
  onNext,
  onSkip,
  isSubmitting,
}: WizardNavigationProps) {
  return (
    <div className="flex items-center justify-between px-8 py-6 border-t border-border">
      <button className="btn-ghost flex items-center gap-2" disabled={!canGoBack} onClick={onBack}>
        <ArrowRight className="h-4 w-4" />
        חזור
      </button>

      <div className="flex gap-2">
        {canSkip && (
          <button className="btn-outline" onClick={onSkip}>
            דלג
          </button>
        )}

        <button
          className="btn-primary flex items-center gap-2"
          disabled={!canGoNext || isSubmitting}
          onClick={onNext}
        >
          {isSubmitting ? 'שומר...' : isLastStep ? 'סיים והתחל' : 'המשך'}
          {!isLastStep && <ArrowLeft className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
