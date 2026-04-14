'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { StepIndicator } from './_components/StepIndicator';
import { WizardNavigation } from './_components/WizardNavigation';
import { BasicInfoStep } from './_components/steps/BasicInfoStep';
import { LogoUploadStep } from './_components/steps/LogoUploadStep';
import { SettingsStep } from './_components/steps/SettingsStep';
import { CompletionStep } from './_components/steps/CompletionStep';

type WizardStep = 'basic-info' | 'logo' | 'settings' | 'completion';

export type WizardData = {
  name?: string;
  slug?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  logoFile?: File;
  logoPreview?: string;
  monthlyPaymentAmount?: number;
  paymentInstructions?: string;
};

export default function AssociationSetupWizard() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>('basic-info');
  const [wizardData, setWizardData] = useState<WizardData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps: WizardStep[] = ['basic-info', 'logo', 'settings', 'completion'];
  const currentStepIndex = steps.indexOf(currentStep);

  const validateCurrentStep = (): boolean => {
    switch (currentStep) {
      case 'basic-info':
        return !!(
          wizardData.name &&
          wizardData.slug &&
          wizardData.name.length >= 2 &&
          wizardData.slug.length >= 2
        );
      case 'logo':
        return true; // Optional step
      case 'settings':
        return true; // Optional step
      case 'completion':
        return false; // Can't go next from completion
      default:
        return false;
    }
  };

  const canGoNext = validateCurrentStep();
  const canGoBack = currentStepIndex > 0 && currentStep !== 'completion';
  const canSkip = currentStep === 'logo' || currentStep === 'settings';
  const isLastStep = currentStep === 'settings';

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1] as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1] as WizardStep);
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // TODO: Submit wizard data to backend API
      // 1. PATCH /associations/me/setup with basic info
      // 2. POST /associations/me/logo if logo exists
      // 3. Set setupCompleted = true

      // For now, just move to completion step
      setCurrentStep('completion');
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשמירת הנתונים');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartUsing = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {currentStep !== 'completion' && (
          <StepIndicator
            steps={3} // Only count first 3 steps (completion is separate)
            currentStep={currentStepIndex + 1}
          />
        )}

        <div className="card-elevated mt-8">
          {currentStep === 'basic-info' && (
            <BasicInfoStep
              data={wizardData}
              onUpdate={setWizardData}
            />
          )}

          {currentStep === 'logo' && (
            <LogoUploadStep
              data={wizardData}
              onUpdate={setWizardData}
            />
          )}

          {currentStep === 'settings' && (
            <SettingsStep
              data={wizardData}
              onUpdate={setWizardData}
            />
          )}

          {currentStep === 'completion' && (
            <CompletionStep
              organizationName={wizardData.name || 'העמותה'}
              onStartUsing={handleStartUsing}
            />
          )}

          {error && currentStep !== 'completion' && (
            <div className="px-8 pb-6">
              <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
                {error}
              </div>
            </div>
          )}

          {currentStep !== 'completion' && (
            <WizardNavigation
              canGoBack={canGoBack}
              canGoNext={canGoNext}
              canSkip={canSkip}
              isLastStep={isLastStep}
              onBack={handleBack}
              onNext={isLastStep ? handleComplete : handleNext}
              onSkip={handleSkip}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
