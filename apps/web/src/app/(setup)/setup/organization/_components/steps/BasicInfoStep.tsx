'use client';

import React, { useState, useCallback } from 'react';
import { WizardData } from '../../page';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

type BasicInfoStepProps = {
  data: WizardData;
  onUpdate: (data: WizardData) => void;
};

// Debounce utility
function useDebouncedCallback<T extends (...args: any[]) => any>(callback: T, delay: number): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  return useCallback(
    ((...args) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      const newTimeoutId = setTimeout(() => callback(...args), delay);
      setTimeoutId(newTimeoutId);
    }) as T,
    [callback, delay, timeoutId],
  );
}

function generateSlug(name: string): string {
  return name
    .replace(/[א-ת]/g, '') // Remove Hebrew
    .replace(/\s+/g, '-') // Spaces to dashes
    .replace(/[^a-zA-Z0-9-]/g, '') // Remove special chars
    .toLowerCase()
    .replace(/-+/g, '-') // Multiple dashes to single
    .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
}

export function BasicInfoStep({ data, onUpdate }: BasicInfoStepProps) {
  const [slug, setSlug] = useState(data.slug || '');
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (name: string) => {
    const autoSlug = generateSlug(name);
    setSlug(autoSlug);
    setSlugAvailable(null); // Reset availability check
    onUpdate({ ...data, name, slug: autoSlug });
  };

  // Real-time slug availability check
  const checkSlugAvailability = async (slug: string) => {
    if (!slug || slug.length < 2) {
      setSlugAvailable(null);
      return;
    }

    setIsCheckingSlug(true);
    try {
      // TODO: Call API to check slug availability
      // const response = await api.get(`/organization/check-slug?slug=${slug}`);
      // setSlugAvailable(response.data.available);

      // For now, mock the check
      await new Promise((resolve) => setTimeout(resolve, 500));
      setSlugAvailable(true);
    } catch (error) {
      setSlugAvailable(false);
    } finally {
      setIsCheckingSlug(false);
    }
  };

  const debouncedCheckSlug = useDebouncedCallback(checkSlugAvailability, 500);

  const handleSlugChange = (newSlug: string) => {
    setSlug(newSlug);
    setSlugAvailable(null);
    onUpdate({ ...data, slug: newSlug });
    debouncedCheckSlug(newSlug);
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-title-lg font-medium mb-2">פרטי העמותה</h2>
        <p className="text-body-sm text-on-surface-variant">מלא את הפרטים הבסיסיים של העמותה שלך</p>
      </div>

      {/* Name */}
      <div className="space-y-2">
        <label htmlFor="name" className="block text-label-lg font-medium">
          שם העמותה *
        </label>
        <input
          id="name"
          type="text"
          value={data.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="לדוגמה: עמותת צדקה"
        />
      </div>

      {/* Slug */}
      <div className="space-y-2">
        <label htmlFor="slug" className="block text-label-lg font-medium">
          כתובת URL (slug) *
        </label>
        <div className="relative">
          <input
            id="slug"
            type="text"
            value={slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 pe-12 text-body-md font-mono transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="tzedaka-org"
            dir="ltr"
          />
          <div className="absolute start-3 top-1/2 -translate-y-1/2">
            {isCheckingSlug && <Loader2 className="h-5 w-5 text-on-surface-variant animate-spin" />}
            {!isCheckingSlug && slugAvailable === true && (
              <CheckCircle className="h-5 w-5 text-success" />
            )}
            {!isCheckingSlug && slugAvailable === false && (
              <XCircle className="h-5 w-5 text-error" />
            )}
          </div>
        </div>
        <p className="text-body-sm text-on-surface-variant">
          הכתובת תהיה: amutot.app/{slug || 'slug'}
        </p>
        {slugAvailable === false && (
          <p className="text-body-sm text-error">הכתובת תפוסה - אנא בחר כתובת אחרת</p>
        )}
      </div>

      {/* Contact Email */}
      <div className="space-y-2">
        <label htmlFor="contactEmail" className="block text-label-lg font-medium">
          אימייל ליצירת קשר
        </label>
        <input
          id="contactEmail"
          type="email"
          value={data.contactEmail || ''}
          onChange={(e) => onUpdate({ ...data, contactEmail: e.target.value })}
          className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="contact@example.org"
          dir="ltr"
        />
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
          value={data.contactPhone || ''}
          onChange={(e) => onUpdate({ ...data, contactPhone: e.target.value })}
          className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          placeholder="0501234567"
          maxLength={10}
        />
      </div>

      {/* Address */}
      <div className="space-y-2">
        <label htmlFor="address" className="block text-label-lg font-medium">
          כתובת (אופציונלי)
        </label>
        <textarea
          id="address"
          value={data.address || ''}
          onChange={(e) => onUpdate({ ...data, address: e.target.value })}
          className="w-full rounded-lg border border-border bg-surface-container-low px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
          placeholder="רחוב הרצל 1, תל אביב"
          rows={3}
        />
      </div>
    </div>
  );
}
