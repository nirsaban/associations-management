'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Bell, ArrowRight, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';

interface GroupIncompleteOrder {
  groupId: string;
  groupName: string;
  managerId?: string | null;
  managerName?: string | null;
  orderStatus?: string;
  completedOrders: number;
  totalOrders: number;
  lastUpdate: string;
}

interface IncompleteOrdersResponse {
  data: GroupIncompleteOrder[];
  meta: {
    totalGroups: number;
    incompleteGroups: number;
  };
}

export default function IncompleteOrdersPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<IncompleteOrdersResponse>({
    queryKey: ['admin', 'weekly-status', 'incomplete-orders'],
    queryFn: async () => {
      const response = await api.get('/admin/weekly-status/incomplete-orders');
      return response.data;
    },
    enabled: !!user,
  });

  const alertMutation = useMutation({
    mutationFn: async (groupIds: string[]) => {
      const { data: result } = await api.post('/admin/weekly-status/alert-managers', {
        groupIds,
        title: 'תזכורת: השלמת הזמנות שבועיות',
        body: 'ישנן הזמנות שבועיות שטרם הושלמו בקבוצתך. אנא השלימו את ההזמנות.',
      });
      return result;
    },
    onSuccess: () => {
      showToast('ההתראה נשלחה למנהלים', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] });
    },
    onError: () => {
      showToast('שגיאה בשליחת ההתראה', 'error');
    },
  });

  const groups = data?.data ?? [];
  const meta = data?.meta;

  function handleAlertAll() {
    const ids = groups.map((g) => g.groupId);
    if (ids.length === 0) return;
    alertMutation.mutate(ids);
  }

  function handleAlertOne(groupId: string) {
    alertMutation.mutate([groupId]);
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card h-24 animate-pulse bg-surface-container" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הנתונים</span>
        </div>
      </div>
    );
  }

  const completedGroups = (meta?.totalGroups ?? 0) - (meta?.incompleteGroups ?? 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-3">
        <Link href="/admin" className="btn-ghost p-2 rounded-full shrink-0">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-headline-md font-headline">הזמנות שלא הושלמו</h1>
          <p className="text-body-sm text-on-surface-variant">
            קבוצות שלא השלימו את ההזמנות השבועיות לשבוע הנוכחי
          </p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="card-elevated">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
            <span className="text-body-md whitespace-nowrap">
              <span className="font-bold text-success">{completedGroups}</span> קבוצות הושלמו
            </span>
          </div>
          <div className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-error shrink-0" />
            <span className="text-body-md whitespace-nowrap">
              <span className="font-bold text-error">{meta?.incompleteGroups ?? 0}</span> קבוצות לא הושלמו
            </span>
          </div>
          <div className="text-body-sm text-on-surface-variant whitespace-nowrap">
            מתוך {meta?.totalGroups ?? 0} קבוצות
          </div>
        </div>
      </div>

      {/* Bulk alert button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-body-sm text-on-surface-variant">
          {groups.length === 0 ? 'כל הקבוצות השלימו את ההזמנות' : `${groups.length} קבוצות ממתינות להשלמה`}
        </p>
        {groups.length > 0 && (
          <button
            type="button"
            onClick={handleAlertAll}
            disabled={alertMutation.isPending}
            className="btn-primary btn-sm flex items-center justify-center gap-2 w-full sm:w-auto"
          >
            <Bell className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap">
              {alertMutation.isPending ? 'שולח...' : 'התראה לכל המנהלים'}
            </span>
          </button>
        )}
      </div>

      {/* List */}
      {groups.length === 0 ? (
        <div className="card-elevated flex flex-col items-center justify-center py-16 text-on-surface-variant">
          <CheckCircle2 className="w-12 h-12 text-success opacity-60 mb-3" />
          <p className="text-body-md font-medium">כל ההזמנות הושלמו</p>
          <p className="text-body-sm mt-1">כל הקבוצות עמדו ביעד לשבוע הנוכחי</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isAllComplete = group.totalOrders > 0 && group.completedOrders >= group.totalOrders;
            return (
              <div
                key={group.groupId}
                className="card-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {isAllComplete ? (
                      <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-error shrink-0" />
                    )}
                    <p className="text-body-md font-medium truncate">{group.groupName}</p>
                  </div>
                  <p className="text-body-sm text-on-surface-variant truncate">
                    מנהל: {group.managerName || 'לא שובץ'}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1">
                    <p className="text-label-sm text-on-surface-variant whitespace-nowrap">
                      הושלמו: {group.completedOrders} / {group.totalOrders} הזמנות
                    </p>
                    {group.orderStatus && (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        group.orderStatus === 'COMPLETED'
                          ? 'bg-success/10 text-success'
                          : 'bg-warning/10 text-warning'
                      }`}>
                        {group.orderStatus === 'COMPLETED' ? 'הושלם' : 'טיוטה'}
                      </span>
                    )}
                    <p className="text-label-sm text-on-surface-variant whitespace-nowrap">
                      עדכון: {new Date(group.lastUpdate).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:shrink-0">
                  <Link
                    href="/admin/orders"
                    className="btn-outline btn-sm flex-1 sm:flex-none text-center whitespace-nowrap"
                  >
                    צפייה בהזמנות
                  </Link>
                  {group.managerId && (
                    <button
                      type="button"
                      onClick={() => handleAlertOne(group.groupId)}
                      disabled={alertMutation.isPending}
                      className="btn-primary btn-sm flex flex-1 sm:flex-none items-center justify-center gap-1 whitespace-nowrap"
                    >
                      <Bell className="h-4 w-4 shrink-0" />
                      התראה
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
