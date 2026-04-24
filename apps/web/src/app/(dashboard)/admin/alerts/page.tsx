'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2, X, AlertCircle, ChevronRight, ChevronLeft, Save, BookOpen } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type AlertAudience = 'ALL_USERS' | 'GROUP_MANAGERS';

interface Alert {
  id: string;
  title: string;
  body: string;
  audience: AlertAudience;
  expiresAt?: string | null;
  createdAt: string;
  deliveredCount: number;
  recipientCount: number;
}

interface AlertsResponse {
  data: Alert[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface CreateAlertForm {
  title: string;
  body: string;
  audience: AlertAudience;
  expiresAt: string;
}

interface AlertTemplate {
  id: string;
  name: string;
  title: string;
  body: string;
  audience: AlertAudience;
}

const TEMPLATES_KEY = 'amutot-alert-templates';

function getTemplates(): AlertTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(TEMPLATES_KEY) || '[]');
  } catch { return []; }
}

function saveTemplate(template: AlertTemplate): void {
  const templates = getTemplates();
  templates.push(template);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

function deleteTemplate(id: string): void {
  const templates = getTemplates().filter(t => t.id !== id);
  localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
}

// ─── Constants ────────────────────────────────────────────────────────────────

const AUDIENCE_LABELS: Record<AlertAudience, string> = {
  ALL_USERS: 'כל המשתמשים',
  GROUP_MANAGERS: 'מנהלי קבוצה',
};

const PAGE_LIMIT = 20;

// ─── Audience Badge ───────────────────────────────────────────────────────────

function AudienceBadge({ audience }: { audience: AlertAudience }) {
  const label = AUDIENCE_LABELS[audience];
  const cls =
    audience === 'ALL_USERS'
      ? 'bg-primary/10 text-primary'
      : 'bg-tertiary/10 text-tertiary';
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {label}
    </span>
  );
}

// ─── Create Modal ─────────────────────────────────────────────────────────────

interface CreateModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

