'use client';

import React from 'react';
import { Users, Home, CheckCircle, Clock, AlertCircle, TruckIcon } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

interface ManagerGroupData {
  group: {
    id: string;
    name: string;
    memberCount: number;
    familyCount: number;
  };
  weeklyTasks: {
    weekKey: string;
    completedOrders: number;
    totalFamilies: number;
    missingOrders: Array<{
      familyId: string;
      familyName: string;
    }>;
    distributorAssigned: boolean;
    distributorName?: string;
  };
  membersSummary: {
    totalMembers: number;
    paidThisMonth: number;
    unpaidThisMonth: number;
  };
}

export default function ManagerDashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['manager-group', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: ManagerGroupData }>('/manager/group');
      return response.data.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-32 animate-pulse bg-surface-container" />
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

  const completionRate = data?.weeklyTasks?.totalFamilies
    ? Math.round((data.weeklyTasks.completedOrders / data.weeklyTasks.totalFamilies) * 100)
    : 0;

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-lg font-headline mb-2">דשבורד מנהל קבוצה</h1>
        <p className="text-body-md text-on-surface-variant">
          ניהול קבוצת {data?.group?.name}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Members Card */}
        <div className="card-elevated">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">חברי קבוצה</p>
              <p className="text-headline-lg font-bold text-primary">
                {data?.group?.memberCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
          </div>
          <Link href="/manager/members" className="btn-outline w-full">
            ניהול חברים
          </Link>
        </div>

        {/* Families Card */}
        <div className="card-elevated">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">משפחות</p>
              <p className="text-headline-lg font-bold text-secondary">
                {data?.group?.familyCount || 0}
              </p>
            </div>
            <div className="p-3 rounded-full bg-secondary/10">
              <Home className="h-8 w-8 text-secondary" />
            </div>
          </div>
          <Link href="/manager/families" className="btn-outline w-full">
            צפייה במשפחות
          </Link>
        </div>

        {/* Weekly Progress Card */}
        <div className="card-elevated">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">השלמת משימות</p>
              <p className="text-headline-lg font-bold text-tertiary">
                {completionRate}%
              </p>
            </div>
            <div className="p-3 rounded-full bg-tertiary/10">
              <CheckCircle className="h-8 w-8 text-tertiary" />
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            {data?.weeklyTasks?.completedOrders || 0} מתוך {data?.weeklyTasks?.totalFamilies || 0} הזמנות
          </p>
        </div>
      </div>

      {/* Weekly Tasks Status */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          משימות שבועיות - שבוע {data?.weeklyTasks?.weekKey}
        </h2>

        <div className="space-y-4">
          {/* Distributor Status */}
          <div className={`p-4 rounded-lg ${
            data?.weeklyTasks?.distributorAssigned
              ? 'bg-success-container text-on-success-container'
              : 'bg-warning-container text-on-warning-container'
          }`}>
            <div className="flex items-center gap-3 mb-2">
              <TruckIcon className="h-5 w-5" />
              <p className="font-medium">
                {data?.weeklyTasks?.distributorAssigned
                  ? `מחלק שובץ: ${data.weeklyTasks.distributorName}`
                  : 'טרם שובץ מחלק שבועי'
                }
              </p>
            </div>
            {!data?.weeklyTasks?.distributorAssigned && (
              <p className="text-body-sm mt-2">
                יש לשבץ מחלק מחברי הקבוצה עבור השבוע הנוכחי
              </p>
            )}
          </div>

          {/* Missing Orders */}
          {data?.weeklyTasks?.missingOrders && data.weeklyTasks.missingOrders.length > 0 && (
            <div className="p-4 rounded-lg bg-error-container text-on-error-container">
              <div className="flex items-center gap-3 mb-3">
                <AlertCircle className="h-5 w-5" />
                <p className="font-medium">
                  {data.weeklyTasks.missingOrders.length} הזמנות חסרות
                </p>
              </div>
              <div className="space-y-1">
                {data.weeklyTasks.missingOrders.map((family) => (
                  <div key={family.familyId} className="text-body-sm">
                    • {family.familyName}
                  </div>
                ))}
              </div>
            </div>
          )}

          {data?.weeklyTasks?.missingOrders?.length === 0 && (
            <div className="p-4 rounded-lg bg-success-container text-on-success-container">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5" />
                <p className="font-medium">כל ההזמנות הושלמו</p>
              </div>
            </div>
          )}

          <Link href="/manager/weekly-orders" className="btn-primary w-full">
            ניהול הזמנות שבועיות
          </Link>
        </div>
      </div>

      {/* Members Payment Summary */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <Users className="h-6 w-6 text-secondary" />
          סטטוס תשלומים - חברים
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Paid Members */}
          <div className="p-4 rounded-lg bg-success-container text-on-success-container">
            <div className="flex items-center gap-3 mb-2">
              <CheckCircle className="h-6 w-6" />
              <div>
                <p className="text-label-sm">שילמו החודש</p>
                <p className="text-headline-md font-bold">
                  {data?.membersSummary?.paidThisMonth || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Unpaid Members */}
          <div className="p-4 rounded-lg bg-warning-container text-on-warning-container">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="h-6 w-6" />
              <div>
                <p className="text-label-sm">טרם שילמו</p>
                <p className="text-headline-md font-bold">
                  {data?.membersSummary?.unpaidThisMonth || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-surface-container">
          <p className="text-body-sm text-on-surface-variant">
            <strong>שים לב:</strong> ניתן לראות רק סטטוס תשלום (שולם/לא שולם) ולא סכומים.
            לפרטים מלאים יש לפנות למנהל המערכת.
          </p>
        </div>

        <Link href="/manager/members" className="btn-outline w-full mt-4">
          צפייה בכל החברים
        </Link>
      </div>
    </div>
  );
}
