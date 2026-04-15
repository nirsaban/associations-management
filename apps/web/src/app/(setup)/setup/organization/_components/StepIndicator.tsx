'use client';

import React from 'react';
import { cn } from '@/lib/utils';

type StepIndicatorProps = {
  steps: number;
  currentStep: number;
};

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: steps }).map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-2 w-12 rounded-full transition-colors duration-300',
            i + 1 <= currentStep ? 'bg-primary' : 'bg-border'
          )}
        />
      ))}
    </div>
  );
}
