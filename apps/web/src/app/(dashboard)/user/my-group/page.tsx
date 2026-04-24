'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  Truck,
  Phone,
  MapPin,
  Package,
  CheckCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { MembersList, CurrentWeekDistributorCard } from '@/components/group-experience';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupViewMember {
  userId: string;
  fullName: string;
  paidThisMonth: boolean;
}

interface GroupViewCurrentDistributor {
  userId: string;
  fullName: string;
  phone: string;
}

interface GroupViewFamily {
  id: string;
  name: string;
  contactPhone: string | null;
  address: string | null;
}

interface GroupView {
  group: { id: string; name: string };
  members: GroupViewMember[];
  currentDistributor: GroupViewCurrentDistributor | null;
  families: GroupViewFamily[];
}

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-container ${className ?? ''}`} />
  );
}

function PageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">
      <Skeleton className="h-9 w-64" />
      <Skeleton className="h-16 rounded-xl" />
      <div className="card-elevated space-y-3">
        <Skeleton className="h-6 w-32 mb-4" />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}

// ─── Distributor Family Card ─────────────────────────────────────────────────

function DistributorFamilyCard({
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

        {family.delivered && (
          <span className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success-container text-on-success-container text-label-sm font-medium">
            <CheckCircle className="h-3.5 w-3.5" />
            חולק
          </span>
        )}
      </div>

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
      await queryClient.cancelQueries({ queryKey: ['user-weekly-distribution-group'] });
      const prev = queryClient.getQueryData<WeeklyDistribution>(['user-weekly-distribution-group']);
      if (prev) {
        queryClient.setQueryData<WeeklyDistribution>(['user-weekly-distribution-group'], {
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
        queryClient.setQueryData(['user-weekly-distribution-group'], context.prev);
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
    <section className="space-y-4">
      <div className="rounded-xl bg-success-container text-on-success-container px-6 py-5 flex items-center gap-4">
        <div className="p-3 rounded-full bg-success/20 shrink-0">
          <Truck className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-title-lg font-semibold">
            את/ה המחלק/ת השבוע
          </h2>
          {data.groupName && (
            <p className="text-body-sm opacity-80 mt-0.5">קבוצה: {data.groupName}</p>
          )}
        </div>
      </div>

      <div className="rounded-xl bg-surface-container px-5 py-4">
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

      {allDelivered && (
        <div className="rounded-xl bg-success-container text-on-success-container px-5 py-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 shrink-0" />
          <span className="text-body-md font-medium">כל המשפחות חולקו השבוע</span>
        </div>
      )}

      {families.length > 0 && (
        <div className="space-y-3">
          {families.map((family) => (
            <DistributorFamilyCard
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserMyGroupPage() {
  const { user } = useAuthStore();

  const groupViewQuery = useQuery({
    queryKey: ['user-group-view'],
    queryFn: async () => {
      const res = await api.get<{ data: GroupView }>('/me/group-view');
      return res.data.data;
    },
    enabled: !!user,
    retry: false,
  });

  // Check if the current user is this week's distributor
  const weeklyDistQuery = useQuery({
    queryKey: ['user-weekly-distribution-group'],
    queryFn: async () => {
      const res = await api.get<{ data: WeeklyDistribution }>('/me/weekly-distribution');
      return res.data.data;
    },
    enabled: !!user,
  });

  if (groupViewQuery.isLoading) return <PageSkeleton />;

  // No group — show message (API returned 403 or no data)
  if (groupViewQuery.isError || !groupViewQuery.data) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <Users className="h-16 w-16 text-on-surface-variant/30" />
        <p className="text-body-lg text-on-surface-variant">אינך משויך לקבוצה</p>
        <Link
          href="/user/dashboard"
          className="text-primary text-body-md underline underline-offset-2"
        >
          חזור לדף הבית
        </Link>
      </div>
    );
  }

  const groupView = groupViewQuery.data;
  if (!groupView) return null;

  const { group, members, currentDistributor } = groupView;
  const isCurrentDistributor = weeklyDistQuery.data?.isDistributor === true;

  const membersForList = members.map((m) => ({
    userId: m.userId,
    fullName: m.fullName,
    phone: '',
    paidThisMonth: m.paidThisMonth,
    currentMonthPaymentDate: null,
  }));

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-3xl">

      {/* Header */}
      <h1 className="text-headline-md sm:text-headline-lg font-headline text-on-surface">
        הקבוצה שלי – {group.name}
      </h1>

      {/* Current distributor */}
      <CurrentWeekDistributorCard
        assigned={!!currentDistributor}
        fullName={currentDistributor?.fullName}
        phone={currentDistributor?.phone}
      />

      {/* Distributor delivery section — shown when user IS the current week distributor */}
      {isCurrentDistributor && weeklyDistQuery.data && (
        <DistributorSection data={weeklyDistQuery.data} />
      )}

      {/* Members list — without payment status */}
      <MembersList
        members={membersForList}
        showPaidStatus={false}
        showRole={false}
        currentUserId={user?.id}
      />
    </div>
  );
}
