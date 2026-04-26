'use client';

import React, { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, Upload, Trash2, Building2, Palette, FileText, CreditCard, Phone } from 'lucide-react';
import api from '@/lib/api';
import { useToast } from '@/components/ui/Toast';

interface OrgProfile {
  id: string;
  name: string;
  slug: string;
  legalName?: string;
  taxId?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
  addressLine2?: string;
  city?: string;
  postalCode?: string;
  country: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor: string;
  aboutShort?: string;
  aboutLong?: string;
  description?: string;
  paymentLink?: string;
  defaultPaymentLink?: string;
  paymentDescription?: string;
  growUserId?: string;
  growPageCode?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappUrl?: string;
  websiteUrl?: string;
}

export default function OrgProfilePage() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading } = useQuery<OrgProfile>({
    queryKey: ['org-profile'],
    queryFn: async () => {
      const res = await api.get('/organization/profile');
      return res.data.data;
    },
  });

  const [form, setForm] = useState<Partial<OrgProfile>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize form when profile loads
  React.useEffect(() => {
    if (profile && !isDirty) {
      setForm(profile);
    }
  }, [profile, isDirty]);

  const updateField = useCallback((field: keyof OrgProfile, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<OrgProfile>) => {
      const res = await api.patch('/organization/profile', data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-profile'] });
      queryClient.invalidateQueries({ queryKey: ['org-public-profile'] });
      setIsDirty(false);
      showToast('הפרופיל עודכן בהצלחה', 'success');
    },
    onError: () => {
      showToast('שגיאה בשמירת הפרופיל', 'error');
    },
  });

  const logoUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/organization/profile/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-profile'] });
      queryClient.invalidateQueries({ queryKey: ['org-public-profile'] });
      showToast('הלוגו הועלה בהצלחה', 'success');
    },
    onError: () => {
      showToast('שגיאה בהעלאת הלוגו', 'error');
    },
  });

  const logoRemoveMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/organization/profile/logo');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-profile'] });
      queryClient.invalidateQueries({ queryKey: ['org-public-profile'] });
      showToast('הלוגו הוסר', 'success');
    },
  });

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      showToast('הקובץ גדול מ-2MB', 'error');
      return;
    }
    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) {
      showToast('יש להעלות קובץ תמונה (PNG, JPG, SVG, WebP)', 'error');
      return;
    }
    logoUploadMutation.mutate(file);
  };

  const handleSave = () => {
    const { id, slug, logoUrl, ...updateData } = form;
    saveMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-md font-headline">פרופיל העמותה</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">עדכון פרטי העמותה, מיתוג ופרטי קשר</p>
        </div>
        <button
          onClick={handleSave}
          disabled={!isDirty || saveMutation.isPending}
          className="flex items-center gap-2 px-6 py-2.5 bg-primary text-on-primary rounded-lg disabled:opacity-50 transition-colors hover:bg-primary/90"
        >
          <Save className="h-4 w-4" />
          {saveMutation.isPending ? 'שומר...' : 'שמור שינויים'}
        </button>
      </div>

      <div className="space-y-8">
        {/* Identity Section */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building2 className="h-5 w-5 text-primary" />
            <h2 className="text-title-md font-headline">זהות העמותה</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="שם העמותה" value={form.name || ''} onChange={v => updateField('name', v)} />
            <FormField label="שם משפטי" value={form.legalName || ''} onChange={v => updateField('legalName', v)} placeholder="שם רשמי לפי רשם העמותות" />
            <FormField label='ח.פ / עוסק מורשה' value={form.taxId || ''} onChange={v => updateField('taxId', v)} />
            <div className="md:col-span-2">
              <FormField label="תיאור קצר" value={form.aboutShort || ''} onChange={v => updateField('aboutShort', v)} maxLength={280} />
            </div>
            <div className="md:col-span-2">
              <FormTextarea label="אודות" value={form.aboutLong || ''} onChange={v => updateField('aboutLong', v)} rows={4} />
            </div>
          </div>
        </section>

        {/* Contact & Address Section */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Phone className="h-5 w-5 text-primary" />
            <h2 className="text-title-md font-headline">פרטי קשר וכתובת</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="אימייל" value={form.contactEmail || ''} onChange={v => updateField('contactEmail', v)} type="email" />
            <FormField label="טלפון" value={form.contactPhone || ''} onChange={v => updateField('contactPhone', v)} type="tel" />
            <div className="md:col-span-2">
              <FormField label="כתובת" value={form.address || ''} onChange={v => updateField('address', v)} />
            </div>
            <FormField label="כתובת שורה 2" value={form.addressLine2 || ''} onChange={v => updateField('addressLine2', v)} />
            <FormField label="עיר" value={form.city || ''} onChange={v => updateField('city', v)} />
            <FormField label="מיקוד" value={form.postalCode || ''} onChange={v => updateField('postalCode', v)} />
            <FormField label="קישור לפייסבוק" value={form.facebookUrl || ''} onChange={v => updateField('facebookUrl', v)} />
            <FormField label="קישור לאינסטגרם" value={form.instagramUrl || ''} onChange={v => updateField('instagramUrl', v)} />
            <FormField label="קישור לווצאפ" value={form.whatsappUrl || ''} onChange={v => updateField('whatsappUrl', v)} />
            <FormField label="קישור לאתר" value={form.websiteUrl || ''} onChange={v => updateField('websiteUrl', v)} />
          </div>
        </section>

        {/* Branding Section */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className="h-5 w-5 text-primary" />
            <h2 className="text-title-md font-headline">מיתוג</h2>
          </div>

          {/* Logo */}
          <div className="mb-6">
            <label className="text-label-md text-on-surface mb-2 block">לוגו</label>
            <div className="flex items-center gap-4">
              <div
                className="w-24 h-24 rounded-xl border-2 border-dashed border-outline/30 flex items-center justify-center overflow-hidden bg-surface-container cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {form.logoUrl ? (
                  <img src={form.logoUrl} alt="לוגו" className="w-full h-full object-contain p-1" />
                ) : (
                  <Upload className="h-8 w-8 text-on-surface-variant" />
                )}
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-body-sm text-primary hover:underline"
                  disabled={logoUploadMutation.isPending}
                >
                  {logoUploadMutation.isPending ? 'מעלה...' : 'העלאת לוגו'}
                </button>
                {form.logoUrl && (
                  <button
                    onClick={() => logoRemoveMutation.mutate()}
                    className="flex items-center gap-1 text-body-sm text-error hover:underline"
                    disabled={logoRemoveMutation.isPending}
                  >
                    <Trash2 className="h-3 w-3" />
                    הסרת לוגו
                  </button>
                )}
                <p className="text-body-sm text-on-surface-variant">PNG, JPG, SVG או WebP. עד 2MB.</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                className="hidden"
                onChange={handleLogoUpload}
              />
            </div>
          </div>

          {/* Colors */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ColorPicker
              label="צבע ראשי"
              value={form.primaryColor || '#2563eb'}
              onChange={v => updateField('primaryColor', v)}
            />
            <ColorPicker
              label="צבע משני"
              value={form.accentColor || '#f59e0b'}
              onChange={v => updateField('accentColor', v)}
            />
          </div>

          {/* Preview */}
          <div className="mt-6 p-4 rounded-lg border border-outline/20">
            <p className="text-label-sm text-on-surface-variant mb-3">תצוגה מקדימה</p>
            <div className="flex items-center gap-4">
              {form.logoUrl && (
                <img src={form.logoUrl} alt="" className="w-10 h-10 rounded-lg object-contain" />
              )}
              <span className="text-title-md" style={{ color: form.primaryColor }}>{form.name || 'שם העמותה'}</span>
              <span className="px-3 py-1 rounded-full text-body-sm text-white" style={{ backgroundColor: form.accentColor }}>
                לדוגמה
              </span>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-5 w-5 text-primary" />
            <h2 className="text-title-md font-headline">תיאור</h2>
          </div>
          <FormTextarea label="תיאור כללי" value={form.description || ''} onChange={v => updateField('description', v)} rows={3} />
        </section>

        {/* Payment Link Section */}
        <section className="bg-surface-container-lowest rounded-xl border border-outline/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-title-md font-headline">קישור תשלום</h2>
          </div>
          <div className="space-y-4">
            <FormField label="קישור תשלום ברירת מחדל" value={form.defaultPaymentLink || ''} onChange={v => updateField('defaultPaymentLink', v)} placeholder="https://..." />
            <FormField label="קישור תשלום (קיים)" value={form.paymentLink || ''} onChange={v => updateField('paymentLink', v)} placeholder="https://..." />
            <FormTextarea label="תיאור מטרת התרומה" value={form.paymentDescription || ''} onChange={v => updateField('paymentDescription', v)} rows={2} />
            <div className="border-t border-outline/10 pt-4 mt-4">
              <p className="text-label-sm text-on-surface-variant mb-3 font-medium">Grow Wallet SDK (סליקה מתקדמת)</p>
              <div className="space-y-4">
                <FormField label="Grow User ID" value={form.growUserId || ''} onChange={v => updateField('growUserId', v)} placeholder="4ec1d595ae764243" />
                <FormField label="Grow Page Code (Wallet)" value={form.growPageCode || ''} onChange={v => updateField('growPageCode', v)} placeholder="c34d1f4a546f" />
              </div>
              <p className="text-[11px] text-on-surface-variant mt-2">כאשר מוגדר, דף הנחיתה ישתמש ב-Grow Wallet SDK לסליקה ישירה במקום הפניה לדף חיצוני.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Sticky save bar on mobile */}
      {isDirty && (
        <div className="md:hidden fixed bottom-16 inset-x-0 p-4 bg-surface-container-low border-t border-outline/30 z-30">
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary text-on-primary rounded-lg disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saveMutation.isPending ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Form Components ──────────────────────────────────────────────────────

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  maxLength,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
        dir="auto"
      />
      {maxLength && (
        <p className="text-[11px] text-on-surface-variant mt-0.5 text-start">{value.length}/{maxLength}</p>
      )}
    </div>
  );
}

function FormTextarea({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1">{label}</label>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg border border-outline/30 bg-surface text-body-md focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors resize-y"
        dir="auto"
      />
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-label-sm text-on-surface-variant block mb-1">{label}</label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-outline/30 cursor-pointer p-0.5"
        />
        <input
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg border border-outline/30 bg-surface text-body-md font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
          dir="ltr"
          pattern="^#[0-9a-fA-F]{6}$"
        />
      </div>
    </div>
  );
}
