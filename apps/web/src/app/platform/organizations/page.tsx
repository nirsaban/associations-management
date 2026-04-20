'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useOrganizations, useToggleOrganizationStatus, OrganizationListItem } from '@/hooks/usePlatform';
import { useToast } from '@/components/ui/Toast';

function StatusBadge({ status }: { status: string }) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-label-sm ${
        isActive
          ? 'bg-secondary-container text-secondary'
          : 'bg-surface-container-high text-on-surface-variant'
      }`}
    >
      {isActive ? 'פעיל' : 'לא פעיל'}
    </span>
  );
}

function SkeletonTable() {
  return (
    <div className="rounded-xl border border-outline-variant overflow-hidden">
      <div className="bg-surface-container-low px-6 py-3">
        <div className="h-4 bg-surface-container animate-pulse rounded w-full" />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="px-6 py-4 border-t border-outline-variant">
          <div className="h-4 bg-surface-container animate-pulse rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}

function StatusToggleButton({
  org,
  onToggled,
}: {
  org: OrganizationListItem;
  onToggled: () => void;
}) {
  const toggleStatus = useToggleOrganizationStatus();
  const { showToast } = useToast();
  const [optimisticStatus, setOptimisticStatus] = useState(org.status);

  const handleToggle = async () => {
    const newStatus = optimisticStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    setOptimisticStatus(newStatus); // optimistic
    try {
      await toggleStatus.mutateAsync({ id: org.id, status: newStatus });
      showToast(
        newStatus === 'ACTIVE' ? 'העמותה הופעלה' : 'העמותה הושבתה',
        'success',
      );
      onToggled();
    } catch {
      setOptimisticStatus(optimisticStatus); // rollback
      showToast('שגיאה בעדכון סטטוס', 'error');
    }
  };

  const isActive = optimisticStatus === 'ACTIVE';
  return (
    <button
      onClick={handleToggle}
      disabled={toggleStatus.isPending}
      className={`text-label-sm px-2 py-1 rounded transition-colors ${
        isActive
          ? 'text-error hover:bg-error-container/50'
          : 'text-secondary hover:bg-secondary-container/50'
      }`}
      title={isActive ? 'השבתה' : 'הפעלה'}
    >
      {isActive ? 'השבת' : 'הפעל'}
    </button>
  );
}

export default function OrganizationsListPage() {
  const router = useRouter();
  const { data, isLoading, isError, refetch } = useOrganizations({
    page: 1,
    limit: 100,
    status: 'all',
  });

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-headline-md font-headline">עמותות</h2>
        </div>
        <SkeletonTable />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-error-container p-6 text-on-error-container">
        שגיאה בטעינת רשימת העמותות
      </div>
    );
  }

  const orgs = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <h2 className="text-headline-sm sm:text-headline-md font-headline">עמותות</h2>
        <Link
          href="/platform/organizations/new"
          className="bg-primary text-on-primary px-3 sm:px-4 py-2 rounded-lg text-label-sm sm:text-label-md hover:bg-primary-container transition-colors whitespace-nowrap"
        >
          + עמותה חדשה
        </Link>
      </div>

      {orgs.length === 0 ? (
        <div className="rounded-xl border border-outline-variant p-8 sm:p-12 text-center">
          <p className="text-title-lg mb-2">אין עמותות במערכת</p>
          <p className="text-body-md text-on-surface-variant">
            צור עמותה חדשה כדי להתחיל
          </p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-4 md:hidden">
            {orgs.map((org) => (
              <div key={org.id} className="rounded-xl border border-outline-variant p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-body-md font-medium">{org.name}</h3>
                    <p className="text-label-sm font-mono text-on-surface-variant">{org.slug}</p>
                  </div>
                  <StatusBadge status={org.status} />
                </div>
                <div className="grid grid-cols-2 gap-2 text-body-sm">
                  <div className="bg-surface-container-low rounded-lg p-2">
                    <p className="text-label-sm text-on-surface-variant">משתמשים</p>
                    <p className="font-medium">{org.counts.usersCount}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-2">
                    <p className="text-label-sm text-on-surface-variant">קבוצות</p>
                    <p className="font-medium">{org.counts.groupsCount}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-2">
                    <p className="text-label-sm text-on-surface-variant">משפחות</p>
                    <p className="font-medium">{org.counts.familiesCount}</p>
                  </div>
                  <div className="bg-surface-container-low rounded-lg p-2">
                    <p className="text-label-sm text-on-surface-variant">לא שילמו</p>
                    <p className={`font-medium ${org.counts.unpaidThisMonthCount > 0 ? 'text-error' : ''}`}>
                      {org.counts.unpaidThisMonthCount}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-outline-variant">
                  <span className="text-label-sm text-on-surface-variant">
                    {new Date(org.createdAt).toLocaleDateString('he-IL')}
                  </span>
                  <div className="flex items-center gap-3">
                    <StatusToggleButton org={org} onToggled={refetch} />
                    <button
                      onClick={() => router.push(`/platform/organizations/${org.id}`)}
                      className="text-label-sm text-primary hover:underline"
                    >
                      צפייה
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block rounded-xl border border-outline-variant overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low">
                  <tr>
                    <th className="px-4 py-3 text-start text-label-md text-on-surface-variant">שם</th>
                    <th className="px-4 py-3 text-start text-label-md text-on-surface-variant">Slug</th>
                    <th className="px-4 py-3 text-start text-label-md text-on-surface-variant">סטטוס</th>
                    <th className="px-4 py-3 text-start text-label-md text-on-surface-variant">משתמשים</th>
                    <th className="px-4 py-3 text-start text-label-md text-on-surface-variant">קבוצות</th>
                    <th className="px-4 py-3 text-start text-label-md text-on-surface-variant">משפחות</th>
                    <th className="px-4 py-3 text-start text-label-md text-on-surface-variant">לא שילמו החודש</th>
                    <th className="px-4 py-3 text-start text-label-md text-on-surface-variant">תאריך הקמה</th>
                    <th className="px-4 py-3 text-start text-label-md text-on-surface-variant">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant">
                  {orgs.map((org) => (
                    <tr key={org.id} className="hover:bg-surface-container-low/50 transition-colors">
                      <td className="px-4 py-3 text-body-md font-medium">{org.name}</td>
                      <td className="px-4 py-3 text-body-sm font-mono text-on-surface-variant">
                        {org.slug}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={org.status} />
                      </td>
                      <td className="px-4 py-3 text-body-sm">{org.counts.usersCount}</td>
                      <td className="px-4 py-3 text-body-sm">{org.counts.groupsCount}</td>
                      <td className="px-4 py-3 text-body-sm">{org.counts.familiesCount}</td>
                      <td className="px-4 py-3 text-body-sm">
                        {org.counts.unpaidThisMonthCount > 0 ? (
                          <span className="text-error font-medium">{org.counts.unpaidThisMonthCount}</span>
                        ) : (
                          <span className="text-on-surface-variant">0</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-body-sm text-on-surface-variant">
                        {new Date(org.createdAt).toLocaleDateString('he-IL')}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <StatusToggleButton org={org} onToggled={refetch} />
                          <button
                            onClick={() => router.push(`/platform/organizations/${org.id}`)}
                            className="text-label-sm text-primary hover:underline"
                          >
                            צפייה
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
