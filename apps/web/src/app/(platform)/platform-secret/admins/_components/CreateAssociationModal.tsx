'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';
import { usePlatform } from '@/hooks/usePlatform';

const associationSchema = z.object({
  name: z.string().min(2, 'שם חייב להכיל לפחות 2 תווים'),
  slug: z
    .string()
    .min(2, 'Slug חייב להכיל לפחות 2 תווים')
    .regex(/^[a-z0-9-]+$/, 'Slug יכול להכיל רק אותיות אנגליות קטנות, מספרים ומקפים'),
  contactEmail: z.string().email('כתובת אימייל לא תקינה').optional().or(z.literal('')),
  contactPhone: z
    .string()
    .regex(/^05\d{8}$/, 'מספר טלפון חייב להיות בפורמט 05XXXXXXXX')
    .optional()
    .or(z.literal('')),
});

type AssociationFormData = z.infer<typeof associationSchema>;

type CreateAssociationModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateAssociationModal({ onClose, onSuccess }: CreateAssociationModalProps) {
  const { createAssociation } = usePlatform();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<AssociationFormData>({
    resolver: zodResolver(associationSchema),
  });

  const name = watch('name');

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setValue('name', value);

    // Generate slug: remove Hebrew, spaces, special chars, convert to lowercase
    const slug = value
      .replace(/[א-ת]/g, '') // Remove Hebrew
      .replace(/\s+/g, '-') // Spaces to dashes
      .replace(/[^a-zA-Z0-9-]/g, '') // Remove special chars
      .toLowerCase()
      .replace(/-+/g, '-') // Multiple dashes to single
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes

    if (slug) {
      setValue('slug', slug);
    }
  };

  const onSubmit = async (data: AssociationFormData) => {
    setError(null);
    try {
      await createAssociation.mutateAsync({
        name: data.name,
        slug: data.slug,
        contactEmail: data.contactEmail || undefined,
        contactPhone: data.contactPhone || undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה ביצירת עמותה');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-surface-container-low rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-title-lg font-medium">עמותה חדשה</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-container rounded-md transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-label-lg font-medium">
              שם העמותה *
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              onChange={(e) => handleNameChange(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="לדוגמה: עמותת צדקה"
            />
            {errors.name && (
              <p className="text-body-sm text-error">{errors.name.message}</p>
            )}
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label htmlFor="slug" className="block text-label-lg font-medium">
              כתובת URL (slug) *
            </label>
            <input
              id="slug"
              type="text"
              {...register('slug')}
              className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md font-mono transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="tzedaka-org"
              dir="ltr"
            />
            {errors.slug && (
              <p className="text-body-sm text-error">{errors.slug.message}</p>
            )}
            <p className="text-body-sm text-on-surface-variant">
              הכתובת תהיה: amutot.app/{watch('slug') || 'slug'}
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <label htmlFor="contactEmail" className="block text-label-lg font-medium">
              אימייל ליצירת קשר
            </label>
            <input
              id="contactEmail"
              type="email"
              {...register('contactEmail')}
              className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="contact@example.org"
              dir="ltr"
            />
            {errors.contactEmail && (
              <p className="text-body-sm text-error">{errors.contactEmail.message}</p>
            )}
          </div>

          {/* Contact Phone */}
          <div className="space-y-2">
            <label htmlFor="contactPhone" className="block text-label-lg font-medium">
              טלפון ליצירת קשר
            </label>
            <input
              id="contactPhone"
              type="tel"
              inputMode="numeric"
              {...register('contactPhone')}
              className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="0501234567"
              maxLength={10}
            />
            {errors.contactPhone && (
              <p className="text-body-sm text-error">{errors.contactPhone.message}</p>
            )}
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
              disabled={createAssociation.isPending}
              className="btn-primary flex-1"
            >
              {createAssociation.isPending ? 'יוצר...' : 'צור עמותה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost flex-1"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
