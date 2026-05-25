'use client';

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, Bell, ArrowRight, Users } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';

interface GroupNoDistributor {
  groupId: string;
  groupName: string;
  managerId?: string | null;
  managerName?: string | null;
  lastActivity: string;
}

export default function NoDistributorPage() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery<{ data: GroupNoDistributor[] }>({
    queryKey: ['admin', 'weekly-status', 'no-distributor'],
    queryFn: async () => {
      const response = await api.get('/admin/weekly-status/no-distributor');
      return response.data;
    },
    enabled: !!user,
  });

  const alertMutation = useMutation({
    mutationFn: async (groupIds: string[]) => {
      const { data: result } = await api.post('/admin/weekly-status/alert-managers', {
        groupIds,
        title: 'תזכורת: שיבוץ מחלק שבועי',
        body: 'טרם שובץ מחלק שבועי לקבוצתך לשבוע הנוכחי. אנא שבצו מחלק בהקדם.',
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
          <div key={i} className="card h-20 animate-pulse bg-surface-container" />
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

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start sm:items-center gap-3">
        <Link href="/admin" className="btn-ghost p-2 rounded-full shrink-0">
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div className="min-w-0">
          <h1 className="text-headline-md font-headline">ללא מחלק שבועי</h1>
          <p className="text-body-sm text-on-surface-variant">
            קבוצות שטרם שובץ להן מחלק שבועי לשבוע הנוכחי
          </p>
        </div>
      </div>

      {/* Summary + bulk action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${
            groups.length > 0 ? 'bg-error/10 text-error' : 'bg-success/10 text-success'
          }`}>
            {groups.length} קבוצות ללא מחלק
          </span>
        </div>
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
          <Users className="w-12 h-12 opacity-20 mb-3" />
          <p className="text-body-md font-medium">כל הקבוצות שובצו מחלק שבועי</p>
          <p className="text-body-sm mt-1">אין פעולה נדרשת לשבוע הנוכחי</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <div
              key={group.groupId}
              className="card-elevated flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-body-md font-medium truncate">{group.groupName}</p>
                <p className="text-body-sm text-on-surface-variant truncate">
                  מנהל: {group.managerName || 'לא שובץ'}
                </p>
                <p className="text-label-sm text-on-surface-variant mt-1">
                  עדכון אחרון: {new Date(group.lastActivity).toLocaleDateString('he-IL')}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 sm:shrink-0">
                <Link
                  href={`/admin/groups`}
                  className="btn-outline btn-sm flex-1 sm:flex-none text-center whitespace-nowrap"
                >
                  פרטי קבוצה
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
          ))}
        </div>
      )}
    </div>
  );
}
