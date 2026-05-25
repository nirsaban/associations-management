'use client';

import React, { useState } from 'react';
import api from '@/lib/api';
import {
  ProfessionTypeahead,
  type ProfessionOption,
} from '@/components/profession-typeahead';

interface ProfessionStepProps {
  onComplete: () => void;
}

export function ProfessionStep({ onComplete }: ProfessionStepProps) {
  const [primary, setPrimary] = useState<ProfessionOption | null>(null);
  const [secondary, setSecondary] = useState<ProfessionOption[]>([]);
  const [showOther, setShowOther] = useState(false);
  const [otherProfession, setOtherProfession] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!primary) return;
    setSaving(true);
    setError(null);
    try {
      await api.put('/users/me/professions', {
        primary: primary.id,
        secondary: secondary.map((p) => p.id),
        otherProfession: otherProfession.trim() || undefined,
      });
      onComplete();
    } catch {
      setError('שמירה נכשלה, נסה שוב');
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Icon + header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="text-title-lg font-medium">מה התחום שלך?</h3>
        <p className="text-body-sm text-on-surface-variant mt-1">
          כדי שחברי הקהילה יוכלו למצוא אותך לפי תחום עיסוק
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      {/* Primary profession */}
      <div className="space-y-1.5">
        <label className="block text-label-md font-medium text-on-surface">
          מקצוע ראשי
          <span className="text-error ms-1">*</span>
        </label>
        <ProfessionTypeahead
          mode="single"
          value={primary}
          onChange={(v) => setPrimary(v as ProfessionOption | null)}
          placeholder="בחר מקצוע ראשי..."
        />
      </div>

      {/* Secondary professions */}
      <div className="space-y-1.5">
        <label className="block text-label-md font-medium text-on-surface">
          מקצועות נוספים{' '}
          <span className="text-on-surface-variant font-normal">(אופציונלי)</span>
        </label>
        <ProfessionTypeahead
          mode="multi"
          value={secondary}
          onChange={(v) => setSecondary((v as ProfessionOption[]) ?? [])}
          placeholder="הוסף מקצועות נוספים..."
          excludeIds={primary ? [primary.id] : []}
          maxItems={3}
        />
      </div>

      {/* "Other" toggle */}
      {!showOther ? (
        <button
          type="button"
          onClick={() => setShowOther(true)}
          className="text-body-sm text-primary underline underline-offset-2"
        >
          לא מצאת? הוסף בעצמך
        </button>
      ) : (
        <div className="space-y-1.5">
          <label className="block text-label-md font-medium text-on-surface">
            מקצוע אחר
          </label>
          <input
            type="text"
            value={otherProfession}
            onChange={(e) => setOtherProfession(e.target.value.slice(0, 120))}
            placeholder="תאר את המקצוע שלך..."
            className="w-full rounded-lg border border-outline bg-surface px-3 py-2.5 text-body-md text-right placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
            dir="rtl"
            maxLength={120}
          />
          <p className="text-label-sm text-on-surface-variant text-end">
            {otherProfession.length}/120
          </p>
        </div>
      )}

      {/* Privacy note */}
      <p className="text-label-sm text-on-surface-variant/70 text-center">
        תמיד תוכל לבחור לא להופיע בחיפוש הקהילה בהגדרות הפרופיל
      </p>

      {/* Action buttons */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!primary || saving}
        className="btn-primary w-full py-3 text-title-md disabled:opacity-50"
      >
        {saving ? 'שומר...' : 'המשך'}
      </button>

      <button
        type="button"
        onClick={onComplete}
        className="w-full py-2.5 text-body-sm text-on-surface-variant/60 hover:text-on-surface-variant transition-colors"
      >
        דלג לעת עתה
      </button>
    </div>
  );
}
