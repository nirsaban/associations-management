'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  AlertCircle,
  CheckCircle2,
  CreditCard,
  Clock,
  X,
  CheckCircle,
  Building2,
  ChevronRight,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaymentStatusData {
  isPaid: boolean;
  monthKey: string;
  paidAt?: string;
}

interface DonationInfoData {
  paymentLink: string;
  paymentDescription: string;
  organizationName: string;
  organizationLogoUrl?: string;
}

interface PaymentHistoryItem {
  id: string;
  amount: number;
  currency: string;
  monthKey: string;
  paidAt?: string;
  method?: string;
  reference?: string;
  status: string;
}

interface MyPaymentsData {
  isCurrentMonthPaid: boolean;
  currentMonthPaymentDate?: string;
  history: PaymentHistoryItem[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-container ${className ?? ''}`} />
  );
}

function mapMethodToHebrew(method?: string): string {
  switch (method) {
    case 'CREDIT_CARD':
      return 'כרטיס אשראי';
    case 'BANK_TRANSFER':
      return 'העברה בנקאית';
    case 'CHECK':
      return "צ'ק";
    case 'CASH':
      return 'מזומן';
    case 'OTHER':
      return 'אחר';
    default:
      return method ?? '—';
  }
}

function getStatusBadge(status: string): {
  label: string;
  classes: string;
  icon: React.ReactNode;
} {
  switch (status) {
    case 'COMPLETED':
      return {
        label: 'שולם',
        classes: 'bg-success-container text-on-success-container',
        icon: <CheckCircle className="h-3.5 w-3.5" />,
      };
    case 'PENDING':
      return {
        label: 'ממתין',
        classes: 'bg-warning-container text-on-warning-container',
        icon: <Clock className="h-3.5 w-3.5" />,
      };
    case 'FAILED':
      return {
        label: 'נכשל',
        classes: 'bg-error-container text-on-error-container',
        icon: <X className="h-3.5 w-3.5" />,
      };
    default:
      return {
        label: status,
        classes: 'bg-surface-variant text-on-surface-variant',
        icon: null,
      };
  }
}

function formatDateDDMMYYYY(dateStr: string): string {
  const d = new Date(dateStr);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function truncateRef(ref?: string): string {
  if (!ref) return '—';
  return ref.length > 15 ? ref.slice(0, 12) + '...' : ref;
}

// ─── Section A: Current Month Status Banner ───────────────────────────────────

function PaymentStatusBanner({ data }: { data: PaymentStatusData }) {
  const monthName = (() => {
    const [year, month] = data.monthKey.split('-');
    return format(
      new Date(parseInt(year), parseInt(month) - 1, 1),
      'MMMM yyyy',
      { locale: he },
    );
  })();

  if (data.isPaid) {
    const paidDateStr = data.paidAt
      ? format(new Date(data.paidAt), 'd בMMMM yyyy', { locale: he })
      : '';

    return (
      <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-success-container text-on-success-container text-body-md font-medium">
        <CheckCircle2 className="h-6 w-6 shrink-0" />
        <span>
          שילמת לחודש זה
          {paidDateStr && (
            <span className="font-normal opacity-80"> — {paidDateStr}</span>
          )}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-warning-container text-on-warning-container text-body-md font-medium">
      <AlertCircle className="h-6 w-6 shrink-0" />
      <span>
        טרם שולם לחודש זה
        <span className="font-normal opacity-80"> — {monthName}</span>
      </span>
    </div>
  );
}

// ─── Section B: Donation Iframe ───────────────────────────────────────────────

function DonationIframeSection({ data }: { data: DonationInfoData }) {
  return (
    <div className="card-elevated space-y-4">
      {/* Org header */}
      <div className="flex items-center gap-3">
        {data.organizationLogoUrl ? (
          <img
            src={data.organizationLogoUrl}
            alt={data.organizationName}
            className="h-10 w-10 rounded-full object-cover border border-outline/20 shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
        )}
        <span className="text-title-md font-medium text-on-surface">{data.organizationName}</span>
      </div>

      <div>
        <h2 className="text-headline-md font-headline text-on-surface mb-1">תרומות לעמותה</h2>
        {data.paymentDescription && (
          <p className="text-body-md text-on-surface-variant">{data.paymentDescription}</p>
        )}
      </div>

      {data.paymentLink ? (
        <iframe
          src={data.paymentLink}
          title="טופס תרומה"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          className="w-full rounded-lg border border-outline/30 h-[500px] sm:h-[600px]"
          loading="lazy"
        />
      ) : (
        <div className="flex items-center justify-center h-32 rounded-lg bg-surface-container text-body-md text-on-surface-variant">
          קישור לתשלום אינו זמין כרגע
        </div>
      )}
    </div>
  );
}

// ─── Section C: Payment History ───────────────────────────────────────────────

function PaymentHistorySection({ data }: { data: MyPaymentsData }) {
  const sorted = [...(data.history ?? [])].reverse();

  return (
    <div className="card-elevated">
      <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
        <CreditCard className="h-6 w-6 text-primary" />
        היסטוריית תשלומים
      </h2>

      {sorted.length === 0 ? (
        <div className="text-center py-12">
          <CreditCard className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
          <p className="text-body-lg text-on-surface-variant">אין תשלומים להצגה</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((payment) => {
            const badge = getStatusBadge(payment.status);
            const dateStr = payment.paidAt ? formatDateDDMMYYYY(payment.paidAt) : '—';

            return (
              <div
                key={payment.id}
                className="p-4 rounded-lg bg-surface-container hover:bg-surface-variant/50 transition-colors"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  {/* Date + method */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <p className="text-body-md font-medium" dir="ltr">
                      {dateStr}
                    </p>
                    <p className="text-body-sm text-on-surface-variant">
                      {mapMethodToHebrew(payment.method)}
                    </p>
                    {payment.reference && (
                      <p
                        className="text-label-sm text-on-surface-variant font-mono truncate max-w-[180px]"
                        title={payment.reference}
                        dir="ltr"
                      >
                        {truncateRef(payment.reference)}
                      </p>
                    )}
                  </div>

                  {/* Amount + status */}
                  <div className="flex items-center gap-3 shrink-0">
                    <p className="text-body-lg font-bold">
                      ₪{payment.amount.toLocaleString('he-IL')}
                    </p>
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-sm font-medium ${badge.classes}`}
                    >
                      {badge.icon}
                      {badge.label}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserMyDonationsPage() {
  const { user } = useAuthStore();

  const paymentStatusQuery = useQuery({
    queryKey: ['my-payment-status'],
    queryFn: async () => {
      const res = await api.get<{ data: PaymentStatusData }>('/payments/me/status');
      return res.data.data;
    },
    enabled: !!user,
  });

  const donationInfoQuery = useQuery({
    queryKey: ['user-donation-info'],
    queryFn: async () => {
      const res = await api.get<{ data: DonationInfoData }>('/manager/donation-info');
      return res.data.data;
    },
    enabled: !!user,
  });

  const myPaymentsQuery = useQuery({
    queryKey: ['user-my-payments'],
    queryFn: async () => {
      const res = await api.get<{ data: MyPaymentsData }>('/manager/my-payments');
      return res.data.data;
    },
    enabled: !!user,
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/user/dashboard"
          className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
          aria-label="חזור לדף הבית"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-headline-md sm:text-headline-lg font-headline mb-0.5">
            התרומות שלי
          </h1>
          <p className="text-body-md text-on-surface-variant">סטטוס תשלום ותרומות לעמותה</p>
        </div>
      </div>

      {/* Section A: Current month status */}
      {paymentStatusQuery.isLoading ? (
        <Skeleton className="h-16 rounded-2xl" />
      ) : paymentStatusQuery.isError ? (
        <div className="rounded-lg bg-error-container px-5 py-4 text-on-error-container flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>שגיאה בטעינת סטטוס תשלום</span>
        </div>
      ) : paymentStatusQuery.data ? (
        <PaymentStatusBanner data={paymentStatusQuery.data} />
      ) : null}

      {/* Section B: Donation iframe */}
      {donationInfoQuery.isLoading ? (
        <div className="card-elevated space-y-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="w-full h-[500px] sm:h-[600px] rounded-lg" />
        </div>
      ) : donationInfoQuery.isError ? (
        <div className="rounded-lg bg-error-container px-5 py-4 text-on-error-container flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>שגיאה בטעינת פרטי תרומה</span>
        </div>
      ) : donationInfoQuery.data ? (
        <DonationIframeSection data={donationInfoQuery.data} />
      ) : null}

      {/* Section C: Payment history */}
      {myPaymentsQuery.isLoading ? (
        <div className="card-elevated space-y-3">
          <Skeleton className="h-6 w-40" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : myPaymentsQuery.isError ? (
        <div className="rounded-lg bg-error-container px-5 py-4 text-on-error-container flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>שגיאה בטעינת היסטוריית תשלומים</span>
        </div>
      ) : myPaymentsQuery.data ? (
        <PaymentHistorySection data={myPaymentsQuery.data} />
      ) : null}
    </div>
  );
}
