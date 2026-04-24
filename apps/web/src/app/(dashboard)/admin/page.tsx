'use client';

import React, { useState } from 'react';
import { Users, Home, CreditCard, AlertCircle, Bell, Upload, Send, Trash2, X, ChevronDown, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';

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

interface GroupWeeklyStatus {
  groupId: string;
  groupName: string;
  managerName?: string | null;
  totalFamilies: number;
  completedOrders: number;
  pendingOrders: number;
  distributorName?: string;
  hasDistributor: boolean;
}

type AlertAudience = 'ALL_USERS' | 'GROUP_MANAGERS';

interface Alert {
  id: string;
  title: string;
  body: string;
  audience: AlertAudience;
  createdAt: string;
  deliveredCount: number;
  recipientCount: number;
}

const AUDIENCE_LABELS: Record<AlertAudience, string> = {
  ALL_USERS: 'כל המשתמשים',
  GROUP_MANAGERS: 'מנהלי קבוצה',
};

export default function AdminDashboardPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-dashboard', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: AdminDashboardData }>('/admin/dashboard');
      return response.data.data;
    },
    enabled: !!user,
  });

  // Weekly status per group
  const { data: weeklyGroups } = useQuery<GroupWeeklyStatus[]>({
    queryKey: ['admin', 'weekly-status'],
    queryFn: async () => {
      const response = await api.get<{ data: GroupWeeklyStatus[] }>('/admin/weekly-status');
      return response.data.data;
    },
    enabled: !!user,
  });
  const [openGroupIds, setOpenGroupIds] = useState<Set<string>>(new Set());
  const toggleGroup = (groupId: string) => {
    setOpenGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  // Alerts / Publish Messages
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [alertForm, setAlertForm] = useState({ title: '', body: '', audience: 'ALL_USERS' as AlertAudience });

  const { data: alertsData } = useQuery<{ data: Alert[] }>({
    queryKey: ['admin', 'alerts', 'recent'],
    queryFn: async () => {
      const { data } = await api.get('/admin/alerts', { params: { page: 1, limit: 5 } });
      return data;
    },
    enabled: !!user,
  });

  const createAlertMutation = useMutation({
    mutationFn: async (payload: { title: string; body: string; audience: AlertAudience }) => {
      const { data } = await api.post('/admin/alerts', payload);
      return data;
    },
    onSuccess: () => {
      showToast('ההודעה פורסמה בהצלחה', 'success');
      setShowAlertForm(false);
      setAlertForm({ title: '', body: '', audience: 'ALL_USERS' });
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] });
    },
    onError: () => {
      showToast('שגיאה בפרסום ההודעה', 'error');
    },
  });

  const deleteAlertMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/admin/alerts/${id}`); },
    onSuccess: () => {
      showToast('ההודעה נמחקה', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] });
    },
    onError: () => {
      showToast('שגיאה במחיקת ההודעה', 'error');
    },
  });

  function handlePublish(e: React.FormEvent) {
    e.preventDefault();
    if (!alertForm.title.trim() || !alertForm.body.trim()) return;
    createAlertMutation.mutate({ title: alertForm.title.trim(), body: alertForm.body.trim(), audience: alertForm.audience });
  }

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

  const revenueTrendColor = (data?.revenue.trend ?? 0) >= 0 ? 'text-success' : 'text-error';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md sm:text-headline-lg font-headline mb-1 sm:mb-2">דשבורד ניהול</h1>
        <p className="text-body-sm sm:text-body-md text-on-surface-variant">סקירת מערכת ונתונים ארגוניים</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
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

      {/* Publish Messages Section */}
      <div className="card-elevated">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-lg font-medium flex items-center gap-3">
            <Bell className="h-6 w-6 text-tertiary" />
            פרסום הודעות
          </h2>
          <div className="flex items-center gap-2">
            <Link href="/admin/alerts" className="btn-outline btn-sm">
              כל ההודעות
            </Link>
            {!showAlertForm && (
              <button
                type="button"
                onClick={() => setShowAlertForm(true)}
                className="btn-primary btn-sm flex items-center gap-1"
              >
                <Send className="h-4 w-4" />
                הודעה חדשה
              </button>
            )}
          </div>
        </div>

        {/* Inline Create Form */}
        {showAlertForm && (
          <form onSubmit={handlePublish} className="mb-6 p-4 rounded-lg bg-surface-container space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-title-sm font-medium">הודעה חדשה</p>
              <button
                type="button"
                onClick={() => setShowAlertForm(false)}
                className="btn-ghost p-1 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              placeholder="כותרת ההודעה"
              value={alertForm.title}
              onChange={(e) => setAlertForm((f) => ({ ...f, title: e.target.value }))}
              className="w-full rounded-lg border border-outline px-3 py-2 text-body-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            <textarea
              rows={3}
              placeholder="תוכן ההודעה..."
              value={alertForm.body}
              onChange={(e) => setAlertForm((f) => ({ ...f, body: e.target.value }))}
              className="w-full rounded-lg border border-outline px-3 py-2 text-body-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
            />
            <div className="flex items-center gap-4">
              <span className="text-label-md text-on-surface-variant">קהל יעד:</span>
              {(['ALL_USERS', 'GROUP_MANAGERS'] as AlertAudience[]).map((opt) => (
                <label key={opt} className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="audience"
                    value={opt}
                    checked={alertForm.audience === opt}
                    onChange={() => setAlertForm((f) => ({ ...f, audience: opt }))}
                    className="accent-primary"
                  />
                  <span className="text-body-sm">{AUDIENCE_LABELS[opt]}</span>
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={createAlertMutation.isPending || !alertForm.title.trim() || !alertForm.body.trim()}
                className="btn-primary btn-sm flex items-center gap-1"
              >
                <Send className="h-4 w-4" />
                {createAlertMutation.isPending ? 'שולח...' : 'פרסם'}
              </button>
              <button
                type="button"
                onClick={() => setShowAlertForm(false)}
                className="btn-outline btn-sm"
              >
                ביטול
              </button>
            </div>
          </form>
        )}

        {/* Recent Alerts List */}
        {alertsData?.data && alertsData.data.length > 0 ? (
          <div className="space-y-2">
            {alertsData.data.map((alert) => (
              <div
                key={alert.id}
                className="p-3 rounded-lg bg-surface-container flex items-start justify-between gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-body-md font-medium truncate">{alert.title}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 ${
                        alert.audience === 'ALL_USERS'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-tertiary/10 text-tertiary'
                      }`}
                    >
                      {AUDIENCE_LABELS[alert.audience]}
                    </span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant line-clamp-1">{alert.body}</p>
                  <p className="text-label-sm text-on-surface-variant mt-1">
                    נשלח: {alert.deliveredCount}/{alert.recipientCount}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('האם למחוק הודעה זו?')) deleteAlertMutation.mutate(alert.id);
                  }}
                  disabled={deleteAlertMutation.isPending}
                  className="btn-ghost p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant">
            <Bell className="w-10 h-10 opacity-20 mb-2" />
            <p className="text-body-sm">אין הודעות שפורסמו</p>
          </div>
        )}
      </div>

      {/* Weekly Status - Accordion per group */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-4">סטטוס שבועי</h2>

        {/* Summary row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className={`p-3 rounded-lg text-center ${
            (data?.weeklyStatus.totalGroups ?? 0) - (data?.weeklyStatus.groupsWithDistributor ?? 0) > 0
              ? 'bg-error-container/30'
              : 'bg-success-container/30'
          }`}>
            <p className="text-label-sm text-on-surface-variant">ללא מחלק שבועי</p>
            <p className="text-title-lg font-bold">
              {(data?.weeklyStatus.totalGroups ?? 0) - (data?.weeklyStatus.groupsWithDistributor ?? 0)}
              <span className="text-body-sm text-on-surface-variant font-normal"> / {data?.weeklyStatus.totalGroups || 0} קבוצות</span>
            </p>
          </div>
          <div className={`p-3 rounded-lg text-center ${
            (data?.weeklyStatus.totalOrders ?? 0) - (data?.weeklyStatus.completedOrders ?? 0) > 0
              ? 'bg-error-container/30'
              : 'bg-success-container/30'
          }`}>
            <p className="text-label-sm text-on-surface-variant">הזמנות שלא הושלמו</p>
            <p className="text-title-lg font-bold">
              {(data?.weeklyStatus.totalOrders ?? 0) - (data?.weeklyStatus.completedOrders ?? 0)}
              <span className="text-body-sm text-on-surface-variant font-normal"> / {data?.weeklyStatus.totalOrders || 0} הזמנות</span>
            </p>
          </div>
        </div>

        {/* Per-group accordion */}
        <div className="divide-y divide-outline-variant rounded-lg border border-outline-variant overflow-hidden">
          {weeklyGroups?.map((group) => {
            const isOpen = openGroupIds.has(group.groupId);
            const ordersComplete = group.totalFamilies > 0 && group.completedOrders >= group.totalFamilies;
            return (
              <div key={group.groupId}>
                <button
                  onClick={() => toggleGroup(group.groupId)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface-container-high transition-colors text-right"
                >
                  <div className="flex items-center gap-3">
                    <ChevronDown className={`h-4 w-4 text-on-surface-variant transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    <div className="flex items-center gap-2">
                      {ordersComplete ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-error" />
                      )}
                      {group.hasDistributor ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-error" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1 text-right mr-2">
                    <p className="text-title-sm font-medium">{group.groupName}</p>
                    <p className="text-body-sm text-on-surface-variant">{group.managerName || 'ללא מנהל'}</p>
                  </div>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 bg-surface-container-low">
                    <div className="grid grid-cols-2 gap-3 text-body-sm">
                      <div className="flex items-center gap-2">
                        {ordersComplete ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-error" />}
                        <span>הזמנות: {group.completedOrders} / {group.totalFamilies}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {group.hasDistributor ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-error" />}
                        <span>מחלק: {group.distributorName || 'לא שובץ'}</span>
                      </div>
                      {group.pendingOrders > 0 && (
                        <div className="col-span-2 text-warning text-label-sm">
                          {group.pendingOrders} הזמנות ממתינות
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {(!weeklyGroups || weeklyGroups.length === 0) && (
            <div className="p-4 text-center text-body-sm text-on-surface-variant">אין קבוצות</div>
          )}
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
            <Link href="/admin/groups" className="btn-outline btn-sm">
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          <Link href="/admin/users" className="card hover:shadow-lg transition-shadow">
            <Users className="h-8 w-8 text-primary mb-3" />
            <h3 className="text-title-md font-medium mb-2">ניהול משתמשים</h3>
            <p className="text-body-sm text-on-surface-variant">צפייה ועריכת משתמשים</p>
          </Link>

          <Link href="/admin/groups" className="card hover:shadow-lg transition-shadow">
            <Users className="h-8 w-8 text-secondary mb-3" />
            <h3 className="text-title-md font-medium mb-2">ניהול קבוצות</h3>
            <p className="text-body-sm text-on-surface-variant">קבוצות, מנהלים וחברים</p>
          </Link>

          <Link href="/admin/families" className="card hover:shadow-lg transition-shadow">
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

          <Link href="/admin/alerts" className="card hover:shadow-lg transition-shadow">
            <Bell className="h-8 w-8 text-tertiary mb-3" />
            <h3 className="text-title-md font-medium mb-2">התראות</h3>
            <p className="text-body-sm text-on-surface-variant">שליחת התראות והודעות</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
