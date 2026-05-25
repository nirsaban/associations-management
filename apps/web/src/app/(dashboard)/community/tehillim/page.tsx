'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/lib/api';
import { BookOpen, Loader2, Check, Crown, Clock, AlertTriangle, Heart, Sparkles, X } from 'lucide-react';

type DedicationType =
  | 'BRIAUT' | 'HATZLACHA' | 'PARNASSA' | 'ZIVUG' | 'SIMCHA'
  | 'EXAM' | 'BUSINESS' | 'EMUNAH' | 'REFUAH' | 'NESHAMA';

const DEDICATION_LABELS: Record<DedicationType, string> = {
  BRIAUT: 'בריאות',
  HATZLACHA: 'הצלחה',
  PARNASSA: 'פרנסה',
  ZIVUG: 'זיווג הגון',
  SIMCHA: 'שמחה',
  EXAM: 'הצלחה במבחן',
  BUSINESS: 'הצלחה בעסקה',
  EMUNAH: 'אמונה',
  REFUAH: 'רפואה',
  NESHAMA: 'לעילוי נשמת',
};

const NAME_REQUIRED: DedicationType[] = ['REFUAH', 'NESHAMA'];

interface DedicationView {
  position: number;
  type: DedicationType;
  typeLabel: string;
  dedicateeName: string | null;
  motherName: string | null;
  dedicatorName: string;
  createdAt: string;
}

interface TomorrowState {
  chapter: number;
  date: string;
  isPriorityUser: boolean;
  myDedication: { position: number; type: DedicationType; dedicateeName: string | null; motherName: string | null } | null;
}

interface TodayResponse {
  exists: boolean;
  message?: string;
  id?: string;
  date?: string;
  chapter?: number;
  dedications?: DedicationView[];
  slotsLeft?: number;
  myDedication?: { position: number; type: DedicationType; dedicateeName: string | null; motherName: string | null } | null;
  myReading?: { readAt: string } | null;
  isPriorityUser?: boolean;
  canDedicate?: boolean;
  inGraceWindow?: boolean;
  gracePeriodEndsAt?: string;
  tomorrow?: TomorrowState | null;
}

interface ReadResponse {
  rank: number;
  eligibleForTomorrowDedication: boolean;
  tomorrow: { id: string; chapter: number; date: string; alreadyDedicated: boolean } | null;
}

interface SefariaResponse {
  he: string | string[];
}

function toHebrewNumeral(n: number): string {
  const ones = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const tens = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת'];

  if (n === 15) return 'טו';
  if (n === 16) return 'טז';

  const h = Math.floor(n / 100);
  const t = Math.floor((n % 100) / 10);
  const o = n % 10;

  let result = hundreds[h] || '';
  if (n % 100 === 15) return result + 'טו';
  if (n % 100 === 16) return result + 'טז';
  result += tens[t] || '';
  result += ones[o] || '';
  return result;
}

