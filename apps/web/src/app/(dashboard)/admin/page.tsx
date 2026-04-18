'use client';

import React from 'react';
import { Users, Home, CreditCard, AlertCircle, Bell, Upload } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface AdminDashboardData {
  stats: {
    totalUsers: number;
    totalGroups: number;
    totalFamilies: number;
    unpaidUsersThisMonth: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    trend: number;
  };
  groupsOverview: Array<{
    id: string;
    name: string;
    memberCount: number;
    familyCount: number;
    managerName?: string;
  }>;
  weeklyStatus: {
    groupsWithDistributor: number;
    totalGroups: number;
    completedOrders: number;
    totalOrders: number;
  };
}

export default function AdminDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: AdminDashboardData }>('/admin/dashboard');
      return response.data.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-surface-container" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הדשבורד</span>
        </div>
      </div>
    );
  }

  const revenueTrendColor = (data?.revenue.trend ?? 0) >= 0 ? 'text-success' : 'text-error';

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-lg font-headline mb-2">דשבורד ניהול</h1>
        <p className="text-body-md text-on-surface-variant">סקירת מערכת ונתונים ארגוניים</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        {/* Total Users */}
        <div className="card-elevated">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">סה"כ משתמשים</p>
              <p className="text-headline-lg font-bold text-primary">
                {data?.stats.totalUsers || 0}
              </p>
            </div>
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </div>

        {/* Total Groups */}
        <div className="card-elevated">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">קבוצות</p>
              <p className="text-headline-lg font-bold text-secondary">
                {data?.stats.totalGroups || 0}
              </p>
            </div>
            <div className="p-2 rounded-full bg-secondary/10">
              <Users className="h-6 w-6 text-secondary" />
            </div>
          </div>
        </div>

        {/* Total Families */}
        <div className="card-elevated">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">משפחות</p>
              <p className="text-headline-lg font-bold text-tertiary">
                {data?.stats.totalFamilies || 0}
              </p>
            </div>
            <div className="p-2 rounded-full bg-tertiary/10">
              <Home className="h-6 w-6 text-tertiary" />
            </div>
          </div>
        </div>

        {/* Unpaid Users */}
        <Link href="/admin/payments" className="card-elevated hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">טרם שילמו החודש</p>
              <p className="text-headline-lg font-bold text-warning">
                {data?.stats.unpaidUsersThisMonth || 0}
              </p>
            </div>
            <div className="p-2 rounded-full bg-warning/10">
              <CreditCard className="h-6 w-6 text-warning" />
            </div>
          </div>
        </Link>
      </div>

      {/* Revenue Card */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          סיכום הכנסות
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-1">החודש הנוכחי</p>
            <p className="text-headline-md font-bold">
              ₪{data?.revenue.thisMonth.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-1">החודש הקודם</p>
            <p className="text-headline-md font-bold">
              ₪{data?.revenue.lastMonth.toLocaleString() || 0}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-1">מגמה</p>
            <p className={`text-headline-md font-bold ${revenueTrendColor}`}>
              {(data?.revenue.trend ?? 0) >= 0 ? '+' : ''}
              {data?.revenue.trend.toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Weekly Status */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6">סטטוס שבועי</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-2">מחלקים שבועיים</p>
            <div className="flex items-baseline gap-2">
              <p className="text-headline-md font-bold">
                {data?.weeklyStatus.groupsWithDistributor || 0}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                מתוך {data?.weeklyStatus.totalGroups || 0} קבוצות
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-surface-container">
            <p className="text-label-sm text-on-surface-variant mb-2">הזמנות שבועיות</p>
            <div className="flex items-baseline gap-2">
              <p className="text-headline-md font-bold">
                {data?.weeklyStatus.completedOrders || 0}
              </p>
              <p className="text-body-sm text-on-surface-variant">
                מתוך {data?.weeklyStatus.totalOrders || 0} הזמנות
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Groups Overview */}
      {data?.groupsOverview && data.groupsOverview.length > 0 && (
        <div className="card-elevated">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-title-lg font-medium flex items-center gap-3">
              <Users className="h-6 w-6 text-secondary" />
              סקירת קבוצות
            </h2>
            <Link href="/groups" className="btn-outline btn-sm">
              צפייה בכל הקבוצות
            </Link>
          </div>

          <div className="space-y-3">
            {data.groupsOverview.slice(0, 5).map((group) => (
              <div
                key={group.id}
                className="p-4 rounded-lg bg-surface-container flex items-center justify-between"
              >
                <div>
                  <p className="text-body-md font-medium">{group.name}</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    מנהל: {group.managerName || 'לא שובץ'}
                  </p>
                </div>
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-label-sm text-on-surface-variant">חברים</p>
                    <p className="text-body-lg font-bold">{group.memberCount}</p>
                  </div>
                  <div>
                    <p className="text-label-sm text-on-surface-variant">משפחות</p>
                    <p className="text-body-lg font-bold">{group.familyCount}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-headline-md font-headline mb-4">פעולות מהירות</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/users" className="card hover:shadow-lg transition-shadow">
            <Users className="h-8 w-8 text-primary mb-3" />
            <h3 className="text-title-md font-medium mb-2">ניהול משתמשים</h3>
            <p className="text-body-sm text-on-surface-variant">צפייה ועריכת משתמשים</p>
          </Link>

          <Link href="/groups" className="card hover:shadow-lg transition-shadow">
            <Users className="h-8 w-8 text-secondary mb-3" />
            <h3 className="text-title-md font-medium mb-2">ניהול קבוצות</h3>
            <p className="text-body-sm text-on-surface-variant">קבוצות, מנהלים וחברים</p>
          </Link>

          <Link href="/families" className="card hover:shadow-lg transition-shadow">
            <Home className="h-8 w-8 text-tertiary mb-3" />
            <h3 className="text-title-md font-medium mb-2">ניהול משפחות</h3>
            <p className="text-body-sm text-on-surface-variant">הוספה ועריכת משפחות</p>
          </Link>

          <Link href="/payments" className="card hover:shadow-lg transition-shadow">
            <CreditCard className="h-8 w-8 text-primary mb-3" />
            <h3 className="text-title-md font-medium mb-2">תשלומים</h3>
            <p className="text-body-sm text-on-surface-variant">ניהול תשלומים ודוחות</p>
          </Link>

          <Link href="/admin/csv-import" className="card hover:shadow-lg transition-shadow">
            <Upload className="h-8 w-8 text-secondary mb-3" />
            <h3 className="text-title-md font-medium mb-2">ייבוא CSV</h3>
            <p className="text-body-sm text-on-surface-variant">ייבוא משתמשים, קבוצות ומשפחות</p>
          </Link>

          <Link href="/admin/push" className="card hover:shadow-lg transition-shadow">
            <Bell className="h-8 w-8 text-tertiary mb-3" />
            <h3 className="text-title-md font-medium mb-2">התראות</h3>
            <p className="text-body-sm text-on-surface-variant">שליחת התראות והודעות</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
