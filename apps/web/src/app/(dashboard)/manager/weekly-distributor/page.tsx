'use client';

import React from 'react';
import {
  Truck,
  AlertCircle,
  CheckCircle,
  ChevronRight,
  User,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getCurrentWeekKey } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface MemberWorkload {
  userId: string;
  fullName: string;
  phone: string;
  timesAsDistributor: number;
}

interface DistributorWorkloadData {
  members: MemberWorkload[];
  highest: number;
  lowest: number;
}

interface WeeklyStatusData {
  weekStart: string;
  distributor: {
    assigned: boolean;
    userId?: string;
    fullName?: string;
    phone?: string;
  };
  lastThreeDistributors: Array<{
    userId: string;
    fullName: string;
    weekStart: string;
  }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-container ${className ?? ''}`} />
  );
}

/**
 * Given a weekKey like "2026-W17", compute the Monday-Sunday date range
 * and return a Hebrew-formatted string: "שבוע: 20/4 – 26/4"
 */
function getWeekLabel(weekKey: string): string {
  // Parse ISO week: year and week number
  const match = weekKey.match(/^(\d{4})-W(\d{2})$/);
  if (!match) return `שבוע: ${weekKey}`;

  const year = parseInt(match[1], 10);
  const week = parseInt(match[2], 10);

  // ISO 8601: week 1 is the week containing the first Thursday of the year.
  // Monday of week W: Jan 4 of year is always in week 1, so:
  const jan4 = new Date(year, 0, 4);
  // Day of week of Jan 4 (0=Sun, 1=Mon, ... 6=Sat) — get Monday of week 1
  const dayOfWeek = jan4.getDay(); // 0=Sun
  const monday1 = new Date(jan4);
  monday1.setDate(jan4.getDate() - ((dayOfWeek + 6) % 7));

  // Monday of weekKey
  const monday = new Date(monday1);
  monday.setDate(monday1.getDate() + (week - 1) * 7);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return `שבוע: ${fmt(monday)} – ${fmt(sunday)}`;
}

/**
 * Given a weekStart ISO date string, return a short "d/M – d/M" range label.
 */
function weekStartToRange(weekStart: string): string {
  const monday = new Date(weekStart);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()}/${d.getMonth() + 1}`;
  return `${fmt(monday)} – ${fmt(sunday)}`;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeeklyDistributorPage() {
  const { user } = useAuthStore();
  const weekKey = getCurrentWeekKey();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  // ── Queries ────────────────────────────────────────────────────────────────

  const workloadQuery = useQuery({
    queryKey: ['manager-distributor-workload'],
    queryFn: async () => {
      const res = await api.get<{ data: DistributorWorkloadData }>(
        '/manager/group/distributor-workload',
      );
      return res.data.data;
    },
    enabled: !!user,
  });

  const weeklyStatusQuery = useQuery({
    queryKey: ['manager-weekly-status'],
    queryFn: async () => {
      const res = await api.get<{ data: WeeklyStatusData }>('/manager/group/weekly-status');
      return res.data.data;
    },
    enabled: !!user,
  });

  // ── Mutation ───────────────────────────────────────────────────────────────

  const assignMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post('/manager/group/weekly-distributor', { userId, weekKey });
      return res.data;
    },
    onMutate: async (userId) => {
      // Optimistic update: mark new distributor in weekly status
      await queryClient.cancelQueries({ queryKey: ['manager-weekly-status'] });
      const previous = queryClient.getQueryData<WeeklyStatusData>(['manager-weekly-status']);

      const member = workloadQuery.data?.members.find((m) => m.userId === userId);
      if (member) {
        queryClient.setQueryData<WeeklyStatusData>(['manager-weekly-status'], (old) => {
          if (!old) return old;
          return {
            ...old,
            distributor: {
              assigned: true,
              userId: member.userId,
              fullName: member.fullName,
              phone: member.phone,
            },
          };
        });
      }
      return { previous };
    },
    onError: (_err, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['manager-weekly-status'], context.previous);
      }
      showToast('שגיאה במינוי המחלק', 'error');
    },
    onSuccess: () => {
      showToast('המחלק נקבע בהצלחה', 'success');
      queryClient.invalidateQueries({ queryKey: ['manager-weekly-status'] });
      queryClient.invalidateQueries({ queryKey: ['manager-distributor-workload'] });
    },
  });

  // ── Derived ────────────────────────────────────────────────────────────────

  const weekLabel = getWeekLabel(weekKey);
  const assignedUserId = weeklyStatusQuery.data?.distributor?.userId;
  const lastThree = weeklyStatusQuery.data?.lastThreeDistributors ?? [];

  // Sort members by timesAsDistributor ASC (fair rotation: least-used first)
  const sortedMembers = [...(workloadQuery.data?.members ?? [])].sort(
    (a, b) => a.timesAsDistributor - b.timesAsDistributor,
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-8 max-w-4xl">

      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/manager/dashboard"
          className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
          aria-label="חזור ללוח הבקרה"
        >
          <ChevronRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-headline-md sm:text-headline-lg font-headline mb-0.5">
            מחלק שבועי
          </h1>
          <p className="text-body-md text-on-surface-variant">{weekLabel}</p>
        </div>
      </div>

      {/* Current assignment summary */}
      {weeklyStatusQuery.isLoading ? (
        <Skeleton className="h-14 rounded-xl" />
      ) : weeklyStatusQuery.data?.distributor.assigned ? (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-secondary/10 border border-secondary/30 text-body-md">
          <Truck className="h-5 w-5 text-secondary shrink-0" />
          <span className="text-on-surface">
            מחלק השבוע:{' '}
            <strong className="font-semibold">
              {weeklyStatusQuery.data.distributor.fullName}
            </strong>
          </span>
          <CheckCircle className="h-4 w-4 text-secondary ms-auto shrink-0" />
        </div>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-warning-container text-on-warning-container text-body-md">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>טרם מונה מחלק לשבוע זה</span>
        </div>
      )}

      {/* "בחר מחלק" section */}
      <section aria-labelledby="select-distributor-heading">
        <h2
          id="select-distributor-heading"
          className="text-title-lg font-medium mb-4 text-on-surface"
        >
          בחר מחלק
        </h2>

        {workloadQuery.isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
        ) : workloadQuery.isError ? (
          <div className="rounded-lg bg-error-container px-5 py-4 text-on-error-container flex items-center gap-3">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>שגיאה בטעינת רשימת החברים</span>
          </div>
        ) : sortedMembers.length === 0 ? (
          <div className="text-center py-10 text-on-surface-variant">
            <User className="h-12 w-12 opacity-30 mx-auto mb-3" />
            <p className="text-body-lg">אין חברים בקבוצה</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {sortedMembers.map((member) => {
              const isAssigned = assignedUserId === member.userId;
              const isPending =
                assignMutation.isPending && assignMutation.variables === member.userId;

              return (
                <button
                  key={member.userId}
                  onClick={() => assignMutation.mutate(member.userId)}
                  disabled={assignMutation.isPending}
                  className={`w-full rounded-xl p-4 text-start transition-all duration-150 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    isAssigned
                      ? 'border-2 border-secondary bg-secondary/10'
                      : 'border-2 border-outline/20 bg-surface-container hover:border-primary/40 hover:bg-primary/5'
                  } ${isPending ? 'opacity-60' : ''}`}
                  aria-label={`בחר ${member.fullName} כמחלק`}
                  aria-pressed={isAssigned}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-title-sm font-medium text-on-surface truncate">
                        {member.fullName}
                      </p>
                      <p
                        className="text-body-sm text-on-surface-variant mt-0.5 font-mono"
                        dir="ltr"
                      >
                        {member.phone}
                      </p>
                      <p className="text-label-sm text-on-surface-variant mt-1.5">
                        נבחר כמחלק {member.timesAsDistributor} פעמים בשנה האחרונה
                      </p>
                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-2">
                      {isAssigned && (
                        <>
                          <CheckCircle className="h-5 w-5 text-secondary" />
                          <span className="px-2 py-0.5 rounded-full text-label-sm font-medium bg-secondary/10 text-secondary border border-secondary/20">
                            שבוע הנוכחי
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {isPending && (
                    <p className="mt-2 text-label-sm text-on-surface-variant">שומר...</p>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* "המחלקים האחרונים" section */}
      <section aria-labelledby="recent-distributors-heading">
        <h2
          id="recent-distributors-heading"
          className="text-title-lg font-medium mb-4 text-on-surface"
        >
          המחלקים האחרונים
        </h2>

        {weeklyStatusQuery.isLoading ? (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="min-w-[200px] h-16 shrink-0 rounded-xl" />
            ))}
          </div>
        ) : lastThree.length === 0 ? (
          <p className="text-body-md text-on-surface-variant py-4">
            אין מחלקים קודמים להצגה
          </p>
        ) : (
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1">
            {lastThree.map((entry, idx) => (
              <div
                key={`${entry.userId}-${idx}`}
                className="snap-start min-w-[200px] p-3 rounded-xl bg-surface-container shrink-0 border border-outline/10"
              >
                <p className="text-label-sm text-on-surface-variant mb-1" dir="ltr">
                  {weekStartToRange(entry.weekStart)}
                </p>
                <p className="text-body-md font-medium text-on-surface truncate">
                  {entry.fullName}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
