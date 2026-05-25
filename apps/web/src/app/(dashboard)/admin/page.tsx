'use client';

import React, { useState } from 'react';
import { Users, Home, CreditCard, AlertCircle, Bell, Upload, Send, Trash2, X, AlertTriangle, BookOpen, Save, Truck } from 'lucide-react';
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

interface WeeklyStatusNoDistributor {
  groupId: string;
  groupName: string;
  managerId?: string | null;
  managerName?: string | null;
  lastActivity: string;
}

interface WeeklyStatusIncompleteOrders {
  data: Array<{
    groupId: string;
    groupName: string;
    managerId?: string | null;
    managerName?: string | null;
    orderStatus?: string;
    completedOrders: number;
    totalOrders: number;
    lastUpdate: string;
  }>;
  meta: {
    totalGroups: number;
    incompleteGroups: number;
  };
}

type AlertAudience = 'ALL_USERS' | 'GROUP_MANAGERS' | 'UNPAID_THIS_MONTH' | 'CURRENT_DISTRIBUTORS';

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
  ALL_USERS: 'כל המשתמשים ומנהלי קבוצות',
  GROUP_MANAGERS: 'מנהלי קבוצות בלבד',
  UNPAID_THIS_MONTH: 'משתמשים שלא שילמו החודש',
  CURRENT_DISTRIBUTORS: 'מחלקים שבועיים נוכחיים בלבד',
};

const AUDIENCE_OPTIONS: AlertAudience[] = [
  'ALL_USERS',
  'UNPAID_THIS_MONTH',
  'CURRENT_DISTRIBUTORS',
  'GROUP_MANAGERS',
];

// ─── Template helpers (localStorage) ────────────────────────────────────────

const TEMPLATES_KEY = 'amutot-alert-templates';

interface AlertTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  audience: AlertAudience;
}

function getTemplates(): AlertTemplate[] {
  try { return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]'); }
  catch { return []; }
}

function saveTemplateToStorage(template: AlertTemplate): void {
  const templates = getTemplates();
  templates.push(template);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

function deleteTemplateFromStorage(id: string): void {
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(getTemplates().filter(t => t.id !== id)));
}


// ─── Dashboard Alert Composer (template-based) ──────────────────────────────

