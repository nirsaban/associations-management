'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  ShoppingCart,
  Truck,
  CheckCircle2,
  AlertCircle,
  Bell,
  ChevronDown,
  ChevronUp,
  Building2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WeeklyStatusData {
  weekStart: string;
  families: unknown[];
  ordersFilledCount: number;
  ordersTotalCount: number;
  ordersAllFilled: boolean;
  distributor: {
    assigned: boolean;
    userId?: string;
    fullName?: string;
    phone?: string;
  };
  lastThreeDistributors: Array<{ userId: string; fullName: string }>;
}

interface DonationInfoData {
  paymentLink: string;
  paymentDescription: string;
  organizationName: string;
  organizationLogoUrl?: string;
}

interface PaymentStatusData {
  isPaid: boolean;
  monthKey: string;
  paidAt?: string;
}

interface Alert {
  id: string;
  title: string;
  body: string;
  publishedAt: string;
  audience: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFirstName(fullName?: string): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0];
}

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

function currentHebrewDate(): string {
  const now = new Date();
  return format(now, "EEEE, d בMMMM yyyy", { locale: he });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-container ${className ?? ''}`} />
  );
}

// ─── Alert Card ──────────────────────────────────────────────────────────────

function AlertCard({ alert }: { alert: Alert }) {
  const [expanded, setExpanded] = useState(false);
  const isManagerAudience = alert.audience === 'GROUP_MANAGERS';

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

      {alert.body.length > 120 && (
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManagerDashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  const firstName = getFirstName(user?.name);

  // ── Queries ────────────────────────────────────────────────────────────────

  const weeklyStatusQuery = useQuery({
    queryKey: ['manager-weekly-status'],
    queryFn: async () => {
      const res = await api.get<{ data: WeeklyStatusData }>('/manager/group/weekly-status');
      return res.data.data;
    },
    enabled: !!user,
  });

  const donationInfoQuery = useQuery({
    queryKey: ['manager-donation-info'],
    queryFn: async () => {
      const res = await api.get<{ data: DonationInfoData }>('/manager/donation-info');
      return res.data.data;
    },
    enabled: !!user,
  });

  const paymentStatusQuery = useQuery({
    queryKey: ['my-payment-status'],
    queryFn: async () => {
      const res = await api.get<{ data: PaymentStatusData }>('/payments/me/status');
      return res.data.data;
    },
    enabled: !!user,
  });

  const alertsQuery = useQuery({
    queryKey: ['my-alerts-5'],
    queryFn: async () => {
      const res = await api.get<{ data: Alert[] }>('/me/alerts?limit=5');
      return res.data.data;
    },
    enabled: !!user,
  });

  const weekly = weeklyStatusQuery.data;
  const donation = donationInfoQuery.data;
  const payment = paymentStatusQuery.data;
  const alerts = alertsQuery.data ?? [];

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl mx-auto">

      {/* ── Section 1: Welcome ──────────────────────────────────────────────── */}
      <div>
        <h1 className="text-headline-lg font-headline text-on-surface">
          שלום{firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1 capitalize">
          {currentHebrewDate()}
        </p>
      </div>

      {/* ── Section 2: Weekly Tasks ─────────────────────────────────────────── */}
      <section aria-labelledby="weekly-tasks-heading">
        <h2 id="weekly-tasks-heading" className="text-title-lg font-medium mb-4 text-on-surface">
          משימות שבועיות
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          {/* Button 1: Fill Orders */}
          {weeklyStatusQuery.isLoading ? (
            <Skeleton className="min-h-[120px]" />
          ) : (
            <button
              onClick={() => router.push('/manager/weekly-orders')}
              className={`min-h-[120px] w-full rounded-xl p-5 text-start transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                weekly?.ordersAllFilled
                  ? 'bg-secondary/10 border-2 border-secondary'
                  : 'bg-tertiary/10 border-2 border-tertiary/30'
              }`}
              aria-label="מילוי קניות"
            >
              <div className="flex flex-col gap-2 items-start h-full justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart
                    className={`h-6 w-6 ${weekly?.ordersAllFilled ? 'text-secondary' : 'text-tertiary'}`}
                  />
                  <span className="text-title-md font-medium text-on-surface">מילוי קניות</span>
                </div>
                <div>
                  {weekly?.ordersAllFilled && (
                    <CheckCircle2 className="h-4 w-4 text-secondary mb-1" />
                  )}
                  <p className="text-body-sm text-on-surface-variant">
                    {weekly
                      ? `${weekly.ordersFilledCount} מתוך ${weekly.ordersTotalCount} משפחות מולאו`
                      : '— —'}
                  </p>
                </div>
              </div>
            </button>
          )}

          {/* Button 2: Assign Distributor */}
          {weeklyStatusQuery.isLoading ? (
            <Skeleton className="min-h-[120px]" />
          ) : (
            <button
              onClick={() => router.push('/manager/weekly-distributor')}
              className={`min-h-[120px] w-full rounded-xl p-5 text-start transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                weekly?.distributor?.assigned
                  ? 'bg-secondary/10 border-2 border-secondary'
                  : 'bg-primary/10 border-2 border-primary/30'
              }`}
              aria-label="מינוי מחלק שבועי"
            >
              <div className="flex flex-col gap-2 items-start h-full justify-between">
                <div className="flex items-center gap-2">
                  <Truck
                    className={`h-6 w-6 ${weekly?.distributor?.assigned ? 'text-secondary' : 'text-primary'}`}
                  />
                  <span className="text-title-md font-medium text-on-surface">מינוי מחלק שבועי</span>
                </div>
                <div>
                  {weekly?.distributor?.assigned && (
                    <CheckCircle2 className="h-4 w-4 text-secondary mb-1" />
                  )}
                  <p className="text-body-sm text-on-surface-variant">
                    {weekly?.distributor?.assigned
                      ? `השבוע: ${weekly.distributor.fullName}`
                      : 'טרם מונה מחלק לשבוע זה'}
                  </p>
                </div>
              </div>
            </button>
          )}
        </div>
      </section>

      {/* ── Section 3: Donation ─────────────────────────────────────────────── */}
      <section aria-labelledby="donation-heading">
        <div className="card-elevated space-y-4">

          {/* Org header */}
          {donationInfoQuery.isLoading ? (
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
          ) : donation ? (
            <div className="flex items-center gap-3">
              {donation.organizationLogoUrl ? (
                <img
                  src={donation.organizationLogoUrl}
                  alt={donation.organizationName}
                  className="h-10 w-10 rounded-full object-cover border border-outline/20 shrink-0"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
              <span className="text-title-md font-medium text-on-surface">
                {donation.organizationName}
              </span>
            </div>
          ) : null}

          <div>
            <h2
              id="donation-heading"
              className="text-headline-md font-headline text-on-surface mb-1"
            >
              תרומות לעמותה
            </h2>

            {donationInfoQuery.isLoading ? (
              <Skeleton className="h-4 w-3/4 mt-2" />
            ) : (
              <p className="text-body-md text-on-surface-variant">{donation?.paymentDescription}</p>
            )}
          </div>

          {/* Payment status pill */}
          {paymentStatusQuery.isLoading ? (
            <Skeleton className="h-8 w-44 rounded-full" />
          ) : payment ? (
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-body-sm font-medium ${
                payment.isPaid
                  ? 'bg-success-container text-on-success-container'
                  : 'bg-warning-container text-on-warning-container'
              }`}
            >
              {payment.isPaid ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  שילמת החודש
                  {payment.paidAt && (
                    <span className="font-normal opacity-80">
                      ({format(new Date(payment.paidAt), 'd בMMM', { locale: he })})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4" />
                  טרם שולם לחודש זה
                </>
              )}
            </div>
          ) : null}

          {/* Donation iframe */}
          {donationInfoQuery.isLoading ? (
            <Skeleton className="w-full h-[500px] sm:h-[600px] rounded-lg" />
          ) : donation?.paymentLink ? (
            <iframe
              src={donation.paymentLink}
              title="טופס תרומה"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              className="w-full rounded-lg border border-outline/20 h-[500px] sm:h-[600px]"
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-32 rounded-lg bg-surface-container text-body-md text-on-surface-variant">
              קישור לתשלום אינו זמין כרגע
            </div>
          )}
        </div>
      </section>

      {/* ── Section 4: Recent Alerts ────────────────────────────────────────── */}
      <section aria-labelledby="alerts-heading">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="h-5 w-5 text-on-surface-variant" />
          <h2 id="alerts-heading" className="text-title-lg font-medium text-on-surface">
            התראות אחרונות
          </h2>
        </div>

        {alertsQuery.isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : alertsQuery.isError ? (
          <div className="rounded-lg bg-error-container text-on-error-container px-5 py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-body-md">שגיאה בטעינת ההתראות</span>
          </div>
        ) : alerts.length === 0 ? (
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
    </div>
  );
}
