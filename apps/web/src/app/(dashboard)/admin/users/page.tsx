'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, Search, Plus, Edit2, Trash2, X, CheckCircle, XCircle } from 'lucide-react';

interface AdminUser {
  id: string;
  phone: string;
  fullName?: string;
  email?: string;
  systemRole: string;
  isActive: boolean;
  createdAt: string;
}

interface UsersResponse {
  data: AdminUser[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

interface CreateUserForm {
  fullName: string;
  phone: string;
  email?: string;
}

interface EditUserForm {
  fullName: string;
  email: string;
  isActive: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'מנהל מערכת',
  USER: 'משתמש',
  GROUP_MANAGER: 'מנהל קבוצה',
};

export default function AdminUsersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);

  const [createForm, setCreateForm] = useState<CreateUserForm>({ fullName: '', phone: '' });
  const [editForm, setEditForm] = useState<EditUserForm>({
    fullName: '',
    email: '',
    isActive: true,
  });
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'users', page, searchTerm],
    queryFn: async () => {
      const res = await api.get<{ data: UsersResponse }>('/admin/users', {
        params: { page, limit: pageSize, search: searchTerm || undefined },
      });
      const body = res.data as unknown as { data: AdminUser[]; meta?: { total?: number } };
      return { users: body.data, total: body.meta?.total ?? 0 };
    },
    enabled: user?.systemRole === 'ADMIN',
  });

  const users = response?.users ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const createMutation = useMutation({
    mutationFn: async (data: CreateUserForm) => {
      const res = await api.post('/admin/users', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setShowCreateModal(false);
      setCreateForm({ fullName: '', phone: '' });
      setCreateError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(msg || 'שגיאה ביצירת משתמש');
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditUserForm }) => {
      const res = await api.patch(`/admin/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setEditingUser(null);
      setEditError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg || 'שגיאה בעדכון משתמש');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      setDeletingUser(null);
    },
  });

  const openEditModal = (u: AdminUser) => {
    setEditingUser(u);
    setEditForm({ fullName: u.fullName ?? '', email: u.email ?? '', isActive: u.isActive });
    setEditError('');
  };

  if (user?.systemRole !== 'ADMIN') {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container">
          <p>גישה מוגבלת</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת משתמשים</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-headline mb-2">משתמשים</h1>
          <p className="text-body-md text-on-surface-variant">
            ניהול משתמשים במערכת ({total} סה"כ)
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setCreateError('');
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          הוסף משתמש
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
        <input
          type="text"
          placeholder="חפש לפי שם או טלפון..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-lg border border-outline bg-surface-container-low ps-12 pe-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card h-16 animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-outline/30">
            <table className="w-full">
              <thead className="border-b border-outline/30 bg-surface-container-low">
                <tr>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    שם מלא
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    טלפון
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    תפקיד
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    סטטוס
                  </th>
                  <th className="px-6 py-4 text-center text-label-md font-medium text-on-surface-variant">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/20">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                      לא נמצאו משתמשים
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="hover:bg-surface-container/50">
                      <td className="px-6 py-4 text-body-md font-medium">{u.fullName || '—'}</td>
                      <td className="px-6 py-4 text-body-md" dir="ltr">
                        {u.phone}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-block px-3 py-1 rounded-full bg-primary-container/20 text-primary text-label-sm font-medium">
                          {ROLE_LABELS[u.systemRole] || u.systemRole}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {u.isActive ? (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-success-container text-on-success-container text-label-sm font-medium">
                            <CheckCircle className="h-3.5 w-3.5" />
                            פעיל
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-error-container text-on-error-container text-label-sm font-medium">
                            <XCircle className="h-3.5 w-3.5" />
                            לא פעיל
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 hover:bg-surface-container rounded-md transition-colors text-secondary"
                            title="ערוך"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingUser(u)}
                            className="p-2 hover:bg-surface-container rounded-md transition-colors text-error"
                            title="מחק"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-body-sm text-on-surface-variant">
              עמוד {page} מתוך {totalPages} ({total} משתמשים)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-outline px-4 py-2 disabled:opacity-50"
              >
                הקודם
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
                className="btn-outline px-4 py-2 disabled:opacity-50"
              >
                הבא
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-outline/20">
              <h2 className="text-headline-sm font-headline">הוסף משתמש חדש</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-surface-container rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                  {createError}
                </div>
              )}
              <div>
                <label className="block text-label-md font-medium mb-2">שם מלא *</label>
                <input
                  type="text"
                  value={createForm.fullName}
                  onChange={(e) => setCreateForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="שם המשתמש"
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-label-md font-medium mb-2">טלפון *</label>
                <input
                  type="tel"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="05XXXXXXXX"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-label-md font-medium mb-2">אימייל (אופציונלי)</label>
                <input
                  type="email"
                  value={createForm.email ?? ''}
                  onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="user@example.com"
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-outline/20">
              <button onClick={() => setShowCreateModal(false)} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => {
                  if (!createForm.fullName.trim()) {
                    setCreateError('שם מלא הוא שדה חובה');
                    return;
                  }
                  if (!createForm.phone.trim()) {
                    setCreateError('טלפון הוא שדה חובה');
                    return;
                  }
                  createMutation.mutate(createForm);
                }}
                disabled={createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? 'יוצר...' : 'צור משתמש'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-outline/20">
              <h2 className="text-headline-sm font-headline">עריכת משתמש</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-surface-container rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                  {editError}
                </div>
              )}
              <div>
                <label className="block text-label-md font-medium mb-2">שם מלא</label>
                <input
                  type="text"
                  value={editForm.fullName}
                  onChange={(e) => setEditForm((f) => ({ ...f, fullName: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-label-md font-medium mb-2">אימייל</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                  dir="ltr"
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                    className="h-5 w-5 rounded border-outline text-primary"
                  />
                  <span className="text-label-md font-medium">משתמש פעיל</span>
                </label>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-outline/20">
              <button onClick={() => setEditingUser(null)} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => editMutation.mutate({ id: editingUser.id, data: editForm })}
                disabled={editMutation.isPending}
                className="btn-primary flex-1"
              >
                {editMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-sm w-full shadow-xl p-6">
            <h2 className="text-headline-sm font-headline mb-4">מחיקת משתמש</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              האם אתה בטוח שברצונך למחוק את {deletingUser.fullName || deletingUser.phone}? פעולה זו
              אינה ניתנת לביטול.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingUser(null)} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingUser.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 px-4 py-2 rounded-lg bg-error text-on-error font-medium hover:bg-error/90 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'מוחק...' : 'מחק'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
