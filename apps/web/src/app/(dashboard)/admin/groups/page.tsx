'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, Plus, Users, X, Edit2, Trash2, Search, MessageCircle, Phone } from 'lucide-react';

interface AdminGroup {
  id: string;
  organizationId: string;
  name: string;
  managerId?: string;
  managerName?: string;
  managerPhone?: string;
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

type FilterStatus = 'all' | 'with-manager' | 'without-manager';

function formatPhoneForWhatsApp(phone: string): string {
  // Remove leading 0, prepend 972
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return `972${cleaned.slice(1)}`;
  if (cleaned.startsWith('972')) return cleaned;
  return `972${cleaned}`;
}

function WhatsAppLink({ phone, name }: { phone: string; name?: string }) {
  const waNumber = formatPhoneForWhatsApp(phone);
  return (
    <div className="flex items-center gap-2">
      <span className="text-body-md">{name || phone}</span>
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 text-success hover:text-success/80 transition-colors"
        title={`WhatsApp ${phone}`}
      >
        <MessageCircle className="h-4 w-4" />
      </a>
      <a
        href={`tel:${phone}`}
        className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
        title={`חייג ${phone}`}
        dir="ltr"
      >
        <Phone className="h-3.5 w-3.5" />
      </a>
    </div>
  );
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

  // Search & filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

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

  // Filtered groups
  const filteredGroups = useMemo(() => {
    if (!groups) return [];
    return groups.filter((g) => {
      // Search filter
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const nameMatch = g.name.toLowerCase().includes(q);
        const managerMatch = g.managerName?.toLowerCase().includes(q) || false;
        const phoneMatch = g.managerPhone?.includes(q) || false;
        if (!nameMatch && !managerMatch && !phoneMatch) return false;
      }
      // Status filter
      if (filterStatus === 'with-manager' && !g.managerId) return false;
      if (filterStatus === 'without-manager' && g.managerId) return false;
      return true;
    });
  }, [groups, searchQuery, filterStatus]);

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
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container">
          <p>גישה מוגבלת</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת קבוצות</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-sm sm:text-headline-md font-headline mb-1 sm:mb-2">קבוצות</h1>
          <p className="text-body-sm sm:text-body-md text-on-surface-variant">
            ניהול קבוצות הארגון ({groups?.length || 0} קבוצות)
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setCreateError('');
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          צור קבוצה
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant pointer-events-none" />
          <input
            type="text"
            placeholder="חיפוש לפי שם קבוצה, מנהל או טלפון..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-10 pl-4 py-2.5 rounded-lg border border-outline bg-surface-container-low focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-body-md"
          />
        </div>
        <div className="flex gap-1.5">
          {([
            { key: 'all', label: 'הכל' },
            { key: 'with-manager', label: 'עם מנהל' },
            { key: 'without-manager', label: 'ללא מנהל' },
          ] as { key: FilterStatus; label: string }[]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-2 rounded-lg text-body-sm font-medium transition-colors ${
                filterStatus === f.key
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {(searchQuery || filterStatus !== 'all') && (
        <p className="text-body-sm text-on-surface-variant mb-3">
          {filteredGroups.length} תוצאות
          {searchQuery && ` עבור "${searchQuery}"`}
        </p>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : (
        <>
        {/* Mobile cards */}
        <div className="space-y-3 md:hidden">
          {filteredGroups.length === 0 ? (
            <div className="text-center py-12 text-on-surface-variant">
              {groups?.length === 0
                ? 'אין קבוצות. לחץ "צור קבוצה" להוספת קבוצה ראשונה.'
                : 'לא נמצאו תוצאות לחיפוש'}
            </div>
          ) : (
            filteredGroups.map((g) => (
              <div key={g.id} className="rounded-lg border border-outline/30 p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-body-md font-medium">{g.name}</p>
                    {g.managerId && g.managerPhone ? (
                      <WhatsAppLink phone={g.managerPhone} name={g.managerName} />
                    ) : (
                      <p className="text-body-sm text-on-surface-variant">ללא מנהל</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openEditModal(g)}
                      className="p-2 hover:bg-surface-container rounded-md text-secondary min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeletingGroup(g)}
                      className="p-2 hover:bg-surface-container rounded-md text-error min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-body-sm text-on-surface-variant">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {g.memberCount ?? 0} חברים
                  </span>
                  <span>{g.familyCount ?? 0} משפחות</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto rounded-lg border border-outline/30">
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
                  טלפון מנהל
                </th>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                  חברים
                </th>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                  משפחות
                </th>
                <th className="px-6 py-4 text-center text-label-md font-medium text-on-surface-variant">
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/20">
              {filteredGroups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant">
                    {groups?.length === 0
                      ? 'אין קבוצות. לחץ "צור קבוצה" להוספת קבוצה ראשונה.'
                      : 'לא נמצאו תוצאות לחיפוש'}
                  </td>
                </tr>
              ) : (
                filteredGroups.map((g) => (
                  <tr key={g.id} className="hover:bg-surface-container/50">
                    <td className="px-6 py-4 text-body-md font-medium">{g.name}</td>
                    <td className="px-6 py-4 text-body-md">
                      {g.managerName || (
                        <span className="text-on-surface-variant text-body-sm">לא שובץ</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {g.managerPhone ? (
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm text-on-surface-variant" dir="ltr">
                            {g.managerPhone}
                          </span>
                          <a
                            href={`https://wa.me/${formatPhoneForWhatsApp(g.managerPhone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-success bg-success/10 hover:bg-success/20 transition-colors text-label-sm"
                            title="WhatsApp"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      ) : (
                        <span className="text-on-surface-variant text-body-sm">—</span>
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
        </>
      )}

      {/* Create Group Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-lg max-w-md w-full shadow-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-lg max-w-md w-full shadow-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
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
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-lg max-w-sm w-full shadow-xl p-6">
            <h2 className="text-headline-sm font-headline mb-4">מחיקת קבוצה</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              האם אתה בטוח שברצונך למחוק את הקבוצה &quot;{deletingGroup.name}&quot;? פעולה זו אינה ניתנת
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
