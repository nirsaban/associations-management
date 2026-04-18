'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { PATTERNS } from '@/lib/constants';

const phoneSchema = z.object({
  phone: z.string().regex(PATTERNS.ISRAELI_PHONE, 'מספר טלפון ישראלי לא תקין'),
});

type PhoneFormData = z.infer<typeof phoneSchema>;

type Organization = {
  id: string;
  name: string;
  userRole: string;
};

interface PhoneFormProps {
  onSuccess: (
    phone: string,
    sessionId: string,
    requiresOrgSelection: boolean,
    organizations?: Organization[],
  ) => void;
}

export function PhoneForm({ onSuccess }: PhoneFormProps) {
  const { login, isLoading } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
  });

  const onSubmit = async (data: PhoneFormData) => {
    setError(null);
    try {
      const result = await login(data.phone);
      onSuccess(data.phone, result.sessionId, result.requiresOrgSelection, result.organizations);
    } catch (err) {
      setError('שגיאה בשליחת קוד OTP. אנא נסה שוב.');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
      <div className="space-y-2">
        <label htmlFor="phone" className="block text-title-md font-medium">
          מספר טלפון
        </label>
        <input
          id="phone"
          type="tel"
          placeholder="050-1234567"
          {...register('phone')}
          className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {errors.phone && <p className="text-body-sm text-error">{errors.phone.message}</p>}
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      <button type="submit" disabled={isLoading} className="btn-primary w-full py-3 text-title-md">
        {isLoading ? 'שליחה...' : 'שלח קוד OTP'}
      </button>

      <p className="text-center text-body-sm text-on-surface-variant">
        אנו נשלח אליך קוד אימות בן 6 ספרות
      </p>
    </form>
  );
}
