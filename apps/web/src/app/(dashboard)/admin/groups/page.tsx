'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, Plus, Users, X, Edit2, Trash2 } from 'lucide-react';

interface AdminGroup {
  id: string;
  organizationId: string;
  name: string;
  managerId?: string;
  memberCount?: number;
  familyCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface OrgUser {
  id: string;
  fullName?: string;
  phone: string;
}

interface CreateGroupForm {
  name: string;
  managerId?: string;
}

export default function AdminGroupsPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<AdminGroup | null>(null);
  const [createForm, setCreateForm] = useState<CreateGroupForm>({ name: '' });
  const [editForm, setEditForm] = useState<CreateGroupForm>({ name: '' });
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');

  const {
    data: groups,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'groups'],
    queryFn: async () => {
      const res = await api.get<{ data: AdminGroup[]; meta: { total: number; page: number; limit: number } }>('/admin/groups', {
        params: { limit: 200 },
      });
      return res.data.data;
    },
    enabled: user?.systemRole === 'ADMIN',
  });

  const { data: orgUsers } = useQuery({
    queryKey: ['admin', 'users-list'],
    queryFn: async () => {
      const res = await api.get<{ data: OrgUser[]; meta: { total: number; page: number; limit: number } }>('/admin/users', {
        params: { limit: 200 },
      });
      return res.data.data;
    },
    enabled: user?.systemRole === 'ADMIN',
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateGroupForm) => {
      const res = await api.post('/admin/groups', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
      setShowCreateModal(false);
      setCreateForm({ name: '' });
      setCreateError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(msg || 'שגיאה ביצירת קבוצה');
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: CreateGroupForm }) => {
      const res = await api.patch(`/admin/groups/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
      setEditingGroup(null);
      setEditError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg || 'שגיאה בעדכון קבוצה');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/groups/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
      setDeletingGroup(null);
    },
  });

  const openEditModal = (g: AdminGroup) => {
    setEditingGroup(g);
    setEditForm({ name: g.name, managerId: g.managerId });
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
          <span>שגיאה בטעינת קבוצות</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-headline mb-2">קבוצות</h1>
          <p className="text-body-md text-on-surface-variant">
            ניהול קבוצות הארגון ({groups?.length || 0} קבוצות)
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
          צור קבוצה
        </button>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline/30">
          <table className="w-full">
            <thead className="border-b border-outline/30 bg-surface-container-low">
              <tr>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                  שם קבוצה
                </th>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                  מנהל
                </th>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                  מספר חברים
                </th>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                  מספר משפחות
                </th>
                <th className="px-6 py-4 text-center text-label-md font-medium text-on-surface-variant">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/20">
              {!groups || groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-on-surface-variant">
                    אין קבוצות. לחץ "צור קבוצה" להוספת קבוצה ראשונה.
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g.id} className="hover:bg-surface-container/50">
                    <td className="px-6 py-4 text-body-md font-medium">{g.name}</td>
                    <td className="px-6 py-4 text-body-md">
                      {g.managerId ? (
                        (() => {
                          const manager = orgUsers?.find((u) => u.id === g.managerId);
                          return manager?.fullName || manager?.phone || 'מנהל לא נמצא';
                        })()
                      ) : (
                        <span className="text-on-surface-variant text-body-sm">לא שובץ</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 text-body-md">
                        <Users className="h-4 w-4 text-on-surface-variant" />
                        {g.memberCount ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-md">{g.familyCount ?? 0}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(g)}
                          className="p-2 hover:bg-surface-container rounded-md transition-colors text-secondary"
                          title="ערוך"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setDeletingGroup(g)}
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
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-outline/20">
              <h2 className="text-headline-sm font-headline">צור קבוצה חדשה</h2>
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
                <label className="block text-label-md font-medium mb-2">שם הקבוצה *</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="שם הקבוצה"
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-label-md font-medium mb-2">
                  מנהל קבוצה (אופציונלי)
                </label>
                <select
                  value={createForm.managerId ?? ''}
                  onChange={(e) =>
                    setCreateForm((f) => ({ ...f, managerId: e.target.value || undefined }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none"
                >
                  <option value="">בחר מנהל...</option>
                  {orgUsers?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-outline/20">
              <button onClick={() => setShowCreateModal(false)} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => {
                  if (!createForm.name.trim()) {
                    setCreateError('שם הקבוצה הוא שדה חובה');
                    return;
                  }
                  createMutation.mutate(createForm);
                }}
                disabled={createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? 'יוצר...' : 'צור קבוצה'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {editingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-md w-full shadow-xl">
            <div className="flex items-center justify-between p-6 border-b border-outline/20">
              <h2 className="text-headline-sm font-headline">עריכת קבוצה</h2>
              <button
                onClick={() => setEditingGroup(null)}
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
                <label className="block text-label-md font-medium mb-2">שם הקבוצה</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="block text-label-md font-medium mb-2">מנהל קבוצה</label>
                <select
                  value={editForm.managerId ?? ''}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, managerId: e.target.value || undefined }))
                  }
                  className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none"
                >
                  <option value="">ללא מנהל</option>
                  {orgUsers?.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName || u.phone}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 p-6 border-t border-outline/20">
              <button onClick={() => setEditingGroup(null)} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => editMutation.mutate({ id: editingGroup.id, data: editForm })}
                disabled={editMutation.isPending}
                className="btn-primary flex-1"
              >
                {editMutation.isPending ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deletingGroup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-sm w-full shadow-xl p-6">
            <h2 className="text-headline-sm font-headline mb-4">מחיקת קבוצה</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              האם אתה בטוח שברצונך למחוק את הקבוצה "{deletingGroup.name}"? פעולה זו אינה ניתנת
              לביטול.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingGroup(null)} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingGroup.id)}
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
