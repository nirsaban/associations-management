'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, CheckCircle } from 'lucide-react';
import { usePlatform } from '@/hooks/usePlatform';

const adminSchema = z.object({
  phone: z.string().regex(/^05\d{8}$/, 'מספר טלפון חייב להיות בפורמט 05XXXXXXXX'),
  fullName: z.string().min(2, 'שם מלא חייב להכיל לפחות 2 תווים'),
  email: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
});

type AdminFormData = z.infer<typeof adminSchema>;

type CreateAdminModalProps = {
  organizationId: string;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateAdminModal({ organizationId, onClose, onSuccess }: CreateAdminModalProps) {
  const { createFirstAdmin } = usePlatform();
  const [error, setError] = useState<string | null>(null);
  const [createdAdmin, setCreatedAdmin] = useState<{ phone: string; fullName: string } | null>(
    null,
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
  });

  const onSubmit = async (data: AdminFormData) => {
    setError(null);
    try {
      await createFirstAdmin.mutateAsync({
        organizationId,
        phone: data.phone,
        fullName: data.fullName,
        email: data.email || undefined,
      });

      setCreatedAdmin({
        phone: data.phone,
        fullName: data.fullName,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה ביצירת מנהל');
    }
  };

  if (createdAdmin) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-surface-container-low rounded-lg shadow-xl max-w-lg w-full mx-4">
          {/* Success Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-success-container">
                <CheckCircle className="h-6 w-6 text-on-success-container" />
              </div>
              <div>
                <h2 className="text-title-lg font-medium">מנהל נוצר בהצלחה!</h2>
                <p className="text-body-sm text-on-surface-variant">
                  המנהל יכול עכשיו להתחבר למערכת
                </p>
              </div>
            </div>
          </div>

          {/* Success Content */}
          <div className="p-6 space-y-4">
            <div className="bg-primary-container/50 rounded-lg p-4 space-y-2">
              <p className="text-label-md text-on-surface-variant">שם מלא:</p>
              <p className="text-body-lg font-medium">{createdAdmin.fullName}</p>
            </div>

            <div className="bg-primary-container/50 rounded-lg p-4 space-y-2">
              <p className="text-label-md text-on-surface-variant">מספר טלפון:</p>
              <p className="text-body-lg font-medium font-mono" dir="ltr">
                {createdAdmin.phone}
              </p>
            </div>

            <div className="rounded-lg bg-surface-container-high p-4">
              <p className="text-body-md text-on-surface-variant">
                <strong>הוראות למנהל:</strong>
              </p>
              <ol className="list-decimal list-inside space-y-2 mt-2 text-body-sm text-on-surface-variant">
                <li>היכנס לכתובת המערכת</li>
                <li>הזן את מספר הטלפון: {createdAdmin.phone}</li>
                <li>הזן את קוד ה-OTP שנשלח בוואטסאפ</li>
                <li>השלם את אשף ההקמה של העמותה</li>
              </ol>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-border">
            <button
              onClick={() => {
                setCreatedAdmin(null);
                onSuccess();
              }}
              className="btn-primary w-full"
            >
              סגור
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-container-low rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-title-lg font-medium">צור מנהל ראשון</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <p className="text-body-sm text-on-surface-variant">
            צור משתמש מנהל ראשון לעמותה. המנהל יוכל להתחבר עם הטלפון ולהשלים את הגדרת העמותה.
          </p>

          {/* Phone */}
          <div className="space-y-2">
            <label htmlFor="phone" className="block text-label-lg font-medium">
              מספר טלפון *
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              {...register('phone')}
              className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0501234567"
              maxLength={10}
            />
            {errors.phone && <p className="text-body-sm text-error">{errors.phone.message}</p>}
            <p className="text-body-sm text-on-surface-variant">בפורמט ישראלי: 05XXXXXXXX</p>
          </div>

          {/* Full Name */}
          <div className="space-y-2">
            <label htmlFor="fullName" className="block text-label-lg font-medium">
              שם מלא *
            </label>
            <input
              id="fullName"
              type="text"
              {...register('fullName')}
              className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="ישראל ישראלי"
            />
            {errors.fullName && (
              <p className="text-body-sm text-error">{errors.fullName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label htmlFor="email" className="block text-label-lg font-medium">
              אימייל (אופציונלי)
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="admin@example.org"
              dir="ltr"
            />
            {errors.email && <p className="text-body-sm text-error">{errors.email.message}</p>}
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <button
              type="submit"
              disabled={createFirstAdmin.isPending}
              className="btn-primary flex-1"
            >
              {createFirstAdmin.isPending ? 'יוצר...' : 'צור מנהל'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
