'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Bell, BellRing, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import { isPushSupported, subscribeToPush, isAlreadySubscribed } from '@/lib/push-notifications';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Alert {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  audience: string;
}

interface AlertsListProps {
  limit?: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function relativeDate(date: string): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'היום';
  if (diffDays === 1) return 'אתמול';
  if (diffDays < 7) return `לפני ${diffDays} ימים`;
  return format(d, 'd בMMMM yyyy', { locale: he });
}

// ─── Single alert card ────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);
  const isManagerAudience = alert.audience === 'GROUP_MANAGERS';
  const isLong = alert.body.length > 120;

  return (
    <div className="card-elevated py-4 px-5">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-title-sm font-medium leading-snug flex-1">{alert.title}</p>
        {isManagerAudience && (
          <span className="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
            למנהלי קבוצה
          </span>
        )}
      </div>

      <p
        className={`text-body-sm text-on-surface-variant leading-relaxed ${
          !expanded ? 'line-clamp-3' : ''
        }`}
      >
        {alert.body}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-body-sm text-primary flex items-center gap-1"
          aria-label={expanded ? 'הסתר' : 'קרא עוד'}
        >
          {expanded ? (
            <>
              הסתר <ChevronUp className="h-3.5 w-3.5" />
            </>
          ) : (
            <>
              קרא עוד <ChevronDown className="h-3.5 w-3.5" />
            </>
          )}
        </button>
      )}

      <p className="mt-2 text-label-sm text-on-surface-variant/70">
        {relativeDate(alert.publishedAt)}
      </p>
    </div>
  );
}

// ─── Push Subscribe Banner ───────────────────────────────────────────────────

function PushSubscribeBanner() {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<'idle' | 'subscribing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function check() {
      if (!isPushSupported()) return;
      if (Notification.permission === 'denied') return;
      const subscribed = await isAlreadySubscribed();
      if (!subscribed) setVisible(true);
    }
    check();
  }, []);

  const handleSubscribe = useCallback(async () => {
    setStatus('subscribing');
    setErrorMsg(null);
    try {
      await subscribeToPush();
      setStatus('done');
      setTimeout(() => setVisible(false), 2000);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message === 'PERMISSION_DENIED') {
        setErrorMsg('ההתראות נחסמו בדפדפן. יש לאפשר התראות בהגדרות.');
      } else {
        setErrorMsg('שגיאה בהפעלת התראות. נסה שוב.');
      }
      setStatus('error');
    }
  }, []);

  if (!visible) return null;

  if (status === 'done') {
    return (
      <div className="rounded-xl bg-success-container text-on-success-container px-5 py-4 flex items-center gap-3 mb-4 animate-fade-in">
        <BellRing className="h-5 w-5 shrink-0" />
        <span className="text-body-md font-medium">התראות הופעלו בהצלחה!</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-full bg-amber-100 shrink-0 mt-0.5">
          <BellRing className="h-5 w-5 text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-title-sm font-medium text-amber-900">
            לא תפספס/י עדכונים חשובים
          </p>
          <p className="text-body-sm text-amber-700 mt-1">
            הפעל/י התראות כדי לקבל עדכונים על חלוקות, תשלומים והודעות חדשות.
          </p>
          {errorMsg && (
            <p className="text-body-sm text-red-600 mt-1">{errorMsg}</p>
          )}
          <button
            onClick={handleSubscribe}
            disabled={status === 'subscribing'}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-body-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
          >
            <Bell className="h-4 w-4" />
            {status === 'subscribing' ? 'מפעיל...' : 'הפעל התראות'}
          </button>
        </div>
        <button
          onClick={() => setVisible(false)}
          className="shrink-0 text-amber-400 hover:text-amber-600 transition-colors p-1"
          aria-label="סגור"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ─── AlertsList ───────────────────────────────────────────────────────────────

export function AlertsList({ limit = 5 }: AlertsListProps) {
  const { data: alerts, isLoading, isError } = useQuery({
    queryKey: ['my-alerts', limit],
    queryFn: async () => {
      const res = await api.get<{ data: Alert[] }>(`/me/alerts?limit=${limit}`);
      return res.data.data;
    },
  });

  return (
    <section aria-labelledby="alerts-list-heading">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5 text-on-surface-variant" />
        <h2 id="alerts-list-heading" className="text-title-lg font-medium text-on-surface">
          התראות אחרונות
        </h2>
      </div>

      <PushSubscribeBanner />

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: Math.min(limit, 3) }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-lg bg-surface-container h-24" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-lg bg-error-container text-on-error-container px-5 py-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-body-md">שגיאה בטעינת ההתראות</span>
        </div>
      ) : !alerts || alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-3 text-on-surface-variant">
          <Bell className="h-10 w-10 opacity-30" />
          <p className="text-body-md">אין התראות חדשות כרגע</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </section>
  );
}