function DashboardAlertComposer({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { showToast } = useToast();
  const [form, setForm] = useState({ title: '', body: '', audience: 'ALL_USERS' as AlertAudience });
  const [templates, setTemplates] = useState<AlertTemplate[]>(() => getTemplates());
  const [showTemplates, setShowTemplates] = useState(false);

  const mutation = useMutation({
    mutationFn: async (payload: { title: string; body: string; audience: AlertAudience }) => {
      const { data } = await api.post('/admin/alerts', payload);
      return data;
    },
    onSuccess: () => { showToast('ההודעה פורסמה בהצלחה', 'success'); onSuccess(); },
    onError: () => { showToast('שגיאה בפרסום ההודעה', 'error'); },
  });

  return (
    <div className="mb-6 p-4 rounded-lg bg-surface-container space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-title-sm font-medium">הודעה חדשה</p>
        <button type="button" onClick={onClose} className="btn-ghost p-1 rounded-full">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Template bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="relative flex-1">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="btn-outline text-sm flex items-center gap-2 w-full justify-center whitespace-nowrap"
          >
            <BookOpen className="h-4 w-4 shrink-0" />
            בחר תבנית ({templates.length})
          </button>
          {showTemplates && templates.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
              {templates.map((t) => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-surface-container cursor-pointer gap-2">
                  <button type="button" onClick={() => { deleteTemplateFromStorage(t.id); setTemplates(getTemplates()); }} className="p-1 text-error hover:bg-error-container rounded shrink-0" aria-label="מחק תבנית">
                    <Trash2 className="h-3 w-3" />
                  </button>
                  <button type="button" onClick={() => { setForm({ title: t.title, body: t.body, audience: t.audience }); setShowTemplates(false); }} className="flex-1 text-right text-sm min-w-0 truncate">
                    {t.name}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => {
            if (!form.title.trim()) { showToast('נא למלא כותרת לפני שמירה', 'error'); return; }
            const name = prompt('שם התבנית:');
            if (!name) return;
            saveTemplateToStorage({ id: Date.now().toString(), name, title: form.title, body: form.body, audience: form.audience });
            setTemplates(getTemplates());
            showToast('התבנית נשמרה', 'success');
          }}
          className="btn-outline text-sm flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Save className="h-4 w-4 shrink-0" />
          שמור כתבנית
        </button>
      </div>

      {/* Form fields */}
      <input
        type="text"
        placeholder="כותרת ההודעה"
        value={form.title}
        onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
        className="w-full rounded-lg border border-outline px-3 py-2 text-body-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
      />
      <textarea
        rows={3}
        placeholder="תוכן ההודעה..."
        value={form.body}
        onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
        className="w-full rounded-lg border border-outline px-3 py-2 text-body-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
      />
      <div className="flex flex-col gap-1">
        <label className="text-label-md text-on-surface-variant">קהל יעד</label>
        <select
          value={form.audience}
          onChange={(e) => setForm((f) => ({ ...f, audience: e.target.value as AlertAudience }))}
          className="w-full rounded-lg border border-outline px-3 py-2 text-body-sm bg-surface text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
          dir="rtl"
        >
          {AUDIENCE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{AUDIENCE_LABELS[opt]}</option>
          ))}
        </select>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => {
            if (!form.title.trim() || !form.body.trim()) { showToast('נא למלא כותרת ותוכן', 'error'); return; }
            mutation.mutate(form);
          }}
          disabled={mutation.isPending}
          className="btn-primary btn-sm flex items-center gap-1"
        >
          <Send className="h-4 w-4" />
          {mutation.isPending ? 'שולח...' : 'פרסם'}
        </button>
        <button type="button" onClick={onClose} className="btn-outline btn-sm">ביטול</button>
      </div>
    </div>
  );
}

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

  // Weekly status — no distributor
  const { data: noDistributorData } = useQuery<{ data: WeeklyStatusNoDistributor[] }>({
    queryKey: ['admin', 'weekly-status', 'no-distributor'],
    queryFn: async () => {
      const response = await api.get('/admin/weekly-status/no-distributor');
      return response.data;
    },
    enabled: !!user,
  });

  // Weekly status — incomplete orders
  const { data: incompleteOrdersData } = useQuery<WeeklyStatusIncompleteOrders>({
    queryKey: ['admin', 'weekly-status', 'incomplete-orders'],
    queryFn: async () => {
      const response = await api.get('/admin/weekly-status/incomplete-orders');
      return response.data;
    },
    enabled: !!user,
  });

  // Alerts / Publish Messages
  const [showAlertForm, setShowAlertForm] = useState(false);
  const { data: alertsData } = useQuery<{ data: Alert[] }>({
    queryKey: ['admin', 'alerts', 'recent'],
    queryFn: async () => {
      const { data } = await api.get('/admin/alerts', { params: { page: 1, limit: 3 } });
      return data;
    },
    enabled: !!user,
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

  const alertManagersMutation = useMutation({
    mutationFn: async (payload: { groupIds: string[]; title: string; body: string }) => {
      const { data } = await api.post('/admin/weekly-status/alert-managers', payload);
      return data;
    },
    onSuccess: () => {
      showToast('ההתראה נשלחה למנהלים', 'success');
    },
    onError: () => {
      showToast('שגיאה בשליחת ההתראה', 'error');
    },
  });

  function handleAlertNoDistributorManagers() {
    const groupIds = (noDistributorData?.data ?? []).map((g) => g.groupId);
    if (groupIds.length === 0) return;
    alertManagersMutation.mutate({
      groupIds,
      title: 'תזכורת: שיבוץ מחלק שבועי',
      body: 'טרם שובץ מחלק שבועי לקבוצתך לשבוע הנוכחי. אנא שבצו מחלק בהקדם.',
    });
  }

  function handleAlertIncompleteOrdersManagers() {
    const groupIds = (incompleteOrdersData?.data ?? []).map((g) => g.groupId);
    if (groupIds.length === 0) return;
    alertManagersMutation.mutate({
      groupIds,
      title: 'תזכורת: השלמת הזמנות שבועיות',
      body: 'ישנן הזמנות שבועיות שטרם הושלמו בקבוצתך. אנא השלימו את ההזמנות.',
    });
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
  const noDistributorCount = noDistributorData?.data.length ?? 0;
  const incompleteCount = incompleteOrdersData?.meta.incompleteGroups ?? 0;
  const totalGroupsForOrders = incompleteOrdersData?.meta.totalGroups ?? 0;
  const completedGroupsCount = totalGroupsForOrders - incompleteCount;

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
        <Link href="/admin/users" className="card-elevated hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">סה&quot;כ משתמשים</p>
              <p className="text-headline-lg font-bold text-primary">
                {data?.stats.totalUsers || 0}
              </p>
            </div>
            <div className="p-2 rounded-full bg-primary/10">
              <Users className="h-6 w-6 text-primary" />
            </div>
          </div>
        </Link>

        {/* Total Groups */}
        <Link href="/admin/groups" className="card-elevated hover:shadow-lg transition-shadow">
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
        </Link>

        {/* Total Families */}
        <Link href="/admin/families" className="card-elevated hover:shadow-lg transition-shadow">
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
        </Link>

        {/* Unpaid Users */}
        <Link href="/admin/unpaid" className="card-elevated hover:shadow-lg transition-shadow">
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

      {/* Weekly Status Summary Cards */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-4 flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-warning" />
          סטטוס שבועי
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: No distributor */}
          <div className={`rounded-xl border p-4 flex flex-col gap-3 ${
            noDistributorCount > 0 ? 'border-error/30 bg-error-container/20' : 'border-success/30 bg-success-container/20'
          }`}>
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">ללא מחלק שבועי</p>
              <p className={`text-headline-md font-bold ${noDistributorCount > 0 ? 'text-error' : 'text-success'}`}>
                {noDistributorCount}
                <span className="text-body-sm text-on-surface-variant font-normal">
                  {' '}/ {data?.weeklyStatus.totalGroups || 0} קבוצות
                </span>
              </p>
            </div>
            <div className="flex flex-col md:flex-row flex-wrap gap-2 mt-auto">
              <Link
                href="/admin/weekly-status/no-distributor"
                className="btn-outline btn-sm flex-1 text-center whitespace-nowrap"
              >
                צפייה ברשימה
              </Link>
              <button
                type="button"
                onClick={handleAlertNoDistributorManagers}
                disabled={noDistributorCount === 0 || alertManagersMutation.isPending}
                className="btn-primary btn-sm flex items-center justify-center gap-1 disabled:opacity-50 whitespace-nowrap"
              >
                <Bell className="h-4 w-4 shrink-0" />
                <span>התראה למנהלים</span>
              </button>
            </div>
          </div>

          {/* Card 2: Incomplete orders */}
          <div className={`rounded-xl border p-4 flex flex-col gap-3 ${
            incompleteCount > 0 ? 'border-warning/30 bg-warning/10' : 'border-success/30 bg-success-container/20'
          }`}>
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">סטטוס הזמנות</p>
              <p className={`text-headline-md font-bold ${incompleteCount > 0 ? 'text-warning' : 'text-success'}`}>
                הושלמו {completedGroupsCount} מתוך {totalGroupsForOrders}
              </p>
              <p className="text-body-sm text-on-surface-variant">קבוצות עם הזמנות שלא הושלמו</p>
            </div>
            <div className="flex flex-col md:flex-row flex-wrap gap-2 mt-auto">
              <Link
                href="/admin/weekly-status/incomplete-orders"
                className="btn-outline btn-sm flex-1 text-center whitespace-nowrap"
              >
                צפייה ברשימה
              </Link>
              <button
                type="button"
                onClick={handleAlertIncompleteOrdersManagers}
                disabled={incompleteCount === 0 || alertManagersMutation.isPending}
                className="btn-primary btn-sm flex items-center justify-center gap-1 disabled:opacity-50 whitespace-nowrap"
              >
                <Bell className="h-4 w-4 shrink-0" />
                <span>התראה למנהלים</span>
              </button>
            </div>
          </div>

          {/* Card 3: Current distributors */}
          <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 flex flex-col gap-3 sm:col-span-2 lg:col-span-1">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">מחלקים שבועיים נוכחיים</p>
              <p className="text-headline-md font-bold text-primary flex items-center gap-2 flex-wrap">
                <Truck className="h-5 w-5 shrink-0" />
                {data?.weeklyStatus.groupsWithDistributor || 0}
                <span className="text-body-sm text-on-surface-variant font-normal">
                  / {data?.weeklyStatus.totalGroups || 0} קבוצות
                </span>
              </p>
            </div>
            <Link
              href="/admin/weekly-status/current-distributors"
              className="btn-primary btn-sm text-center whitespace-nowrap mt-auto"
            >
              צפייה ברשימה
            </Link>
          </div>
        </div>
      </div>

      {/* Publish Messages Section — full template-based composer */}
      <div className="card-elevated">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <h2 className="text-title-lg font-medium flex items-center gap-3 min-w-0">
            <Bell className="h-6 w-6 text-tertiary shrink-0" />
            <span className="truncate">פרסום הודעות</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/alerts/templates" className="btn-outline btn-sm flex items-center gap-1 whitespace-nowrap">
              <BookOpen className="h-4 w-4 shrink-0" />
              ניהול תבניות
            </Link>
            <Link href="/admin/alerts" className="btn-outline btn-sm whitespace-nowrap">
              הצג הכל
            </Link>
            {!showAlertForm && (
              <button type="button" onClick={() => setShowAlertForm(true)} className="btn-primary btn-sm flex items-center gap-1 whitespace-nowrap">
                <Send className="h-4 w-4 shrink-0" />
                הודעה חדשה
              </button>
            )}
          </div>
        </div>

        {/* Template-based composer */}
        {showAlertForm && (
          <DashboardAlertComposer
            onClose={() => setShowAlertForm(false)}
            onSuccess={() => {
              setShowAlertForm(false);
              queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] });
            }}
          />
        )}

        {/* Recent Alerts List (last 3) */}
        {alertsData?.data && alertsData.data.length > 0 ? (
          <div className="space-y-2">
            {alertsData.data.map((alert) => (
              <div key={alert.id} className="p-3 rounded-lg bg-surface-container flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                    <p className="text-body-md font-medium truncate min-w-0 flex-1">{alert.title}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium shrink-0 whitespace-nowrap ${
                      alert.audience === 'ALL_USERS' ? 'bg-primary/10 text-primary'
                        : alert.audience === 'UNPAID_THIS_MONTH' ? 'bg-warning/10 text-warning'
                        : alert.audience === 'CURRENT_DISTRIBUTORS' ? 'bg-secondary/10 text-secondary'
                        : 'bg-tertiary/10 text-tertiary'
                    }`}>{AUDIENCE_LABELS[alert.audience]}</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant line-clamp-1 break-words">{alert.body}</p>
                  <p className="text-label-sm text-on-surface-variant mt-1">נמענים: {alert.recipientCount}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { if (window.confirm('האם למחוק הודעה זו?')) deleteAlertMutation.mutate(alert.id); }}
                  disabled={deleteAlertMutation.isPending}
                  className="btn-ghost p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors shrink-0"
                  aria-label="מחק הודעה"
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
