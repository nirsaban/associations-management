'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, AlertCircle } from 'lucide-react';
import api from '@/lib/api';
import { API_ROUTES } from '@/lib/constants';
import { COMMUNITY_PROFESSIONS_ENABLED } from '@/lib/feature-flags';
import {
  ProfessionTypeahead,
  type ProfessionOption,
} from '@/components/profession-typeahead';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserProfile {
  id: string;
  shortBio?: string;
  primaryProfession?: ProfessionOption;
  secondaryProfessions?: ProfessionOption[];
  otherProfession?: string;
  showInCommunitySearch?: boolean;
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ---------------------------------------------------------------------------
// Tiny hook: section-level save status
// ---------------------------------------------------------------------------

function useSaveState(): [SaveState, (fn: () => Promise<void>) => void] {
  const [state, setState] = useState<SaveState>('idle');

  const trigger = (fn: () => Promise<void>) => {
    setState('saving');
    fn()
      .then(() => {
        setState('saved');
        setTimeout(() => setState('idle'), 2000);
      })
      .catch(() => setState('error'));
  };

  return [state, trigger];
}

// ---------------------------------------------------------------------------
// Save button component
// ---------------------------------------------------------------------------

function SaveButton({ state, label = 'שמור' }: { state: SaveState; label?: string }) {
  if (state === 'saved') {
    return (
      <button
        type="button"
        disabled
        className="px-4 py-2 rounded-lg bg-success/15 text-success text-label-md font-medium"
      >
        נשמר ✓
      </button>
    );
  }
  return (
    <button
      type="submit"
      disabled={state === 'saving'}
      className="px-4 py-2 rounded-lg bg-primary text-on-primary text-label-md font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
    >
      {state === 'saving' ? 'שומר...' : label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ProfileEditPage() {
  const router = useRouter();

  // Redirect to /profile if feature is off
  useEffect(() => {
    if (!COMMUNITY_PROFESSIONS_ENABLED) {
      router.replace('/profile');
    }
  }, [router]);

  const { data: profile, isLoading, error: loadError } = useQuery({
    queryKey: ['profile-edit'],
    queryFn: async () => {
      const res = await api.get<{ data: UserProfile }>(API_ROUTES.USERS.ME);
      return res.data.data;
    },
  });

  // Section 1: Bio
  const [bio, setBio] = useState('');
  const [bioSaveState, triggerBioSave] = useSaveState();
  const [bioError, setBioError] = useState<string | null>(null);

  // Section 2: Professions
  const [primary, setPrimary] = useState<ProfessionOption | null>(null);
  const [secondary, setSecondary] = useState<ProfessionOption[]>([]);
  const [otherProfession, setOtherProfession] = useState('');
  const [showOther, setShowOther] = useState(false);
  const [profSaveState, triggerProfSave] = useSaveState();
  const [profError, setProfError] = useState<string | null>(null);

  // Section 3: Privacy
  const [showInSearch, setShowInSearch] = useState(true);
  const [privSaveState, triggerPrivSave] = useSaveState();
  const [privError, setPrivError] = useState<string | null>(null);

  // Populate form once profile loads
  useEffect(() => {
    if (!profile) return;
    setBio(profile.shortBio ?? '');
    setPrimary(profile.primaryProfession ?? null);
    setSecondary(profile.secondaryProfessions ?? []);
    setOtherProfession(profile.otherProfession ?? '');
    setShowOther(!!profile.otherProfession);
    setShowInSearch(profile.showInCommunitySearch !== false);
  }, [profile]);

  if (!COMMUNITY_PROFESSIONS_ENABLED) {
    return null; // will redirect
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-2xl">
        <div className="h-10 w-48 rounded-lg bg-surface-container animate-pulse" />
        <div className="card-elevated h-48 animate-pulse bg-surface-container" />
        <div className="card-elevated h-48 animate-pulse bg-surface-container" />
        <div className="card-elevated h-32 animate-pulse bg-surface-container" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הפרופיל</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-2xl" dir="rtl">
      {/* Back link */}
      <div>
        <Link
          href="/profile"
          className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <ArrowRight className="h-4 w-4" />
          חזרה לפרופיל
        </Link>
        <h1 className="text-headline-md font-headline mt-3">עריכת פרופיל</h1>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Section 1: Bio                                                      */}
      {/* ------------------------------------------------------------------ */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setBioError(null);
          triggerBioSave(async () => {
            try {
              await api.put('/users/me/bio', { shortBio: bio.trim() });
            } catch {
              setBioError('שמירה נכשלה, נסה שוב');
              throw new Error('save failed');
            }
          });
        }}
        className="card-elevated space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-title-md font-medium">ביוגרפיה קצרה</h2>
          <SaveButton state={bioSaveState} />
        </div>

        <div className="space-y-1.5">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 280))}
            rows={4}
            placeholder="ספר/י קצת על עצמך..."
            className="w-full rounded-lg border border-outline bg-surface px-3 py-2.5 text-body-md text-right placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            dir="rtl"
            maxLength={280}
          />
          <p className="text-label-sm text-on-surface-variant text-end">{bio.length}/280</p>
        </div>

        {bioSaveState === 'error' && (
          <p className="text-body-sm text-error">{bioError || 'שמירה נכשלה, נסה שוב'}</p>
        )}
      </form>

      {/* ------------------------------------------------------------------ */}
      {/* Section 2: Professions                                              */}
      {/* ------------------------------------------------------------------ */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!primary) return;
          setProfError(null);
          triggerProfSave(async () => {
            try {
              await api.put('/users/me/professions', {
                primary: primary.id,
                secondary: secondary.map((p) => p.id),
                otherProfession: otherProfession.trim() || undefined,
              });
            } catch {
              setProfError('שמירה נכשלה, נסה שוב');
              throw new Error('save failed');
            }
          });
        }}
        className="card-elevated space-y-5"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-title-md font-medium">מקצועות</h2>
          <SaveButton state={profSaveState} />
        </div>

        {/* Primary */}
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

        {/* Secondary */}
        <div className="space-y-1.5">
          <label className="block text-label-md font-medium text-on-surface">
            מקצועות נוספים{' '}
            <span className="text-on-surface-variant font-normal">(אופציונלי, עד 3)</span>
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

        {/* Other */}
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
            <label className="block text-label-md font-medium text-on-surface">מקצוע אחר</label>
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

        {profSaveState === 'error' && (
          <p className="text-body-sm text-error">{profError || 'שמירה נכשלה, נסה שוב'}</p>
        )}
      </form>

      {/* ------------------------------------------------------------------ */}
      {/* Section 3: Privacy                                                  */}
      {/* ------------------------------------------------------------------ */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPrivError(null);
          triggerPrivSave(async () => {
            try {
              await api.put('/users/me/privacy', { showInCommunitySearch: showInSearch });
            } catch {
              setPrivError('שמירה נכשלה, נסה שוב');
              throw new Error('save failed');
            }
          });
        }}
        className="card-elevated space-y-4"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-title-md font-medium">פרטיות</h2>
          <SaveButton state={privSaveState} />
        </div>

        <label className="flex items-center justify-between gap-4 cursor-pointer p-4 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors">
          <div>
            <p className="text-body-md font-medium">אפשר לי להופיע בחיפוש הקהילה</p>
            <p className="text-body-sm text-on-surface-variant mt-0.5">
              חברים אחרים יוכלו למצוא אותך לפי שם ומקצוע
            </p>
          </div>
          {/* Toggle switch */}
          <button
            type="button"
            role="switch"
            aria-checked={showInSearch}
            onClick={() => setShowInSearch(!showInSearch)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
              showInSearch ? 'bg-primary' : 'bg-on-surface/20'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                showInSearch ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </label>

        {privSaveState === 'error' && (
          <p className="text-body-sm text-error">{privError || 'שמירה נכשלה, נסה שוב'}</p>
        )}
      </form>
    </div>
  );
}
