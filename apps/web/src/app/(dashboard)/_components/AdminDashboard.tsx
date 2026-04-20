'use client';

import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { Users, Home, CreditCard, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export function AdminDashboard() {
  const { adminDashboard } = useDashboard();
  const { data, isLoading, error } = adminDashboard;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-surface-container" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הדשבורד</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {/* Total Users */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">סה"כ משתמשים</p>
              <p className="text-headline-md font-bold text-primary">{data?.totalUsers || 0}</p>
            </div>
            <Users className="h-8 w-8 text-primary/20" />
          </div>
        </div>

        {/* Total Groups */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">קבוצות</p>
              <p className="text-headline-md font-bold text-secondary">{data?.totalGroups || 0}</p>
            </div>
            <Users className="h-8 w-8 text-secondary/20" />
          </div>
        </div>

        {/* Total Families */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">משפחות</p>
              <p className="text-headline-md font-bold text-tertiary">{data?.totalFamilies || 0}</p>
            </div>
            <Home className="h-8 w-8 text-tertiary/20" />
          </div>
        </div>

        {/* Pending Payments */}
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">תשלומים ממתינים</p>
              <p className="text-headline-md font-bold text-warning">
                {data?.pendingPayments || 0}
              </p>
            </div>
            <CreditCard className="h-8 w-8 text-warning/20" />
          </div>
        </div>
      </div>

      {/* Shortcuts */}
      <div>
        <h2 className="text-headline-sm sm:text-headline-md font-headline mb-3 sm:mb-4">קשורים מהירים</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
          <Link href="/admin/users" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-title-md font-medium mb-2">ניהול משתמשים</h3>
            <p className="text-body-sm text-on-surface-variant">צפה בכל המשתמשים וערוך הרשאות</p>
          </Link>

          <Link href="/admin/groups" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-title-md font-medium mb-2">קבוצות</h3>
            <p className="text-body-sm text-on-surface-variant">ניהול קבוצות וחברים</p>
          </Link>

          <Link href="/payments" className="card hover:shadow-lg transition-shadow">
            <h3 className="text-title-md font-medium mb-2">תשלומים</h3>
            <p className="text-body-sm text-on-surface-variant">ניהול תשלומים ודוחות כספיים</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
