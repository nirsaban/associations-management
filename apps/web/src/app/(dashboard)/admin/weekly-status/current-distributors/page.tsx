'use client';

import React from 'react';
import { Truck, ArrowRight, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface DistributorAssignment {
  groupId: string;
  groupName: string;
  distributorId: string;
  distributorName: string;
  assignedAt: string;
}

export default function CurrentDistributorsPage() {
  const { user } = useAuthStore();

  const { data, isLoading, isError } = useQuery<{ data: DistributorAssignment[] }>({
    queryKey: ['admin', 'weekly-status', 'current-distributors'],
    queryFn: async () => {
      const res = await api.get('/admin/weekly-status/current-distributors');
      return res.data;
    },
    enabled: !!user,
  });

  const distributors = data?.data ?? [];

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto w-full" dir="rtl">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-3">
        <Link href="/admin" className="btn-ghost p-2 rounded-full shrink-0">
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-on-surface">מחלקים שבועיים</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">
            רשימת המחלקים השבועיים המשובצים לשבוע הנוכחי
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card-elevated p-4 text-center">
          <p className="text-display-sm font-bold text-primary">{distributors.length}</p>
          <p className="text-body-sm text-on-surface-variant">קבוצות עם מחלק</p>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-elevated animate-pulse rounded-xl h-16" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="card-elevated rounded-xl p-6 flex items-center gap-3 text-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">שגיאה בטעינת הנתונים</p>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && distributors.length === 0 && (
        <div className="card-elevated rounded-xl flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
          <Truck className="w-12 h-12 opacity-30" />
          <p className="text-body-md">אין מחלקים שבועיים משובצים לשבוע זה</p>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && distributors.length > 0 && (
        <>
          {/* Desktop */}
          <div className="hidden sm:block card-elevated rounded-xl overflow-x-auto">
            <table className="w-full text-sm text-on-surface min-w-[560px]">
              <thead className="bg-surface-variant/50 text-on-surface-variant text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">קבוצה</th>
                  <th className="px-4 py-3 text-start font-medium">מחלק/ת שבועי/ת</th>
                  <th className="px-4 py-3 text-start font-medium whitespace-nowrap">שובץ בתאריך</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/20">
                {distributors.map((d) => (
                  <tr key={d.groupId} className="hover:bg-surface-variant/20 transition-colors">
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-on-surface-variant shrink-0" />
                        <span className="truncate">{d.groupName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium text-primary truncate">{d.distributorName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                      {format(new Date(d.assignedAt), 'dd בMMMM yyyy, HH:mm', { locale: he })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="flex flex-col gap-3 sm:hidden">
            {distributors.map((d) => (
              <div key={d.groupId} className="card-elevated rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-on-surface-variant" />
                  <p className="font-medium text-on-surface">{d.groupName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">{d.distributorName}</span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  שובץ: {format(new Date(d.assignedAt), 'dd בMMMM yyyy, HH:mm', { locale: he })}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
