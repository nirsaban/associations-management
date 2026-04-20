'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCreateOrganizationWithAdmin } from '@/hooks/usePlatform';
import { useToast } from '@/components/ui/Toast';
import { AxiosError } from 'axios';

function toKebab(name: string): string {
  // Simple transliteration for Hebrew
  const map: Record<string, string> = {
    'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v',
    'ז': 'z', 'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k',
    'ל': 'l', 'מ': 'm', 'ם': 'm', 'נ': 'n', 'ן': 'n', 'ס': 's',
    'ע': '', 'פ': 'p', 'ף': 'p', 'צ': 'tz', 'ץ': 'tz', 'ק': 'k',
    'ר': 'r', 'ש': 'sh', 'ת': 't',
  };
  return name
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

const PHONE_REGEX = /^05\d{8}$/;

export default function CreateOrganizationPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const createMutation = useCreateOrganizationWithAdmin();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [address, setAddress] = useState('');

  const [adminName, setAdminName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugTouched) {
      setSlug(toKebab(val));
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'שם העמותה נדרש';
    if (!slug.trim()) e.slug = 'Slug נדרש';
    else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(slug) && slug.length > 1)
      e.slug = 'Slug חייב להכיל אותיות באנגלית קטנות, מספרים ומקפים בלבד';
    if (!adminName.trim()) e.adminName = 'שם האדמין נדרש';
    if (!adminPhone.trim()) e.adminPhone = 'טלפון האדמין נדרש';
    else if (!PHONE_REGEX.test(adminPhone.replace(/[-\s]/g, '')))
      e.adminPhone = 'מספר טלפון ישראלי לא תקין (05XXXXXXXX)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;

    try {
      await createMutation.mutateAsync({
        organization: {
          name: name.trim(),
          slug: slug.trim(),
          contactPhone: contactPhone.trim() || undefined,
          contactEmail: contactEmail.trim() || undefined,
          address: address.trim() || undefined,
        },
        firstAdmin: {
          fullName: adminName.trim(),
          phone: adminPhone.replace(/[-\s]/g, '').trim(),
        },
      });
      showToast('עמותה נוצרה ואדמין ראשון נוסף', 'success');
      router.push('/platform/organizations');
    } catch (err) {
      const axiosErr = err as AxiosError<{ message?: string }>;
      if (axiosErr.response?.status === 409) {
        const msg = axiosErr.response.data?.message || '';
        if (msg.toLowerCase().includes('slug')) {
          setErrors((prev) => ({ ...prev, slug: 'Slug כבר תפוס, יש לבחור אחר' }));
        } else if (msg.toLowerCase().includes('phone')) {
          setErrors((prev) => ({
            ...prev,
            adminPhone: 'מספר טלפון זה כבר קיים בעמותה',
          }));
        } else {
          showToast('שגיאה: נתון כפול', 'error');
        }
      } else {
        showToast('שגיאה ביצירת העמותה', 'error');
      }
    }
  };

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/platform/organizations"
          className="text-label-md text-primary hover:underline"
        >
          &rarr; חזור לרשימה
        </Link>
      </div>

      <h2 className="text-headline-md font-headline mb-6">עמותה חדשה</h2>

      <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
        {/* Organization section */}
        <section>
          <h3 className="text-title-lg font-headline mb-4 text-primary">פרטי עמותה</h3>
          <div className="space-y-4">
            <Field
              label="שם העמותה"
              value={name}
              onChange={handleNameChange}
              error={errors.name}
              required
            />
            <Field
              label="Slug"
              value={slug}
              onChange={(v) => {
                setSlugTouched(true);
                setSlug(v);
              }}
              error={errors.slug}
              required
              dir="ltr"
              placeholder="e.g. my-organization"
            />
            <Field
              label="טלפון ליצירת קשר"
              value={contactPhone}
              onChange={setContactPhone}
              dir="ltr"
              placeholder="05XXXXXXXX"
            />
            <Field
              label="אימייל ליצירת קשר"
              value={contactEmail}
              onChange={setContactEmail}
              dir="ltr"
              type="email"
              placeholder="info@example.org"
            />
            <Field
              label="כתובת"
              value={address}
              onChange={setAddress}
            />
          </div>
        </section>

        {/* Admin section */}
        <section>
          <h3 className="text-title-lg font-headline mb-4 text-primary">אדמין ראשון</h3>
          <div className="space-y-4">
            <Field
              label="שם מלא"
              value={adminName}
              onChange={setAdminName}
              error={errors.adminName}
              required
            />
            <Field
              label="טלפון"
              value={adminPhone}
              onChange={setAdminPhone}
              error={errors.adminPhone}
              required
              dir="ltr"
              placeholder="05XXXXXXXX"
            />
          </div>
        </section>

        {/* Submit */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 pt-2">
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="bg-primary text-on-primary px-6 py-2.5 rounded-lg text-label-md hover:bg-primary-container transition-colors disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin" />
                יוצר...
              </span>
            ) : (
              'צור עמותה'
            )}
          </button>
          <Link
            href="/platform/organizations"
            className="text-label-md text-on-surface-variant hover:text-on-surface text-center sm:text-start"
          >
            ביטול
          </Link>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  required,
  dir,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  dir?: 'ltr' | 'rtl';
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-label-md text-on-surface mb-1">
        {label}
        {required && <span className="text-error me-1">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        dir={dir}
        placeholder={placeholder}
        className={`w-full rounded-lg border px-3 py-2 text-body-md bg-surface-container-lowest outline-none transition-colors
          ${
            error
              ? 'border-error focus:border-error'
              : 'border-outline-variant focus:border-primary'
          }`}
      />
      {error && <p className="text-label-sm text-error mt-1">{error}</p>}
    </div>
  );
}
