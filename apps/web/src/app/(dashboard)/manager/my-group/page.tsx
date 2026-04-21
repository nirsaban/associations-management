'use client';

import React, { useState } from 'react';
import {
  Users,
  CheckCircle,
  CreditCard,
  TrendingUp,
  Phone,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// ─── Type definitions ───────────────────────────────────────────────────────

interface GroupInfo {
  id: string;
  name: string;
  memberCount: number;
  familyCount: number;
  createdAt: string;
}

interface MemberPaymentStatus {
  userId: string;
  fullName: string;
  phone: string;
  isDonor: boolean;
  paidThisMonth: boolean;
  currentMonthPaymentDate: string | null;
}

interface DistributorEntry {
  userId: string;
  fullName: string;
  timesAsDistributor: number;
  lastAsDistributor: string | null;
}

interface DistributorWorkload {
  members: DistributorEntry[];
  highest: DistributorEntry | null;
  lowest: DistributorEntry | null;
}

interface MonthRevenue {
  month: number; // 1-12
  amount: number;
}

interface Revenue {
  thisMonth: {
    amount: number;
    currency: string;
    paidCount: number;
    unpaidCount: number;
  };
  thisYear: {
    amount: number;
    byMonth: MonthRevenue[];
  };
}

// ─── Constants ───────────────────────────────────────────────────────────────

const HEBREW_MONTH_SHORT = [
  'ינו',
  'פבר',
  'מרץ',
  'אפר',
  'מאי',
  'יונ',
  'יול',
  'אוג',
  'ספט',
  'אוק',
  'נוב',
  'דצמ',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(amount: number, currency = 'ILS'): string {
  if (currency === 'ILS') {
    return `₪${amount.toLocaleString('he-IL')}`;
  }
  return `${amount.toLocaleString('he-IL')} ${currency}`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ReactNode;
  iconBg: string;
}

function StatCard({ label, value, subtext, icon, iconBg }: StatCardProps) {
  return (
    <div className="card-elevated">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-label-md text-on-surface-variant mb-1 truncate">{label}</p>
          <p className="text-headline-md font-bold truncate">{value}</p>
          {subtext && (
            <p className="text-body-sm text-on-surface-variant mt-1 truncate">{subtext}</p>
          )}
        </div>
        <div className={`p-3 rounded-full flex-shrink-0 ${iconBg}`}>{icon}</div>
      </div>
    </div>
  );
}

// CSS-only bar chart — no extra dependencies
interface BarChartProps {
  byMonth: MonthRevenue[];
  currency: string;
}

function RevenueBarChart({ byMonth, currency }: BarChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // Build a 12-slot array indexed by month 1–12
  const slots: number[] = Array(12).fill(0);
  for (const entry of byMonth) {
    const idx = entry.month - 1; // 0-based
    if (idx >= 0 && idx < 12) {
      slots[idx] = entry.amount;
    }
  }

  const maxAmount = Math.max(...slots, 1); // avoid division by zero

  return (
    <div className="relative">
      {/* Chart area */}
      <div className="flex items-end gap-1 h-[200px] lg:h-[280px] px-1">
        {slots.map((amount, idx) => {
          const heightPct = (amount / maxAmount) * 100;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={idx}
              className="relative flex flex-col items-center flex-1 h-full justify-end group"
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip */}
              {isHovered && amount > 0 && (
                <div
                  className="absolute bottom-full mb-2 z-10 px-2 py-1 rounded bg-on-surface text-surface text-label-sm whitespace-nowrap pointer-events-none"
                  style={{ left: '50%', transform: 'translateX(-50%)' }}
                >
                  {formatCurrency(amount, currency)}
                </div>
              )}

              {/* Bar background track */}
              <div className="w-full flex flex-col justify-end bg-primary/10 rounded-t-sm h-full">
                {/* Actual bar */}
                <div
                  className="w-full bg-primary rounded-t-sm transition-all duration-200"
                  style={{ height: `${heightPct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Month labels */}
      <div className="flex gap-1 px-1 mt-1">
        {HEBREW_MONTH_SHORT.map((label, idx) => (
          <div
            key={idx}
            className="flex-1 text-center text-label-sm text-on-surface-variant truncate"
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header skeleton */}
      <div className="h-9 w-64 rounded-lg bg-surface-container animate-pulse" />

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card h-28 animate-pulse bg-surface-container" />
        ))}
      </div>

      {/* Members list skeleton */}
      <div className="card-elevated space-y-3">
        <div className="h-6 w-32 rounded bg-surface-container animate-pulse mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-surface-container animate-pulse" />
        ))}
      </div>

      {/* Distributor panel skeleton */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card h-24 animate-pulse bg-surface-container" />
        <div className="card h-24 animate-pulse bg-surface-container" />
      </div>

      {/* Chart skeleton */}
      <div className="card-elevated h-64 animate-pulse bg-surface-container" />
    </div>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

function ErrorState({ message }: { message: string }) {
  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3 items-center">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <span>{message}</span>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ManagerMyGroupPage() {
  const { user } = useAuthStore();
  const [workloadExpanded, setWorkloadExpanded] = useState(false);

  // ── Query: group info
  const {
    data: groupInfo,
    isLoading: loadingGroup,
    error: errorGroup,
  } = useQuery({
    queryKey: ['manager-my-group-info', user?.id],
    queryFn: async () => {
      const res = await api.get<{ data: GroupInfo }>('/manager/group');
      return res.data.data;
    },
    enabled: !!user,
  });

  // ── Query: members and payment status
  const {
    data: members,
    isLoading: loadingMembers,
    error: errorMembers,
  } = useQuery({
    queryKey: ['manager-my-group-members', user?.id],
    queryFn: async () => {
      const res = await api.get<{ data: MemberPaymentStatus[] }>(
        '/manager/group/members-and-payment-status',
      );
      return res.data.data;
    },
    enabled: !!user,
  });

  // ── Query: distributor workload
  const {
    data: workload,
    isLoading: loadingWorkload,
    error: errorWorkload,
  } = useQuery({
    queryKey: ['manager-my-group-workload', user?.id],
    queryFn: async () => {
      const res = await api.get<{ data: DistributorWorkload }>(
        '/manager/group/distributor-workload',
      );
      return res.data.data;
    },
    enabled: !!user,
  });

  // ── Query: revenue
  const {
    data: revenue,
    isLoading: loadingRevenue,
    error: errorRevenue,
  } = useQuery({
    queryKey: ['manager-my-group-revenue', user?.id],
    queryFn: async () => {
      const res = await api.get<{ data: Revenue }>('/manager/group/revenue');
      return res.data.data;
    },
    enabled: !!user,
  });

  // ── Global loading state (all four in flight)
  const isLoading = loadingGroup || loadingMembers || loadingWorkload || loadingRevenue;
  if (isLoading) return <PageSkeleton />;

  // ── First hard error blocks the page
  if (errorGroup) return <ErrorState message="שגיאה בטעינת פרטי הקבוצה" />;
  if (errorMembers) return <ErrorState message="שגיאה בטעינת רשימת החברים" />;
  if (errorWorkload) return <ErrorState message="שגיאה בטעינת נתוני עומס מחלקים" />;
  if (errorRevenue) return <ErrorState message="שגיאה בטעינת נתוני הכנסות" />;

  // ── Derived values
  const memberCount = groupInfo?.memberCount ?? 0;
  const paidCount = revenue?.thisMonth?.paidCount ?? 0;
  const unpaidCount = revenue?.thisMonth?.unpaidCount ?? 0;
  const totalMembersForPercent = paidCount + unpaidCount;
  const paidPercent =
    totalMembersForPercent > 0 ? Math.round((paidCount / totalMembersForPercent) * 100) : 0;

  const thisMonthAmount = revenue?.thisMonth?.amount ?? 0;
  const thisYearAmount = revenue?.thisYear?.amount ?? 0;
  const currency = revenue?.thisMonth?.currency ?? 'ILS';

  // Sort members: unpaid first, then alphabetical
  const sortedMembers = [...(members ?? [])].sort((a, b) => {
    if (a.paidThisMonth !== b.paidThisMonth) {
      return a.paidThisMonth ? 1 : -1; // unpaid first
    }
    return a.fullName.localeCompare(b.fullName, 'he');
  });

  const byMonth = revenue?.thisYear?.byMonth ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl">
      {/* ── Header ── */}
      <div>
        <h1 className="text-headline-md sm:text-headline-lg font-headline mb-1 sm:mb-2">
          הקבוצה שלי{groupInfo?.name ? ` – ${groupInfo.name}` : ''}
        </h1>
        {groupInfo?.createdAt && (
          <p className="text-body-sm text-on-surface-variant">
            נוצרה ב-{format(new Date(groupInfo.createdAt), 'd MMMM yyyy', { locale: he })}
          </p>
        )}
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="חברים בקבוצה"
          value={memberCount}
          icon={<Users className="h-6 w-6 text-primary" />}
          iconBg="bg-primary/10"
        />
        <StatCard
          label="שילמו החודש"
          value={paidCount}
          subtext={`${paidPercent}% מהחברים`}
          icon={<CheckCircle className="h-6 w-6 text-success" />}
          iconBg="bg-success/10"
        />
        <StatCard
          label="הסכום שנאסף החודש"
          value={formatCurrency(thisMonthAmount, currency)}
          icon={<CreditCard className="h-6 w-6 text-tertiary" />}
          iconBg="bg-tertiary/10"
        />
        <StatCard
          label="הסכום שנאסף השנה"
          value={formatCurrency(thisYearAmount, currency)}
          icon={<TrendingUp className="h-6 w-6 text-primary" />}
          iconBg="bg-primary/10"
        />
      </div>

      {/* ── Members list ── */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-4 flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          חברי הקבוצה
        </h2>

        {sortedMembers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-body-lg text-on-surface-variant">אין חברים בקבוצה</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedMembers.map((member) => (
              <div
                key={member.userId}
                className="p-4 rounded-lg bg-surface-container hover:bg-surface-variant/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  {/* Name + phone */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-body-lg font-medium">{member.fullName}</p>
                      {member.userId === user?.id && (
                        <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-label-sm font-medium">
                          מנהל הקבוצה
                        </span>
                      )}
                    </div>
                    <p
                      className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5"
                      dir="ltr"
                    >
                      <Phone className="h-3 w-3 flex-shrink-0" />
                      {member.phone}
                    </p>
                  </div>

                  {/* Payment badge */}
                  <div className="flex-shrink-0">
                    {member.paidThisMonth ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-container text-on-success-container text-label-sm font-medium">
                        <CheckCircle className="h-3.5 w-3.5" />
                        שילם
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-container text-on-warning-container text-label-sm font-medium">
                        <AlertCircle className="h-3.5 w-3.5" />
                        לא שילם
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Distributor workload ── */}
      <div>
        <div className="grid grid-cols-2 gap-4 mb-3">
          {/* Highest */}
          <div className="card bg-primary/10 border border-primary/20">
            <p className="text-label-sm text-on-surface-variant mb-2">המחלק השכיח ביותר</p>
            {workload?.highest ? (
              <>
                <p className="text-body-lg font-medium">{workload.highest.fullName}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {workload.highest.timesAsDistributor} פעמים
                </p>
              </>
            ) : (
              <p className="text-body-sm text-on-surface-variant">אין נתונים</p>
            )}
          </div>

          {/* Lowest */}
          <div className="card bg-tertiary/10 border border-tertiary/20">
            <p className="text-label-sm text-on-surface-variant mb-2">המחלק הפחות פעיל</p>
            {workload?.lowest ? (
              <>
                <p className="text-body-lg font-medium">{workload.lowest.fullName}</p>
                <p className="text-body-sm text-on-surface-variant">
                  {workload.lowest.timesAsDistributor} פעמים
                </p>
              </>
            ) : (
              <p className="text-body-sm text-on-surface-variant">אין נתונים</p>
            )}
          </div>
        </div>

        <p className="text-body-sm text-on-surface-variant mb-4">
          לאזן חלוקת העומס מעודד הוגנות בקבוצה.
        </p>

        {/* Expandable accordion */}
        {workload && workload.members.length > 0 && (
          <div className="card-elevated">
            <button
              type="button"
              className="w-full flex items-center justify-between gap-3 text-start"
              onClick={() => setWorkloadExpanded((prev) => !prev)}
            >
              <span className="text-title-md font-medium">פירוט עומס מחלקים</span>
              {workloadExpanded ? (
                <ChevronUp className="h-5 w-5 text-on-surface-variant flex-shrink-0" />
              ) : (
                <ChevronDown className="h-5 w-5 text-on-surface-variant flex-shrink-0" />
              )}
            </button>

            {workloadExpanded && (
              <div className="mt-4 space-y-2">
                {[...workload.members]
                  .sort((a, b) => b.timesAsDistributor - a.timesAsDistributor)
                  .map((entry) => (
                    <div
                      key={entry.userId}
                      className="flex items-center justify-between gap-4 px-3 py-2 rounded-lg bg-surface-container"
                    >
                      <p className="text-body-md">{entry.fullName}</p>
                      <span className="text-body-sm text-on-surface-variant flex-shrink-0">
                        {entry.timesAsDistributor} פעמים
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Revenue chart ── */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6">הכנסות - 12 חודשים אחרונים</h2>
        <RevenueBarChart byMonth={byMonth} currency={currency} />
      </div>
    </div>
  );
}
