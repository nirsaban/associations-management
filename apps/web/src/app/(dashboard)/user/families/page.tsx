'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AlertCircle, Home } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { FamilyCard } from '@/components/group-experience';

// ─── Types ────────────────────────────────────────────────────────────────────

interface GroupViewFamily {
  id: string;
  name: string;
  contactPhone: string | null;
  address: string | null;
  childrenMinorCount: number | null;
  totalMemberCount: number | null;
  notes: string | null;
}

interface GroupView {
  group: { id: string; name: string };
  members: unknown[];
  currentDistributor: unknown;
  families: GroupViewFamily[];
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse rounded-lg bg-surface-container ${className ?? ''}`} />
  );
}

function PageSkeleton() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">
      <Skeleton className="h-9 w-48" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function UserFamiliesPage() {
  const { user } = useAuthStore();
  const hasGroup = !!user?.groupMembershipGroupId;

  const groupViewQuery = useQuery({
    queryKey: ['user-group-view'],
    queryFn: async () => {
      const res = await api.get<{ data: GroupView }>('/me/group-view');
      return res.data.data;
    },
    enabled: !!user && hasGroup,
  });

  // No group
  if (!hasGroup) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center">
        <Home className="h-16 w-16 text-on-surface-variant/30" />
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

  if (groupViewQuery.isLoading) return <PageSkeleton />;

  if (groupViewQuery.isError) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container text-on-error-container px-5 py-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span className="text-body-md">שגיאה בטעינת רשימת המשפחות</span>
        </div>
      </div>
    );
  }

  const families = groupViewQuery.data?.families ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-4xl">

      {/* Header */}
      <h1 className="text-headline-md sm:text-headline-lg font-headline text-on-surface">
        המשפחות שלי
      </h1>

      {families.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
          <Home className="h-16 w-16 text-on-surface-variant/30" />
          <p className="text-body-lg text-on-surface-variant">אין משפחות בקבוצה</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={{
                id: family.id,
                familyName: family.name,
                contactPhone: family.contactPhone,
                address: family.address,
                childrenMinorCount: family.childrenMinorCount,
                totalMemberCount: family.totalMemberCount,
                notes: family.notes,
              }}
              editable={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