function CreateAlertModal({ onClose, onSuccess }: CreateModalProps) {
  const { showToast } = useToast();
  const [form, setForm] = useState<CreateAlertForm>({
    title: '',
    body: '',
    audience: 'ALL_USERS',
    expiresAt: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateAlertForm, string>>>({});
  const [templates, setTemplates] = useState<AlertTemplate[]>(() => getTemplates());
  const [showTemplates, setShowTemplates] = useState(false);

  const handleLoadTemplate = (t: AlertTemplate) => {
    setForm({ title: t.title, body: t.body, audience: t.audience, expiresAt: '' });
    setShowTemplates(false);
  };

  const handleSaveTemplate = () => {
    if (!form.title.trim()) { showToast('נא למלא כותרת לפני שמירה', 'error'); return; }
    const name = prompt('שם התבנית:');
    if (!name) return;
    const template: AlertTemplate = {
      id: Date.now().toString(),
      name,
      title: form.title,
      body: form.body,
      audience: form.audience,
    };
    saveTemplate(template);
    setTemplates(getTemplates());
    showToast('התבנית נשמרה', 'success');
  };

  const handleDeleteTemplate = (id: string) => {
    deleteTemplate(id);
    setTemplates(getTemplates());
  };

  const mutation = useMutation({
    mutationFn: async (payload: Partial<CreateAlertForm>) => {
      const { data } = await api.post('/admin/alerts', payload);
      return data;
    },
    onSuccess: () => {
      showToast('נשלחה התראה', 'success');
      onSuccess();
    },
    onError: () => {
      showToast('שגיאה בשליחת ההתראה', 'error');
    },
  });

  function validate(): boolean {
    const newErrors: Partial<Record<keyof CreateAlertForm, string>> = {};
    if (!form.title.trim()) newErrors.title = 'כותרת היא שדה חובה';
    if (!form.body.trim()) newErrors.body = 'תוכן ההתראה הוא שדה חובה';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    const payload: Partial<CreateAlertForm> = {
      title: form.title.trim(),
      body: form.body.trim(),
      audience: form.audience,
    };
    if (form.expiresAt) payload.expiresAt = form.expiresAt;
    mutation.mutate(payload);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      dir="rtl"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Bottom sheet on mobile, centered card on desktop */}
      <div className="card-elevated w-full max-w-lg rounded-2xl p-6 sm:rounded-2xl fixed bottom-0 left-0 right-0 sm:static sm:bottom-auto sm:left-auto sm:right-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-on-surface">התראה חדשה</h2>
          <button
            type="button"
            onClick={onClose}
            className="btn-ghost p-2 rounded-full"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template bar */}
        <div className="flex items-center gap-2 mb-4">
          <div className="relative flex-1">
            <button
              type="button"
              onClick={() => setShowTemplates(!showTemplates)}
              className="btn-outline text-sm flex items-center gap-2 w-full justify-center"
            >
              <BookOpen className="h-4 w-4" />
              בחר תבנית ({templates.length})
            </button>
            {showTemplates && templates.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-outline rounded-lg shadow-lg z-10 max-h-48 overflow-auto">
                {templates.map((t) => (
                  <div key={t.id} className="flex items-center justify-between px-3 py-2 hover:bg-surface-container cursor-pointer">
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(t.id)}
                      className="p-1 text-error hover:bg-error-container rounded"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadTemplate(t)}
                      className="flex-1 text-right text-sm"
                    >
                      {t.name}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleSaveTemplate}
            className="btn-outline text-sm flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            שמור כתבנית
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {/* Title */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface-variant">כותרת</label>
            <input
              type="text"
              placeholder="כותרת ההתראה"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-on-surface bg-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 ${errors.title ? 'border-error' : 'border-outline'}`}
            />
            {errors.title && <p className="text-xs text-error">{errors.title}</p>}
          </div>

          {/* Body */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface-variant">תוכן</label>
            <textarea
              rows={4}
              placeholder="תוכן ההתראה..."
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              className={`w-full rounded-lg border px-3 py-2 text-sm text-on-surface bg-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none ${errors.body ? 'border-error' : 'border-outline'}`}
            />
            {errors.body && <p className="text-xs text-error">{errors.body}</p>}
          </div>

          {/* Audience */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-on-surface-variant">קהל יעד</label>
            <div className="flex flex-col gap-2 sm:flex-row sm:gap-6">
              {(['ALL_USERS', 'GROUP_MANAGERS'] as AlertAudience[]).map((opt) => (
                <label key={opt} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="audience"
                    value={opt}
                    checked={form.audience === opt}
                    onChange={() => setForm((f) => ({ ...f, audience: opt }))}
                    className="accent-primary"
                  />
                  <span className="text-sm text-on-surface">{AUDIENCE_LABELS[opt]}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Expiry date */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-on-surface-variant">
              תאריך תפוגה (אופציונלי)
            </label>
            <input
              type="date"
              value={form.expiresAt}
              onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
              className="w-full rounded-lg border border-outline px-3 py-2 text-sm text-on-surface bg-surface focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary flex-1"
            >
              {mutation.isPending ? 'שולח...' : 'שלח התראה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="btn-outline flex-1"
              disabled={mutation.isPending}
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAlertsPage() {
  useAuthStore(); // keep store connection
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // ── Fetch alerts ──────────────────────────────────────────────────────────

  const {
    data,
    isLoading,
    isError,
  } = useQuery<AlertsResponse>({
    queryKey: ['admin', 'alerts', page],
    queryFn: async () => {
      const { data } = await api.get('/admin/alerts', {
        params: { page, limit: PAGE_LIMIT },
      });
      return data;
    },
  });

  // ── Delete mutation ───────────────────────────────────────────────────────

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/alerts/${id}`);
    },
    onSuccess: () => {
      showToast('ההתראה נמחקה', 'success');
      queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] });
    },
    onError: () => {
      showToast('שגיאה במחיקת ההתראה', 'error');
    },
  });

  function handleDelete(alert: Alert) {
    if (!window.confirm('האם למחוק התראה זו?')) return;
    deleteMutation.mutate(alert.id);
  }

  function handleCreateSuccess() {
    setShowCreateModal(false);
    queryClient.invalidateQueries({ queryKey: ['admin', 'alerts'] });
  }

  const alerts = data?.data ?? [];
  const total = data?.meta.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_LIMIT);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">התראות</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">ניהול התראות למשתמשי העמותה</p>
        </div>
        <button
          type="button"
          className="btn-primary mt-3 sm:mt-0 self-start sm:self-auto"
          onClick={() => setShowCreateModal(true)}
        >
          + התראה חדשה
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card-elevated animate-pulse rounded-xl h-16" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && !isLoading && (
        <div className="card-elevated rounded-xl p-6 flex items-center gap-3 text-error">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">שגיאה בטעינת ההתראות. אנא נסה שנית.</p>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !isError && alerts.length === 0 && (
        <div className="card-elevated rounded-xl flex flex-col items-center justify-center gap-3 py-16 text-on-surface-variant">
          <Bell className="w-12 h-12 opacity-30" />
          <p className="text-sm">אין התראות להצגה</p>
        </div>
      )}

      {/* Desktop table */}
      {!isLoading && !isError && alerts.length > 0 && (
        <>
          <div className="hidden sm:block card-elevated rounded-xl overflow-hidden">
            <table className="w-full text-sm text-on-surface">
              <thead className="bg-surface-variant/50 text-on-surface-variant text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-start font-medium">כותרת</th>
                  <th className="px-4 py-3 text-start font-medium">קהל יעד</th>
                  <th className="px-4 py-3 text-start font-medium">תאריך פרסום</th>
                  <th className="px-4 py-3 text-start font-medium">נשלח / נמענים</th>
                  <th className="px-4 py-3 text-start font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/20">
                {alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-surface-variant/20 transition-colors">
                    <td className="px-4 py-3 font-medium">{alert.title}</td>
                    <td className="px-4 py-3">
                      <AudienceBadge audience={alert.audience} />
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {format(new Date(alert.createdAt), 'dd בMMMM yyyy', { locale: he })}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {alert.deliveredCount}/{alert.recipientCount}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleDelete(alert)}
                        disabled={deleteMutation.isPending}
                        className="btn-ghost p-2 rounded-lg text-error hover:bg-error/10 transition-colors"
                        aria-label="מחק התראה"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="flex flex-col gap-3 sm:hidden">
            {alerts.map((alert) => (
              <div key={alert.id} className="card-elevated rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-on-surface text-sm leading-snug">{alert.title}</p>
                  <button
                    type="button"
                    onClick={() => handleDelete(alert)}
                    disabled={deleteMutation.isPending}
                    className="btn-ghost p-1.5 rounded-lg text-error hover:bg-error/10 transition-colors shrink-0"
                    aria-label="מחק התראה"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <AudienceBadge audience={alert.audience} />
                  <span className="text-xs text-on-surface-variant">
                    {format(new Date(alert.createdAt), 'dd בMMMM yyyy', { locale: he })}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant">
                  נשלח: {alert.deliveredCount}/{alert.recipientCount}
                </p>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn-outline flex items-center gap-1 px-3 py-1.5 text-sm disabled:opacity-40"
                aria-label="עמוד הבא"
              >
                <ChevronRight className="w-4 h-4" />
                הבא
              </button>
              <span className="text-sm text-on-surface-variant">
                עמוד {page} מתוך {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="btn-outline flex items-center gap-1 px-3 py-1.5 text-sm disabled:opacity-40"
                aria-label="עמוד קודם"
              >
                הקודם
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateAlertModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  );
}
