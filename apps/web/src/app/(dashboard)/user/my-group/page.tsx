'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Users } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
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

interface GroupView {
  group: { id: string; name: string };
  members: GroupViewMember[];
  currentDistributor: GroupViewCurrentDistributor | null;
  families: unknown[];
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

  // Map members to MembersList expected shape — phone is not returned from group-view,
  // so we pass an empty string and MembersList renders the phone row as empty.
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

      {/* Members list */}
      <MembersList
        members={membersForList}
        showPaidStatus={true}
        showRole={false}
        currentUserId={user?.id}
      />
    </div>
  );
}
