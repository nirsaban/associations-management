'use client';

import React from 'react';
import Link from 'next/link';
import { useOrganization, useToggleOrganizationStatus } from '@/hooks/usePlatform';
import { useToast } from '@/components/ui/Toast';

export default function OrganizationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const { data: org, isLoading, isError, refetch } = useOrganization(id);
  const toggleStatus = useToggleOrganizationStatus();
  const { showToast } = useToast();

  const handleToggle = async () => {
    if (!org) return;
    const newStatus = org.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await toggleStatus.mutateAsync({ id: org.id, status: newStatus });
      showToast(newStatus === 'ACTIVE' ? 'העמותה הופעלה' : 'העמותה הושבתה', 'success');
      refetch();
    } catch {
      showToast('שגיאה בעדכון סטטוס', 'error');
    }
  };

  if (isLoading) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/platform/organizations" className="text-label-md text-primary hover:underline">
            &rarr; חזור לרשימה
          </Link>
        </div>
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 bg-surface-container animate-pulse rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !org) {
    return (
      <div>
        <div className="mb-6">
          <Link href="/platform/organizations" className="text-label-md text-primary hover:underline">
            &rarr; חזור לרשימה
          </Link>
        </div>
        <div className="rounded-xl bg-error-container p-6 text-on-error-container">
          שגיאה בטעינת פרטי העמותה
        </div>
      </div>
    );
  }

  const isActive = org.status === 'ACTIVE';

  return (
    <div>
      <div className="mb-6">
        <Link
          href="/platform/organizations"
          className="text-label-md text-primary hover:underline"
        >
          &rarr; חזור לרשימה
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h2 className="text-headline-sm sm:text-headline-md font-headline">{org.name}</h2>
          <p className="text-body-sm sm:text-body-md text-on-surface-variant font-mono">{org.slug}</p>
        </div>
        <button
          onClick={handleToggle}
          disabled={toggleStatus.isPending}
          className={`px-4 py-2 rounded-lg text-label-md transition-colors disabled:opacity-50 w-full sm:w-auto ${
            isActive
              ? 'bg-error-container text-error hover:bg-error-container/80'
              : 'bg-secondary-container text-secondary hover:bg-secondary-container/80'
          }`}
        >
          {toggleStatus.isPending ? '...' : isActive ? 'השבת עמותה' : 'הפעל עמותה'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Organization details */}
        <section className="rounded-xl border border-outline-variant p-6">
          <h3 className="text-title-md font-headline mb-4">פרטי עמותה</h3>
          <dl className="space-y-3">
            <DetailRow label="סטטוס">
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm ${
                  isActive
                    ? 'bg-secondary-container text-secondary'
                    : 'bg-surface-container-high text-on-surface-variant'
                }`}
              >
                {isActive ? 'פעיל' : 'לא פעיל'}
              </span>
            </DetailRow>
            <DetailRow label="הקמה הושלמה">
              {org.setupCompleted ? 'כן' : 'לא'}
            </DetailRow>
            <DetailRow label="טלפון">{org.contactPhone || '—'}</DetailRow>
            <DetailRow label="אימייל">{org.contactEmail || '—'}</DetailRow>
            <DetailRow label="כתובת">{org.address || '—'}</DetailRow>
            <DetailRow label="תאריך יצירה">
              {new Date(org.createdAt).toLocaleDateString('he-IL')}
            </DetailRow>
          </dl>
        </section>

        {/* Admins list */}
        <section className="rounded-xl border border-outline-variant p-6">
          <h3 className="text-title-md font-headline mb-4">מנהלים</h3>
          {org.admins.length > 0 ? (
            <div className="space-y-3">
              {org.admins.map((admin) => (
                <div key={admin.id} className="rounded-lg bg-surface-container-low p-4">
                  <p className="text-body-md font-medium">{admin.fullName}</p>
                  <p className="text-body-sm text-on-surface-variant font-mono">
                    {admin.phone}
                  </p>
                  {admin.email && (
                    <p className="text-body-sm text-on-surface-variant">
                      {admin.email}
                    </p>
                  )}
                  <p className="text-label-sm text-on-surface-variant mt-2">
                    רישום הושלם: {admin.registrationCompleted ? 'כן' : 'לא'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-body-md text-on-surface-variant italic">
              אין מנהלים עדיין
            </p>
          )}
        </section>

        {/* Counts */}
        <section className="rounded-xl border border-outline-variant p-6 md:col-span-2">
          <h3 className="text-title-md font-headline mb-4">נתונים</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CountCard label="משתמשים" value={org.counts.usersCount} />
            <CountCard label="קבוצות" value={org.counts.groupsCount} />
            <CountCard label="משפחות" value={org.counts.familiesCount} />
            <CountCard
              label="לא שילמו החודש"
              value={org.counts.unpaidThisMonthCount}
              highlight={org.counts.unpaidThisMonthCount > 0}
            />
          </div>
        </section>
      </div>
    </div>
  );
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="text-label-md text-on-surface-variant min-w-[100px]">{label}</dt>
      <dd className="text-body-md">{children}</dd>
    </div>
  );
}

function CountCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3 text-center">
      <p className={`text-headline-sm font-headline ${highlight ? 'text-error' : 'text-primary'}`}>
        {value}
      </p>
      <p className="text-label-sm text-on-surface-variant">{label}</p>
    </div>
  );
}
