'use client';

import React, { useState } from 'react';
import { Bell, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';

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
