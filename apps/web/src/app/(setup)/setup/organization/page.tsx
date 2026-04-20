'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

type OrgData = {
  name: string;
  address: string;
  logoUrl: string;
  description: string;
  paymentLink: string;
  paymentDescription: string;
  contactPhone: string;
  contactEmail: string;
  facebookUrl: string;
  instagramUrl: string;
  whatsappUrl: string;
  websiteUrl: string;
  setupCompleted: boolean;
};

type Step = 1 | 2 | 3;

function StepIndicator({ current }: { current: Step }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-8">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center text-body-md font-medium transition-colors ${
              step === current
                ? 'bg-primary text-on-primary'
                : step < current
                ? 'bg-primary/20 text-primary'
                : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {step < current ? '✓' : step}
          </div>
          {step < 3 && (
            <div
              className={`w-12 h-0.5 ${
                step < current ? 'bg-primary' : 'bg-outline/30'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingWizard() {
  const router = useRouter();
  const { logout } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, setAdminPhone] = useState('');

  // Form state
  const [form, setForm] = useState<OrgData>({
    name: '',
    address: '',
    logoUrl: '',
    description: '',
    paymentLink: '',
    paymentDescription: '',
    contactPhone: '',
    contactEmail: '',
    facebookUrl: '',
    instagramUrl: '',
    whatsappUrl: '',
    websiteUrl: '',
    setupCompleted: false,
  });

  // Load existing org data for prefill + detect current step
  useEffect(() => {
    const loadOrg = async () => {
      try {
        const res = await api.get('/organization/me');
        const org = res.data.data;

        if (org.setupCompleted) {
          router.replace('/admin');
          return;
        }

        setForm({
          name: org.name || '',
          address: org.address || '',
          logoUrl: org.logoUrl || '',
          description: org.description || '',
          paymentLink: org.paymentLink || '',
          paymentDescription: org.paymentDescription || '',
          contactPhone: org.phone || '',
          contactEmail: org.email || '',
          facebookUrl: org.facebookUrl || '',
          instagramUrl: org.instagramUrl || '',
          whatsappUrl: org.whatsappUrl || '',
          websiteUrl: org.websiteUrl || '',
          setupCompleted: false,
        });

        // Detect which step to resume at
        if (org.paymentLink) {
          setStep(3);
        } else if (org.name && org.address) {
          setStep(2);
        } else {
          setStep(1);
        }

        // Get admin phone for prefill on step 3
        const meRes = await api.get('/auth/me');
        const me = meRes.data.data || meRes.data;
        setAdminPhone(me.phone || '');
        if (!org.phone && me.phone) {
          setForm((prev) => ({ ...prev, contactPhone: me.phone }));
        }
      } catch {
        // If we can't load, proceed with empty form
      } finally {
        setIsLoading(false);
      }
    };
    loadOrg();
  }, []);

  const handleSaveStep1 = async () => {
    if (!form.name.trim()) {
      setError('שם העמותה הוא שדה חובה');
      return;
    }
    if (!form.address.trim()) {
      setError('כתובת העמותה היא שדה חובה');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await api.patch('/organization/me/onboarding/step-1', {
        name: form.name.trim(),
        address: form.address.trim(),
        logoUrl: form.logoUrl.trim() || undefined,
        description: form.description.trim() || undefined,
      });
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStep2 = async () => {
    if (!form.paymentLink.trim()) {
      setError('קישור לתרומות הוא שדה חובה');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await api.patch('/organization/me/onboarding/step-2', {
        paymentLink: form.paymentLink.trim(),
        paymentDescription: form.paymentDescription.trim() || undefined,
      });
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStep3 = async () => {
    const hasContact = form.contactPhone || form.contactEmail || form.facebookUrl ||
      form.instagramUrl || form.whatsappUrl || form.websiteUrl;
    if (!hasContact) {
      setError('יש למלא לפחות אמצעי קשר אחד');
      return;
    }
    setError(null);
    setIsSaving(true);
    try {
      await api.patch('/organization/me/onboarding/step-3', {
        contactPhone: form.contactPhone.trim() || undefined,
        contactEmail: form.contactEmail.trim() || undefined,
        facebookUrl: form.facebookUrl.trim() || undefined,
        instagramUrl: form.instagramUrl.trim() || undefined,
        whatsappUrl: form.whatsappUrl.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
      });
      router.replace('/admin/csv-import');
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בשמירה');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-start sm:items-center justify-center px-4 py-6 sm:py-8" dir="rtl">
      <div className="max-w-2xl w-full">
        <div className="flex justify-end mb-4">
          <button
            onClick={logout}
            className="px-4 py-2 rounded-lg text-body-sm text-error hover:bg-error/10 transition-colors"
          >
            התנתק
          </button>
        </div>
        <StepIndicator current={step} />

        <div className="bg-surface-container-low rounded-2xl shadow-md p-4 sm:p-6 lg:p-8">
          {/* Step 1 — Organization */}
          {step === 1 && (
            <>
              <h2 className="text-headline-sm font-headline mb-6">פרטי העמותה</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-label-md mb-1">שם העמותה *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="לדוגמה: עמותת חסד ואהבה"
                  />
                </div>

                <div>
                  <label className="block text-label-md mb-1">כתובת *</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="רחוב, עיר"
                  />
                </div>

                <div>
                  <label className="block text-label-md mb-1">קישור ללוגו (אופציונלי)</label>
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-label-md mb-1">תיאור העמותה (אופציונלי)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary resize-none"
                    rows={3}
                    placeholder="ספרו על העמותה בכמה מילים..."
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 2 — Payment */}
          {step === 2 && (
            <>
              <h2 className="text-headline-sm font-headline mb-6">פרטי תרומה</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-label-md mb-1">קישור לדף תרומות *</label>
                  <input
                    type="url"
                    value={form.paymentLink}
                    onChange={(e) => setForm({ ...form, paymentLink: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="https://paybox.co.il/..."
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-label-md mb-1">תיאור מטרת התרומה (אופציונלי)</label>
                  <textarea
                    value={form.paymentDescription}
                    onChange={(e) => setForm({ ...form, paymentDescription: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary resize-none"
                    rows={3}
                    placeholder="למה משמשת התרומה?"
                  />
                </div>
              </div>
            </>
          )}

          {/* Step 3 — Contact */}
          {step === 3 && (
            <>
              <h2 className="text-headline-sm font-headline mb-6">פרטי קשר</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-label-md mb-1">טלפון ליצירת קשר</label>
                  <input
                    type="tel"
                    value={form.contactPhone}
                    onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="05XXXXXXXX"
                    dir="ltr"
                  />
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    ניתן להשאיר את מספר הטלפון שלך או להזין מספר אחר לפניות תורמים
                  </p>
                </div>

                <div>
                  <label className="block text-label-md mb-1">אימייל ליצירת קשר</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="info@org.co.il"
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-label-md mb-1">פייסבוק</label>
                  <input
                    type="url"
                    value={form.facebookUrl}
                    onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="https://facebook.com/..."
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-label-md mb-1">אינסטגרם</label>
                  <input
                    type="url"
                    value={form.instagramUrl}
                    onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="https://instagram.com/..."
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-label-md mb-1">ווצאפ</label>
                  <input
                    type="url"
                    value={form.whatsappUrl}
                    onChange={(e) => setForm({ ...form, whatsappUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="https://wa.me/..."
                    dir="ltr"
                  />
                </div>

                <div>
                  <label className="block text-label-md mb-1">אתר אינטרנט</label>
                  <input
                    type="url"
                    value={form.websiteUrl}
                    onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })}
                    className="w-full px-4 py-3 border border-outline/30 rounded-lg bg-surface text-body-md focus:outline-none focus:border-primary"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>

                <p className="text-body-sm text-on-surface-variant">
                  * יש למלא לפחות אמצעי קשר אחד
                </p>
              </div>
            </>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              {error}
            </div>
          )}

          {/* Navigation */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-outline/20">
            {step > 1 ? (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="px-6 py-2.5 rounded-lg text-body-md text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                חזור
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <button
              onClick={
                step === 1
                  ? handleSaveStep1
                  : step === 2
                  ? handleSaveStep2
                  : handleSaveStep3
              }
              disabled={isSaving}
              className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-body-md font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isSaving ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                  שומר...
                </span>
              ) : step === 3 ? (
                'סיום והמשך'
              ) : (
                'שמור והמשך'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
