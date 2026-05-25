'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Briefcase, Loader2, Upload, Trash2, Globe, Phone, Mail, ArrowRight, Check, AlertTriangle, Image as ImageIcon,
} from 'lucide-react';
import api from '@/lib/api';

interface Business {
  id?: string;
  title: string;
  description: string;
  category: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsappUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  isActive: boolean;
}

const EMPTY: Business = {
  title: '',
  description: '',
  category: null,
  logoUrl: null,
  coverImageUrl: null,
  phone: null,
  email: null,
  website: null,
  whatsappUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  tiktokUrl: null,
  youtubeUrl: null,
  linkedinUrl: null,
  isActive: true,
};

export default function BusinessProfilePage() {
  const router = useRouter();
  const [form, setForm] = useState<Business>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<'logo' | 'cover' | null>(null);
  const logoRef = useRef<HTMLInputElement>(null);
  const coverRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    api.get<{ data: Business | null }>('/community/businesses/me')
      .then(res => {
        if (res.data.data) setForm({ ...EMPTY, ...res.data.data });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const update = (key: keyof Business, value: string | boolean | null) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleUpload = async (key: 'logo' | 'cover', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingKey(key);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await api.post<{ data: { url: string } }>('/community/businesses/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      update(key === 'logo' ? 'logoUrl' : 'coverImageUrl', res.data.data.url);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'שגיאה בהעלאת התמונה');
    } finally {
      setUploadingKey(null);
      if (key === 'logo' && logoRef.current) logoRef.current.value = '';
      if (key === 'cover' && coverRef.current) coverRef.current.value = '';
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.title.trim().length < 2) { setError('שם העסק חייב להכיל לפחות 2 תווים'); return; }
    if (form.description.trim().length < 5) { setError('התיאור חייב להכיל לפחות 5 תווים'); return; }
    setSaving(true);
    try {
      const payload: Record<string, unknown> = { ...form };
      // strip null/empty
      for (const k of Object.keys(payload)) {
        const v = payload[k];
        if (v === null || (typeof v === 'string' && v.trim() === '')) delete payload[k];
      }
      payload.title = form.title.trim();
      payload.description = form.description.trim();
      payload.isActive = form.isActive;

      const res = await api.put<{ data: Business }>('/community/businesses/me', payload);
      setForm({ ...EMPTY, ...res.data.data });
      setSavedAt(new Date());
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'שגיאה בשמירה');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('למחוק את העסק שלך מהסליידר הקהילתי?')) return;
    setSaving(true);
    try {
      await api.delete('/community/businesses/me');
      setForm(EMPTY);
      setSavedAt(null);
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'שגיאה במחיקה');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-6 w-6 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-full hover:bg-surface-container transition-colors"
          aria-label="חזור"
        >
          <ArrowRight className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-headline-sm font-headline">העסק שלי</h1>
            <p className="text-label-md text-on-surface-variant">
              {form.id ? 'מופיע בסליידר הקהילתי לכל המשתמשים בעמותה' : 'פרסם את העסק שלך לקהילה'}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-error/10 text-error text-body-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {savedAt && (
        <div className="mb-4 p-3 rounded-lg bg-success/10 text-success-strong text-body-sm flex items-center gap-2">
          <Check className="h-4 w-4" /> נשמר בהצלחה ({savedAt.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })})
        </div>
      )}

      <form onSubmit={submit} className="space-y-5">
        {/* Visibility toggle */}
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-outline/20 cursor-pointer hover:bg-surface-container/50">
          <div>
            <p className="text-body-md font-medium">מוצג בסליידר הקהילתי</p>
            <p className="text-label-sm text-on-surface-variant">סמן כדי שהעסק יופיע למשתמשים אחרים בעמותה</p>
          </div>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={e => update('isActive', e.target.checked)}
            className="w-5 h-5 rounded border-outline/30"
          />
        </label>

        {/* Basic info */}
        <Section title="פרטים בסיסיים">
          <Field label="שם העסק/השירות" required>
            <input
              value={form.title}
              onChange={e => update('title', e.target.value)}
              placeholder="לדוגמה: סטודיו לעיצוב גרפי"
              maxLength={120}
              className={inputClass}
            />
          </Field>
          <Field label="קטגוריה">
            <input
              value={form.category ?? ''}
              onChange={e => update('category', e.target.value || null)}
              placeholder="לדוגמה: עיצוב גרפי / נדל״ן / ייעוץ"
              maxLength={80}
              className={inputClass}
            />
          </Field>
          <Field label="תיאור" required>
            <textarea
              value={form.description}
              onChange={e => update('description', e.target.value)}
              placeholder="ספרו על העסק שלכם — מה אתם עושים, למי, ומה מבדיל אתכם"
              rows={5}
              maxLength={2000}
              className={`${inputClass} resize-y`}
            />
            <p className="text-[11px] text-on-surface-variant mt-1">
              {form.description.length}/2000
            </p>
          </Field>
        </Section>

        {/* Images */}
        <Section title="תמונות">
          <ImageUpload
            label="לוגו"
            value={form.logoUrl}
            uploading={uploadingKey === 'logo'}
            onClear={() => update('logoUrl', null)}
            onPick={() => logoRef.current?.click()}
          />
          <input ref={logoRef} type="file" accept="image/*" onChange={e => handleUpload('logo', e)} className="hidden" />

          <ImageUpload
            label="תמונת כיסוי (אופציונלי)"
            value={form.coverImageUrl}
            uploading={uploadingKey === 'cover'}
            onClear={() => update('coverImageUrl', null)}
            onPick={() => coverRef.current?.click()}
            aspectClass="aspect-[3/1]"
          />
          <input ref={coverRef} type="file" accept="image/*" onChange={e => handleUpload('cover', e)} className="hidden" />
        </Section>

        {/* Contact */}
        <Section title="יצירת קשר">
          <Field label="טלפון">
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                value={form.phone ?? ''}
                onChange={e => update('phone', e.target.value || null)}
                placeholder="0501234567"
                dir="ltr"
                className={`${inputClass} pe-9`}
              />
            </div>
          </Field>
          <Field label="אימייל">
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                type="email"
                value={form.email ?? ''}
                onChange={e => update('email', e.target.value || null)}
                placeholder="business@example.com"
                dir="ltr"
                className={`${inputClass} pe-9`}
              />
            </div>
          </Field>
          <Field label="אתר אינטרנט">
            <div className="relative">
              <Globe className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
              <input
                type="url"
                value={form.website ?? ''}
                onChange={e => update('website', e.target.value || null)}
                placeholder="https://your-site.com"
                dir="ltr"
                className={`${inputClass} pe-9`}
              />
            </div>
          </Field>
        </Section>

        {/* Social */}
        <Section title="רשתות חברתיות (אופציונלי)">
          <SocialField label="וואטסאפ עסקי" placeholder="https://wa.me/972..." value={form.whatsappUrl} onChange={v => update('whatsappUrl', v)} />
          <SocialField label="פייסבוק" placeholder="https://facebook.com/..." value={form.facebookUrl} onChange={v => update('facebookUrl', v)} />
          <SocialField label="אינסטגרם" placeholder="https://instagram.com/..." value={form.instagramUrl} onChange={v => update('instagramUrl', v)} />
          <SocialField label="טיקטוק" placeholder="https://tiktok.com/@..." value={form.tiktokUrl} onChange={v => update('tiktokUrl', v)} />
          <SocialField label="יוטיוב" placeholder="https://youtube.com/..." value={form.youtubeUrl} onChange={v => update('youtubeUrl', v)} />
          <SocialField label="לינקדאין" placeholder="https://linkedin.com/in/..." value={form.linkedinUrl} onChange={v => update('linkedinUrl', v)} />
        </Section>

        {/* Actions */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {form.id ? (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-error hover:bg-error/10 text-body-sm transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" />
              מחק את העסק שלי
            </button>
          ) : <span />}
          <button
            type="submit"
            disabled={saving || !!uploadingKey}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-on-primary text-body-md font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? 'שומר...' : (form.id ? 'עדכן' : 'פרסם')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────

const inputClass =
  'w-full px-3 py-2.5 rounded-lg border border-outline/30 bg-surface text-body-md focus:ring-2 focus:ring-primary/30 focus:outline-none';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h2 className="text-title-sm font-medium text-on-surface border-b border-outline/15 pb-1">{title}</h2>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-label-md text-on-surface-variant block mb-1">
        {label} {required && <span className="text-error">*</span>}
      </label>
      {children}
    </div>
  );
}

function SocialField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="url"
        value={value ?? ''}
        onChange={e => onChange(e.target.value || null)}
        placeholder={placeholder}
        dir="ltr"
        className={inputClass}
      />
    </Field>
  );
}

function ImageUpload({
  label,
  value,
  uploading,
  onClear,
  onPick,
  aspectClass = 'aspect-square w-24 h-24',
}: {
  label: string;
  value: string | null;
  uploading: boolean;
  onClear: () => void;
  onPick: () => void;
  aspectClass?: string;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-3">
        <div className={`${aspectClass} rounded-lg bg-surface-container overflow-hidden border border-outline/20 flex items-center justify-center flex-shrink-0`}>
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-on-surface-variant opacity-50" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onPick}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline/30 text-body-sm hover:bg-surface-container disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {uploading ? 'מעלה...' : (value ? 'החלף' : 'העלה')}
          </button>
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="text-label-sm text-error hover:underline"
            >
              הסר
            </button>
          )}
        </div>
      </div>
    </Field>
  );
}
