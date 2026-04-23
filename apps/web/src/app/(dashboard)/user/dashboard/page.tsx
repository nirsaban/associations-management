'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import {
  Truck,
  CheckCircle,
  CheckCircle2,
  AlertCircle,
  Phone,
  MapPin,
  Package,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { DonationIframeCard, AlertsList } from '@/components/group-experience';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DistributorFamily {
  id: string;
  name: string;
  contactPhone: string | null;
  address: string | null;
  weeklyOrderContent: string | null;
  delivered: boolean;
  deliveredAt: string | null;
}

interface WeeklyDistribution {
  isDistributor: boolean;
  assignmentId?: string;
  weekStart?: string;
  groupName?: string;
  families?: DistributorFamily[];
  totalCount?: number;
  deliveredCount?: number;
}

interface GroupViewCurrentDistributor {
  userId: string;
  fullName: string;
  phone: string;
}

interface GroupView {
  group: { id: string; name: string };
  currentDistributor: GroupViewCurrentDistributor | null;
}

function formatOrderContent(content: string): string {
  try {
    const items = JSON.parse(content);
    if (Array.isArray(items)) {
      return items
        .map((i: { item?: string; quantity?: number; unit?: string }) =>
          `${i.item ?? ''} ${i.quantity ?? ''} ${i.unit ?? ''}`.trim()
        )
        .join('\n');
    }
  } catch {
    // Not JSON — return as-is
  }
  return content;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getFirstName(fullName?: string): string {
  if (!fullName) return '';
  return fullName.trim().split(/\s+/)[0];
}

function currentHebrewDate(): string {
  return format(new Date(), 'EEEE, d בMMMM yyyy', { locale: he });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-container ${className ?? ''}`} />
  );
}

// ─── Family Delivery Card ─────────────────────────────────────────────────────

function FamilyDeliveryCard({
  family,
  onToggle,
  isToggling,
}: {
  family: DistributorFamily;
  onToggle: (id: string, current: boolean) => void;
  isToggling: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        family.delivered
          ? 'bg-success-container/30 border-success/30'
          : 'bg-surface-container border-outline/20'
      }`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-title-md font-semibold text-on-surface">{family.name}</p>

          {family.address && (
            <p className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-1">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {family.address}
            </p>
          )}

          {family.contactPhone && (
            <a
              href={`tel:${family.contactPhone}`}
              className="text-body-sm text-primary flex items-center gap-1 mt-0.5"
              dir="ltr"
            >
              <Phone className="h-3.5 w-3.5 shrink-0" />
              {family.contactPhone}
            </a>
          )}
        </div>

        {/* Delivered badge */}
        {family.delivered && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-container text-on-success-container text-label-sm font-medium">
            <CheckCircle className="h-3.5 w-3.5" />
            חולק
          </span>
        )}
      </div>

      {/* Weekly order content */}
      {family.weeklyOrderContent && (
        <div className="rounded-lg bg-surface-container px-4 py-3 mb-3">
          <p className="text-label-sm text-on-surface-variant mb-1 flex items-center gap-1">
            <Package className="h-3.5 w-3.5" />
            תוכן הזמנה שבועית
          </p>
          <p className="text-body-sm text-on-surface leading-relaxed whitespace-pre-wrap">
            {formatOrderContent(family.weeklyOrderContent)}
          </p>
        </div>
      )}

      {/* Toggle button */}
      <button
        type="button"
        disabled={isToggling}
        onClick={() => onToggle(family.id, family.delivered)}
        className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-body-md font-medium transition-all disabled:opacity-50 ${
          family.delivered
            ? 'bg-success text-on-success hover:bg-success/90'
            : 'border-2 border-primary text-primary hover:bg-primary/5'
        }`}
        aria-label={family.delivered ? 'בטל סימון חולק' : 'סמן כחולק'}
      >
        {family.delivered ? (
          <>
            <CheckCircle2 className="h-4 w-4" />
            חולק
          </>
        ) : (
          <>
            <Truck className="h-4 w-4" />
            סמן כחולק
          </>
        )}
      </button>
    </div>
  );
}

// ─── Distributor Section ──────────────────────────────────────────────────────

function DistributorSection({ data }: { data: WeeklyDistribution }) {
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const families = data.families ?? [];
  const totalCount = data.totalCount ?? families.length;
  const deliveredCount = data.deliveredCount ?? families.filter((f) => f.delivered).length;
  const allDelivered = totalCount > 0 && deliveredCount >= totalCount;

  const toggleMutation = useMutation({
    mutationFn: async ({ familyId, delivered }: { familyId: string; delivered: boolean }) => {
      await api.put(`/me/weekly-distribution/families/${familyId}`, { delivered });
    },
    onMutate: async ({ familyId, delivered }) => {
      setTogglingId(familyId);
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['user-weekly-distribution'] });
      const prev = queryClient.getQueryData<WeeklyDistribution>(['user-weekly-distribution']);
      if (prev) {
        queryClient.setQueryData<WeeklyDistribution>(['user-weekly-distribution'], {
          ...prev,
          families: prev.families?.map((f) =>
            f.id === familyId
              ? { ...f, delivered, deliveredAt: delivered ? new Date().toISOString() : null }
              : f,
          ),
          deliveredCount: delivered
            ? (prev.deliveredCount ?? 0) + 1
            : Math.max(0, (prev.deliveredCount ?? 0) - 1),
        });
      }
      return { prev };
    },
    onError: (_err, _vars, context) => {
      if (context?.prev) {
        queryClient.setQueryData(['user-weekly-distribution'], context.prev);
      }
      showToast('שגיאה בעדכון סטטוס חלוקה', 'error');
    },
    onSuccess: (_data, { delivered }) => {
      showToast(delivered ? 'סומן כחולק' : 'בוטל סימון החלוקה', 'success');
    },
    onSettled: () => {
      setTogglingId(null);
    },
  });

  return (
    <section aria-labelledby="distributor-heading">
      {/* Hero card */}
      <div className="rounded-xl bg-success-container text-on-success-container px-6 py-5 flex items-center gap-4 mb-4">
        <div className="p-3 rounded-full bg-success/20 shrink-0">
          <Truck className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 id="distributor-heading" className="text-title-lg font-semibold">
            את/ה המחלק/ת השבוע
          </h2>
          {data.groupName && (
            <p className="text-body-sm opacity-80 mt-0.5">קבוצה: {data.groupName}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-xl bg-surface-container px-5 py-4 mb-4">
        <p className="text-body-md font-medium text-on-surface">
          {deliveredCount} מתוך {totalCount} משפחות חולקו
        </p>
        {totalCount > 0 && (
          <div className="mt-2 h-2 rounded-full bg-outline/20 overflow-hidden">
            <div
              className="h-full rounded-full bg-success transition-all duration-300"
              style={{ width: `${Math.round((deliveredCount / totalCount) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* All delivered banner */}
      {allDelivered && (
        <div className="rounded-xl bg-success-container text-on-success-container px-5 py-4 flex items-center gap-3 mb-4">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="text-body-md font-medium">כל המשפחות חולקו השבוע</span>
        </div>
      )}

      {/* Family cards */}
      {families.length > 0 && (
        <div className="space-y-3">
          {families.map((family) => (
            <FamilyDeliveryCard
              key={family.id}
              family={family}
              isToggling={togglingId === family.id}
              onToggle={(id, current) =>
                toggleMutation.mutate({ familyId: id, delivered: !current })
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Non-distributor info card ─────────────────────────────────────────────────

function NonDistributorCard({
  currentDistributor,
  hasGroup,
}: {
  currentDistributor: GroupViewCurrentDistributor | null;
  hasGroup: boolean;
}) {
  if (!hasGroup) {
    return (
      <div className="rounded-xl bg-surface-container px-5 py-4 flex items-center gap-3 text-on-surface-variant">
        <Truck className="h-5 w-5 shrink-0" />
        <span className="text-body-md">אינך משויך לקבוצה כרגע</span>
      </div>
    );
  }

  if (!currentDistributor) {
    return (
      <div className="rounded-xl bg-warning-container text-on-warning-container px-5 py-4 flex items-center gap-3">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span className="text-body-md font-medium">טרם מונה מחלק לשבוע זה</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-primary/10 border border-primary/20 px-5 py-4 flex items-center gap-4">
      <div className="p-2 rounded-full bg-primary/15 shrink-0">
        <Truck className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-sm text-on-surface-variant">המחלק השבועי</p>
        <p className="text-body-lg font-medium text-on-surface">{currentDistributor.fullName}</p>
        {currentDistributor.phone && (
          <a
            href={`tel:${currentDistributor.phone}`}
            className="text-body-sm text-primary flex items-center gap-1 mt-0.5"
            dir="ltr"
          >
            <Phone className="h-3 w-3 shrink-0" />
            {currentDistributor.phone}
          </a>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const { user } = useAuthStore();
  const firstName = getFirstName(user?.name);
  const hasGroup = !!user?.groupMembershipGroupId;

  // Query: weekly distribution status
  const weeklyDistQuery = useQuery({
    queryKey: ['user-weekly-distribution'],
    queryFn: async () => {
      const res = await api.get<{ data: WeeklyDistribution }>('/me/weekly-distribution');
      return res.data.data;
    },
    enabled: !!user,
  });

  // Query: group view (for current distributor when user is NOT the distributor)
  const groupViewQuery = useQuery({
    queryKey: ['user-group-view-distributor'],
    queryFn: async () => {
      const res = await api.get<{ data: GroupView }>('/me/group-view');
      return res.data.data;
    },
    enabled: !!user && hasGroup && weeklyDistQuery.data?.isDistributor === false,
  });

  // Query: donation info
  const donationInfoQuery = useQuery({
    queryKey: ['user-donation-info'],
    queryFn: async () => {
      const res = await api.get<{ data: DonationInfoData }>('/manager/donation-info');
      return res.data.data;
    },
    enabled: !!user,
  });

  // Query: payment status
  const paymentStatusQuery = useQuery({
    queryKey: ['my-payment-status'],
    queryFn: async () => {
      const res = await api.get<{ data: PaymentStatusData }>('/payments/me/status');
      return res.data.data;
    },
    enabled: !!user,
  });

  const weekly = weeklyDistQuery.data;
  const donation = donationInfoQuery.data;
  const payment = paymentStatusQuery.data;

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

      {/* ── Section 2: Weekly Distribution Status ───────────────────────────── */}
      <section aria-labelledby="weekly-dist-heading">
        <h2 id="weekly-dist-heading" className="text-title-lg font-medium mb-4 text-on-surface">
          חלוקה שבועית
        </h2>

        {weeklyDistQuery.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        ) : weeklyDistQuery.isError ? (
          <div className="rounded-lg bg-error-container text-on-error-container px-5 py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-body-md">שגיאה בטעינת נתוני חלוקה</span>
          </div>
        ) : weekly?.isDistributor ? (
          <DistributorSection data={weekly} />
        ) : (
          <NonDistributorCard
            hasGroup={hasGroup}
            currentDistributor={groupViewQuery.data?.currentDistributor ?? null}
          />
        )}
      </section>

      {/* ── Section 3: Donation ─────────────────────────────────────────────── */}
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
        ) : donationInfoQuery.isError ? (
          <div className="rounded-lg bg-error-container text-on-error-container px-5 py-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-body-md">שגיאה בטעינת פרטי תרומה</span>
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

      {/* ── Section 4: Alerts ───────────────────────────────────────────────── */}
      <AlertsList limit={5} />
    </div>
  );
}
