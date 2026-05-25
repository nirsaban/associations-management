'use client';

import React, { useState } from 'react';
import { Briefcase, Phone, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';

interface BusinessStepProps {
  onComplete: () => void;
}

type ScreenState = 'intro' | 'form';

export function BusinessStep({ onComplete }: BusinessStepProps) {
  const [screen, setScreen] = useState<ScreenState>('intro');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    title.trim().length >= 2 &&
    title.trim().length <= 120 &&
    description.trim().length >= 5 &&
    description.trim().length <= 2000;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      await api.put('/community/businesses/me', {
        title: title.trim(),
        description: description.trim(),
        category: category.trim() || undefined,
        phone: phone.trim() || undefined,
        isActive: true,
      });
      onComplete();
    } catch (err) {
      const message =
        (err as { response?: { data?: { message?: string | string[] } } })?.response?.data?.message;
      setError(
        Array.isArray(message)
          ? message[0] || 'שמירה נכשלה, נסה שוב'
          : message || 'שמירה נכשלה, נסה שוב',
      );
      setSaving(false);
    }
  };

  if (screen === 'intro') {
    return (
      <div className="space-y-6">
        {/* Icon + header */}
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-title-lg font-medium">יש לך עסק?</h3>
          <p className="text-body-sm text-on-surface-variant mt-2 leading-relaxed">
            פרסם את העסק שלך בקהילה — כל החברים יוכלו לראות אותו בסליידר העסקים
            ולפנות אליך ישירות. בחינם, אופציונלי לחלוטין.
          </p>
        </div>

        {/* Benefits */}
        <ul className="space-y-2 text-body-sm text-on-surface-variant">
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">·</span>
            <span>חשיפה לחברי הקהילה ולמשפחות פעילות</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">·</span>
            <span>קישורים ישירים לטלפון, אתר ורשתות חברתיות</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary mt-0.5">·</span>
            <span>תוכל לערוך, להסתיר או להסיר בכל רגע</span>
          </li>
        </ul>

        {/* Action buttons */}
        <button
          type="button"
          onClick={() => setScreen('form')}
          className="btn-primary w-full py-3 text-title-md"
        >
          הוסף את העסק שלי
        </button>

        <button
          type="button"
          onClick={onComplete}
          className="w-full py-2.5 text-body-sm text-on-surface-variant/70 hover:text-on-surface-variant transition-colors"
        >
          אין לי עסק / דלג לעת עתה
        </button>
      </div>
    );
  }

  // form state
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setScreen('intro')}
          className="btn-ghost p-1.5 rounded-full"
          aria-label="חזור"
        >
          <ArrowLeft className="h-4 w-4 icon-flip-rtl" />
        </button>
        <div>
          <h3 className="text-title-md font-medium">פרטי העסק</h3>
          <p className="text-body-sm text-on-surface-variant">
            ניתן להוסיף פרטים נוספים אחר כך מהפרופיל
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      {/* Title */}
      <div className="space-y-1.5">
        <label className="block text-label-md font-medium text-on-surface">
          שם העסק <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value.slice(0, 120))}
          placeholder="למשל: ייעוץ פיננסי לעסקים קטנים"
          className="w-full rounded-lg border border-outline bg-surface px-3 py-2.5 text-body-md text-right placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          dir="rtl"
          maxLength={120}
        />
        <p className="text-label-sm text-on-surface-variant/70 text-end">
          {title.length}/120
        </p>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="block text-label-md font-medium text-on-surface">
          תיאור קצר <span className="text-error">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 600))}
          placeholder="מה אתה עושה ולמי? משפט-שניים זה מספיק."
          rows={3}
          className="w-full rounded-lg border border-outline bg-surface px-3 py-2.5 text-body-md text-right placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
          dir="rtl"
          maxLength={600}
        />
        <p className="text-label-sm text-on-surface-variant/70 text-end">
          {description.length}/600
        </p>
      </div>

      {/* Category — optional */}
      <div className="space-y-1.5">
        <label className="block text-label-md font-medium text-on-surface">
          קטגוריה{' '}
          <span className="text-on-surface-variant font-normal">(אופציונלי)</span>
        </label>
        <input
          type="text"
          value={category}
          onChange={(e) => setCategory(e.target.value.slice(0, 80))}
          placeholder="ייעוץ עסקי / חינוך / מזון / בנייה ..."
          className="w-full rounded-lg border border-outline bg-surface px-3 py-2.5 text-body-md text-right placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40"
          dir="rtl"
          maxLength={80}
        />
      </div>

      {/* Phone — optional */}
      <div className="space-y-1.5">
        <label className="block text-label-md font-medium text-on-surface flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5" />
          טלפון ליצירת קשר{' '}
          <span className="text-on-surface-variant font-normal">(אופציונלי)</span>
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value.slice(0, 13))}
          placeholder="0501234567"
          className="w-full rounded-lg border border-outline bg-surface px-3 py-2.5 text-body-md focus:outline-none focus:ring-2 focus:ring-primary/40"
          dir="ltr"
          maxLength={13}
          inputMode="tel"
        />
      </div>

      {/* Privacy note */}
      <p className="text-label-sm text-on-surface-variant/70 text-center">
        תוכל להוסיף לוגו, אתר ורשתות חברתיות מעמוד "העסק שלי" בפרופיל
      </p>

      {/* Action buttons */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || saving}
        className="btn-primary w-full py-3 text-title-md disabled:opacity-50"
      >
        {saving ? 'שומר...' : 'שמור והמשך'}
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
