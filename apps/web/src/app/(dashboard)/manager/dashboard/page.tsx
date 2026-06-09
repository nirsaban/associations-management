'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  ChevronLeft,
  Users2,
  BookOpen,
  Clock,
  Recycle,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { COMMUNITY_PROFESSIONS_ENABLED } from '@/lib/feature-flags';
import { GroupSwitcher } from '../_components/GroupSwitcher';
import { withGroupId } from '../_components/groupIdParam';
import { DonationIframeCard } from '@/components/group-experience';
import { BusinessPromoSlider } from '@/components/business-promo-slider';
import ReferralCard from '../../user/dashboard/ReferralCard';

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
  const { user, activeManagedGroupId } = useAuthStore();

  const firstName = getFirstName(user?.name);

  // ── Queries ────────────────────────────────────────────────────────────────

  const weeklyStatusQuery = useQuery({
    queryKey: ['manager-weekly-status', activeManagedGroupId],
    queryFn: async () => {
      const res = await api.get<{ data: WeeklyStatusData }>(
        withGroupId('/manager/group/weekly-status', activeManagedGroupId),
      );
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
      <div className="space-y-3">
        <div>
          <h1 className="text-headline-lg font-headline text-on-surface">
            שלום{firstName ? `, ${firstName}` : ''}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1 capitalize">
            {currentHebrewDate()}
          </p>
        </div>
        <GroupSwitcher />
      </div>

      {/* ── Business promo slider (auto-rotating, community-only) ───────────── */}
      {COMMUNITY_PROFESSIONS_ENABLED && <BusinessPromoSlider />}

      {/* ── Section 2: Donation (same component as user dashboard) ──────────── */}
      <section aria-labelledby="donation-section-heading">
        <h2 id="donation-section-heading" className="text-title-lg font-medium mb-4 text-on-surface">
          תרומות
        </h2>

        {donationInfoQuery.isLoading || paymentStatusQuery.isLoading ? (
          <div className="card-elevated space-y-4">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-44 rounded-full" />
            <Skeleton className="w-full h-[500px] sm:h-[600px] rounded-lg" />
          </div>
        ) : donation ? (
          <DonationIframeCard
            paymentLink={donation.paymentLink}
            paymentDescription={donation.paymentDescription}
            organizationName={donation.organizationName}
            organizationLogoUrl={donation.organizationLogoUrl}
            isPaid={payment?.isPaid ?? false}
            paidAt={payment?.paidAt ?? null}
          />
        ) : null}
      </section>

      {/* ── Section 3: Weekly Tasks (directly under donation) ──────────────── */}
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

      {/* ── Community CTA (below weekly tasks) ─────────────────────────────── */}
      {COMMUNITY_PROFESSIONS_ENABLED && <CommunityHeroCard />}

      {/* ── Section 4: My Referral Link ──────────────────────────────────── */}
      <ReferralCard />

      {/* ── Section 5: Recent Alerts ────────────────────────────────────────── */}
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

// ─── Community Hero Card ───────────────────────────────────────

function CommunityHeroCard() {
  const tiles: { href: string; label: string; sub: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { href: '/community/tehillim', label: 'תהילים יומי', sub: 'פרק קהילתי + הקדשה', icon: BookOpen },
    { href: '/community/pass-it-on', label: 'למסירה', sub: 'חפצים וריהוט בקהילה', icon: Recycle },
    { href: '/community/zmanim', label: 'זמני היום', sub: 'שבת, פרשה, זמני תפילה', icon: Clock },
    { href: '/community/people', label: 'אנשים', sub: 'מאגר בעלי מקצוע', icon: Users2 },
  ];

  return (
    <section
      aria-labelledby="community-hero-heading"
      className="rounded-2xl border border-primary/20 bg-gradient-to-bl from-primary/10 via-primary/5 to-transparent p-5 sm:p-6"
    >
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Users2 className="h-6 w-6 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 id="community-hero-heading" className="text-title-lg font-headline text-on-surface">
              הקהילה שלך
            </h2>
            <p className="text-body-sm text-on-surface-variant">
              תהילים יומי, מסירת חפצים, זמני יום ומאגר בעלי מקצוע
            </p>
          </div>
        </div>
        <Link
          href="/community/tehillim"
          className="hidden sm:flex items-center gap-1 text-body-sm text-primary font-medium hover:underline"
        >
          לתהילים של היום
          <ChevronLeft className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tiles.map(t => {
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="group flex flex-col items-start gap-1.5 rounded-xl bg-surface-container-lowest/80 hover:bg-surface-container border border-outline/15 hover:border-primary/30 p-3 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center transition-colors">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-body-md font-medium text-on-surface">{t.label}</p>
              <p className="text-label-sm text-on-surface-variant line-clamp-1">{t.sub}</p>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
