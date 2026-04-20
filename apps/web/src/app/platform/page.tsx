'use client';

import Link from 'next/link';
import { useOverview } from '@/hooks/usePlatform';

function StatCard({
  label,
  value,
  color = 'primary',
}: {
  label: string;
  value: number;
  color?: 'primary' | 'secondary' | 'error' | 'tertiary';
}) {
  const bgMap = {
    primary: 'bg-primary-fixed/30',
    secondary: 'bg-secondary-container/40',
    error: 'bg-error-container/40',
    tertiary: 'bg-tertiary-fixed/30',
  };

  const textMap = {
    primary: 'text-primary',
    secondary: 'text-secondary',
    error: 'text-error',
    tertiary: 'text-tertiary',
  };

  return (
    <div className={`rounded-xl p-5 ${bgMap[color]}`}>
      <p className="text-label-md text-on-surface-variant mb-1">{label}</p>
      <p className={`text-headline-sm font-headline ${textMap[color]}`}>{value}</p>
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="rounded-xl p-5 bg-surface-container animate-pulse h-20" />
      ))}
    </div>
  );
}

export default function PlatformDashboardPage() {
  const { data: overview, isLoading, isError } = useOverview();

  if (isLoading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-headline-md font-headline">סקירה כללית</h2>
        </div>
        <SkeletonCards />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="rounded-xl bg-error-container p-6 text-on-error-container">
        שגיאה בטעינת נתוני הפלטפורמה
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 sm:mb-8 gap-4">
        <h2 className="text-headline-sm sm:text-headline-md font-headline">סקירה כללית</h2>
        <Link
          href="/platform/organizations"
          className="text-label-sm sm:text-label-md text-primary hover:underline whitespace-nowrap"
        >
          נהל עמותות &larr;
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard label="סה״כ עמותות" value={overview.totalOrganizations} color="primary" />
        <StatCard label="עמותות פעילות" value={overview.activeOrganizations} color="secondary" />
        <StatCard label="עמותות לא פעילות" value={overview.inactiveOrganizations} color="error" />
        <StatCard label="סה״כ משתמשים" value={overview.totalUsers} color="primary" />
        <StatCard label="סה״כ מנהלים" value={overview.totalAdmins} color="tertiary" />
        <StatCard label="סה״כ קבוצות" value={overview.totalGroups} color="secondary" />
        <StatCard label="סה״כ משפחות" value={overview.totalFamilies} color="primary" />
        <StatCard label="לא שילמו החודש" value={overview.unpaidThisMonthAcrossPlatform} color="error" />
      </div>

      {/* Alert cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
          <p className="text-title-sm text-on-surface mb-1">
            הזמנות שבועיות חסרות
          </p>
          <p className="text-headline-sm font-headline text-tertiary">
            {overview.organizationsMissingWeeklyOrdersThisWeek} עמותות ללא הזמנות שבועיות השבוע
          </p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-5">
          <p className="text-title-sm text-on-surface mb-1">
            מחלקים שבועיים חסרים
          </p>
          <p className="text-headline-sm font-headline text-tertiary">
            {overview.organizationsMissingWeeklyDistributorThisWeek} עמותות ללא מחלק שבועי השבוע
          </p>
        </div>
      </div>
    </div>
  );
}
