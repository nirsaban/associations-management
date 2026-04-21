'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { useRouter } from 'next/navigation';

const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'קוד OTP חייב להיות בן 6 ספרות')
    .regex(/^\d+$/, 'קוד OTP חייב להיות מספרים בלבד'),
});

type OtpFormData = z.infer<typeof otpSchema>;

interface OtpVerificationProps {
  phone: string;
  sessionId: string;
  organizationId?: string | null;
  onBack: () => void;
}

export function OtpVerification({
  phone,
  sessionId,
  organizationId,
  onBack,
}: OtpVerificationProps) {
  const { verifyOtp, isLoading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '123456' },
  });

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const onSubmit = async (data: OtpFormData) => {
    setError(null);
    try {
      await verifyOtp(phone, data.otp, sessionId, organizationId);

      // Determine landing page based on role
      const { user } = useAuthStore.getState();

      if (user?.platformRole === 'SUPER_ADMIN') {
        console.log('[OTP] SUPER_ADMIN logged in, going to platform');
        router.replace('/platform-secret/admins');
      } else if (user?.systemRole === 'ADMIN') {
        console.log('[OTP] ADMIN logged in, checking setup status...');
        // Will be handled by dashboard layout
        router.replace('/');
      } else {
        console.log('[OTP] USER logged in, going to dashboard');
        router.replace('/');
      }
    } catch (err) {
      setError('קוד OTP שגוי. אנא נסה שוב.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <div className="space-y-2">
        <label htmlFor="otp" className="block text-title-md font-medium">
          קוד אימות
        </label>
        <p className="text-body-sm text-on-surface-variant">
          קוד בן 6 ספרות נשלח ל-{phone}
        </p>
        <input
          id="otp"
          type="text"
          inputMode="numeric"
          maxLength={6}
          placeholder="000000"
          {...register('otp')}
          className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-center text-2xl font-mono transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 tracking-widest"
        />
        {errors.otp && (
          <p className="text-body-sm text-error">{errors.otp.message}</p>
        )}
      </div>

      <div className="flex justify-between items-center text-body-sm">
        <span className="text-on-surface-variant">
          קוד פג תוקף בעוד {minutes}:{seconds.toString().padStart(2, '0')}
        </span>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || timeLeft <= 0}
        className="btn-primary w-full py-3 text-title-md"
      >
        {isLoading ? 'אימות...' : 'אימות'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="btn-ghost w-full py-3 text-title-md"
      >
        חזור לשלב קודם
      </button>
    </form>
  );
}