export default function TehillimPage() {
  const [today, setToday] = useState<TodayResponse | null>(null);
  const [verses, setVerses] = useState<string[]>([]);
  const [loadingDay, setLoadingDay] = useState(true);
  const [loadingVerses, setLoadingVerses] = useState(false);
  const [dedicateFor, setDedicateFor] = useState<null | { when: 'today' | 'tomorrow'; chapter: number }>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadingDay(true);
    setError(null);
    try {
      const res = await api.get<{ data: TodayResponse }>('/community/tehillim/today');
      setToday(res.data.data);
    } catch (err) {
      setError((err as Error).message || 'שגיאה בטעינת התהילים היומי');
    } finally {
      setLoadingDay(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!today?.chapter) return;
    setLoadingVerses(true);
    fetch(`https://www.sefaria.org/api/texts/Psalms.${today.chapter}?lang=he&context=0`)
      .then(r => r.json())
      .then((data: SefariaResponse) => {
        const heText = Array.isArray(data.he) ? data.he : [data.he];
        const cleaned = heText
          .filter(v => typeof v === 'string' && v.trim().length > 0)
          .map(v => v.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
        setVerses(cleaned);
      })
      .catch(() => setVerses([]))
      .finally(() => setLoadingVerses(false));
  }, [today?.chapter]);

  const confirmRead = async () => {
    setBusy(true);
    try {
      const res = await api.post<{ data: ReadResponse }>('/community/tehillim/read');
      await load();
      // אם המשתמש נכנס ל-3 הראשונים — נפתח מיד מודאל הקדשה למחר
      const r = res.data.data;
      if (r.eligibleForTomorrowDedication && r.tomorrow && !r.tomorrow.alreadyDedicated) {
        setDedicateFor({ when: 'tomorrow', chapter: r.tomorrow.chapter });
      }
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'שגיאה באישור הקריאה');
    } finally {
      setBusy(false);
    }
  };

  if (loadingDay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-8" dir="rtl">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!today?.exists) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-center" dir="rtl">
        <Clock className="h-12 w-12 text-on-surface-variant opacity-50 mb-3" />
        <h2 className="text-title-xl font-medium mb-2">התהילים היומי טרם נוצר</h2>
        <p className="text-body-md text-on-surface-variant max-w-sm">
          {today?.message || 'הוא ייווצר אוטומטית מחר בבוקר ב-10:00'}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-headline-sm font-headline">תהילים יומי · פרק {toHebrewNumeral(today.chapter!)}</h2>
            <p className="text-label-md text-on-surface-variant">
              {new Date(today.date!).toLocaleDateString('he-IL', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>
        </div>
        {today.isPriorityUser && (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 text-warning-strong text-label-sm">
            <Crown className="h-3.5 w-3.5" />
            עדיפות
          </span>
        )}
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-body-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Dedications panel */}
      <div className="rounded-2xl border border-outline/20 bg-surface-container-lowest overflow-hidden">
        <div className="px-4 py-3 border-b border-outline/15 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-body-md font-medium">הקדשות לפרק היום</span>
            <span className="text-label-sm text-on-surface-variant">
              ({today.dedications!.length}/3)
            </span>
          </div>
          {today.canDedicate && !today.myDedication && (
            <button
              onClick={() => setDedicateFor({ when: 'today', chapter: today.chapter! })}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:bg-primary/90"
            >
              <Heart className="h-3.5 w-3.5" />
              תפוס סלוט
            </button>
          )}
          {!today.canDedicate && !today.myDedication && today.slotsLeft! > 0 && today.inGraceWindow && (
            <span className="text-label-sm text-on-surface-variant flex items-center gap-1">
              <Clock className="h-3 w-3" />
              שעה ראשונה לבעלי עדיפות
            </span>
          )}
        </div>
        <div className="divide-y divide-outline/10">
          {today.dedications!.length === 0 && (
            <p className="px-4 py-6 text-center text-body-sm text-on-surface-variant">
              עדיין אין הקדשות להיום. היה הראשון לתפוס סלוט!
            </p>
          )}
          {today.dedications!.map(d => (
            <div key={d.position} className="px-4 py-3 flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-label-md font-bold flex-shrink-0">
                {d.position}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-body-md font-medium">{d.typeLabel}</span>
                  {d.dedicateeName && (
                    <span className="text-body-sm text-on-surface-variant">
                      · עבור <strong className="text-on-surface">{d.dedicateeName}</strong>
                      {d.motherName && <> בן/בת <strong className="text-on-surface">{d.motherName}</strong></>}
                    </span>
                  )}
                </div>
                <p className="text-label-sm text-on-surface-variant mt-0.5">הקדיש: {d.dedicatorName}</p>
              </div>
            </div>
          ))}
          {Array.from({ length: Math.max(0, 3 - today.dedications!.length) }).map((_, i) => (
            <div key={`empty-${i}`} className="px-4 py-3 flex items-center gap-3 opacity-50">
              <div className="w-7 h-7 rounded-full border-2 border-dashed border-outline/40 flex items-center justify-center text-label-md text-on-surface-variant flex-shrink-0">
                {today.dedications!.length + i + 1}
              </div>
              <span className="text-body-sm text-on-surface-variant">סלוט פתוח</span>
            </div>
          ))}
        </div>
      </div>

      {/* My dedication (if I have one) */}
      {today.myDedication && (
        <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center gap-2">
          <Check className="h-4 w-4 text-primary" />
          <p className="text-body-sm">
            <strong>תפסת סלוט #{today.myDedication.position}:</strong>{' '}
            {DEDICATION_LABELS[today.myDedication.type]}
            {today.myDedication.dedicateeName && (
              <> עבור {today.myDedication.dedicateeName}
                {today.myDedication.motherName && ` בן/בת ${today.myDedication.motherName}`}
              </>
            )}
          </p>
        </div>
      )}

      {/* Chapter text */}
      <div className="rounded-2xl bg-surface-container-lowest border border-outline/20 p-6 shadow-sm">
        {loadingVerses ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
          </div>
        ) : verses.length === 0 ? (
          <p className="text-center text-body-sm text-on-surface-variant">לא הצלחנו לטעון את הפרק</p>
        ) : (
          <div className="space-y-3 text-body-lg leading-loose" style={{ fontFamily: 'David, "Frank Ruhl Libre", serif' }}>
            {verses.map((v, i) => (
              <p key={i} className="text-on-surface">
                <span className="inline-block text-label-sm text-on-surface-variant align-super ms-1 me-2">
                  {toHebrewNumeral(i + 1)}
                </span>
                {v}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Read confirmation */}
      <div className="rounded-2xl bg-gradient-to-bl from-primary/5 to-transparent border border-primary/15 p-4">
        {today.myReading ? (
          <div className="flex items-center gap-2 text-primary">
            <Check className="h-5 w-5" />
            <div>
              <p className="text-body-md font-medium">סימנת שקראת היום</p>
              <p className="text-label-sm text-on-surface-variant">
                {new Date(today.myReading.readAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                {' · '}
                אם תהיה בין 3 הראשונים — תקבל עדיפות להקדיש מחר
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-body-md font-medium">סיימת לקרוא? תאשר.</p>
              <p className="text-label-sm text-on-surface-variant">
                3 הראשונים שיאשרו היום יקבלו עדיפות להקדשה מחר
              </p>
            </div>
            <button
              onClick={confirmRead}
              disabled={busy || verses.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              קראתי את הפרק
            </button>
          </div>
        )}
      </div>

      <p className="text-center text-label-md text-on-surface-variant pt-2">
        תהילים יומי — לעילוי נשמת הרב דויד עשור זצ״ל
      </p>

      {/* Tomorrow dedication banner — visible if user already dedicated for tomorrow */}
      {today.tomorrow?.myDedication && (
        <div className="rounded-xl bg-warning/5 border border-warning/30 p-3 flex items-start gap-3">
          <Crown className="h-5 w-5 text-warning-strong flex-shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-body-md font-medium text-on-surface">
              ההקדשה שלך למחר מוכנה
            </p>
            <p className="text-label-sm text-on-surface-variant">
              פרק {toHebrewNumeral(today.tomorrow.chapter)} ·{' '}
              {DEDICATION_LABELS[today.tomorrow.myDedication.type]}
              {today.tomorrow.myDedication.dedicateeName && (
                <> עבור <strong>{today.tomorrow.myDedication.dedicateeName}</strong>
                  {today.tomorrow.myDedication.motherName && <> בן/בת {today.tomorrow.myDedication.motherName}</>}
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Tomorrow dedication CTA — visible if priority and not yet dedicated */}
      {today.tomorrow?.isPriorityUser && !today.tomorrow.myDedication && (
        <div className="rounded-xl bg-warning/5 border border-warning/30 p-3 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-start gap-3 min-w-0">
            <Crown className="h-5 w-5 text-warning-strong flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-body-md font-medium">זכית בעדיפות למחר!</p>
              <p className="text-label-sm text-on-surface-variant">
                בחר את ההקדשה שלך לפרק {toHebrewNumeral(today.tomorrow.chapter)} של מחר
              </p>
            </div>
          </div>
          <button
            onClick={() => setDedicateFor({ when: 'tomorrow', chapter: today.tomorrow!.chapter })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-warning-strong text-white text-body-sm font-medium hover:opacity-90"
          >
            <Heart className="h-3.5 w-3.5" />
            הקדש למחר
          </button>
        </div>
      )}

      {/* Dedicate modal — supports both today and tomorrow */}
      {dedicateFor && (
        <DedicateModal
          when={dedicateFor.when}
          chapter={dedicateFor.chapter}
          onClose={() => setDedicateFor(null)}
          onDedicated={() => { setDedicateFor(null); load(); }}
        />
      )}
    </div>
  );
}

// ─── Dedicate Modal ──────────────────────────────────────────────

function DedicateModal({
  when,
  chapter,
  onClose,
  onDedicated,
}: {
  when: 'today' | 'tomorrow';
  chapter: number;
  onClose: () => void;
  onDedicated: () => void;
}) {
  const [type, setType] = useState<DedicationType>('BRIAUT');
  const [dedicateeName, setDedicateeName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initialFocus = useRef<HTMLSelectElement>(null);

  useEffect(() => { initialFocus.current?.focus(); }, []);

  const nameRequired = NAME_REQUIRED.includes(type);
  const isTomorrow = when === 'tomorrow';

  const submit = async () => {
    setError(null);
    if (nameRequired && dedicateeName.trim().length < 2) {
      setError('בברכת רפואה/נשמה — שם המוקדש חובה');
      return;
    }
    setSubmitting(true);
    try {
      await api.post(
        `/community/tehillim/dedicate?for=${when}`,
        {
          type,
          dedicateeName: dedicateeName.trim() || undefined,
          motherName: motherName.trim() || undefined,
        },
      );
      onDedicated();
    } catch (err) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'שגיאה בתפיסת הסלוט');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] flex flex-col" dir="rtl">
        <div className="flex items-center justify-between px-5 py-3 border-b border-outline/20">
          <div className="min-w-0">
            <h3 className="text-title-md font-headline">
              {isTomorrow ? 'זכית בעדיפות — הקדשת מחר' : 'הקדשת התהילים היומי'}
            </h3>
            <p className="text-label-sm text-on-surface-variant">
              פרק {chapter} · {isTomorrow ? 'יוקרא מחר ע״י הקהילה' : 'יוקרא היום ע״י הקהילה'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-container">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto p-5 space-y-3">
          {isTomorrow && (
            <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
              <Crown className="h-4 w-4 text-warning-strong flex-shrink-0 mt-0.5" />
              <p className="text-body-sm text-on-surface">
                סיימת לקרוא בין 3 הראשונים — קיבלת זכות להקדיש מראש את הפרק של מחר.
                ההקדשה תפורסם עם הפוש של 10:00 בבוקר.
              </p>
            </div>
          )}
          {error && (
            <div className="p-2 rounded-lg bg-error/10 text-error text-body-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {error}
            </div>
          )}

          <div>
            <label className="text-label-sm text-on-surface-variant block mb-1">
              סוג הברכה <span className="text-error">*</span>
            </label>
            <select
              ref={initialFocus}
              value={type}
              onChange={e => setType(e.target.value as DedicationType)}
              className="w-full px-3 py-2 rounded-lg border border-outline/30 text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            >
              {(Object.keys(DEDICATION_LABELS) as DedicationType[]).map(t => (
                <option key={t} value={t}>{DEDICATION_LABELS[t]}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-label-sm text-on-surface-variant block mb-1">
              שם המוקדש {nameRequired && <span className="text-error">*</span>}
              <span className="text-on-surface-variant"> (לדוגמה: יעקב)</span>
            </label>
            <input
              value={dedicateeName}
              onChange={e => setDedicateeName(e.target.value)}
              placeholder={nameRequired ? 'שם פרטי של המוקדש' : 'אופציונלי'}
              maxLength={120}
              className="w-full px-3 py-2 rounded-lg border border-outline/30 text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-label-sm text-on-surface-variant block mb-1">
              שם האם <span className="text-on-surface-variant">(לדוגמה: שרה)</span>
            </label>
            <input
              value={motherName}
              onChange={e => setMotherName(e.target.value)}
              placeholder="אופציונלי"
              maxLength={120}
              className="w-full px-3 py-2 rounded-lg border border-outline/30 text-body-sm focus:ring-2 focus:ring-primary/30 focus:outline-none"
            />
          </div>

          <p className="text-label-sm text-on-surface-variant pt-2">
            התהילים שייאמר {isTomorrow ? 'מחר' : 'היום'} ע״י הקהילה יוקדש לפי בחירתך.
          </p>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-outline/10">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-body-sm hover:bg-surface-container"
          >
            ביטול
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-on-primary text-body-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            <Heart className="h-4 w-4" />
            {submitting ? 'תופס...' : 'תפוס סלוט'}
          </button>
        </div>
      </div>
    </div>
  );
}
