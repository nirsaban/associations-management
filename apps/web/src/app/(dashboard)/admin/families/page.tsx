'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, Plus, Home, X, Edit2, Trash2, Phone, MapPin, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminFamily {
  id: string;
  familyName: string;
  address?: string;
  contactPhone?: string;
  contactName?: string;
  notes?: string;
  groupId?: string;
  groupName?: string;
  status: string;
}

interface AdminGroup {
  id: string;
  name: string;
}

interface FamilyForm {
  familyName: string;
  address: string;
  contactPhone: string;
  contactName: string;
  notes: string;
  groupId: string;
}

const emptyForm: FamilyForm = {
  familyName: '',
  address: '',
  contactPhone: '',
  contactName: '',
  notes: '',
  groupId: '',
};

export default function AdminFamiliesPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingFamily, setEditingFamily] = useState<AdminFamily | null>(null);
  const [deletingFamily, setDeletingFamily] = useState<AdminFamily | null>(null);
  const [createForm, setCreateForm] = useState<FamilyForm>(emptyForm);
  const [editForm, setEditForm] = useState<FamilyForm>(emptyForm);
  const [createError, setCreateError] = useState('');
  const [editError, setEditError] = useState('');

  const {
    data: families,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin', 'families'],
    queryFn: async () => {
      const res = await api.get('/admin/families', { params: { limit: 200 } });
      return res.data.data as AdminFamily[];
    },
    enabled: user?.systemRole === 'ADMIN',
  });

  const { data: groups } = useQuery({
    queryKey: ['admin', 'groups-list'],
    queryFn: async () => {
      const res = await api.get('/admin/groups', { params: { limit: 200 } });
      return res.data.data as AdminGroup[];
    },
    enabled: user?.systemRole === 'ADMIN',
  });

  const createMutation = useMutation({
    mutationFn: async (data: FamilyForm) => {
      const payload = {
        ...data,
        groupId: data.groupId || undefined,
      };
      const res = await api.post('/admin/families', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'families'] });
      setShowCreateModal(false);
      setCreateForm(emptyForm);
      setCreateError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setCreateError(msg || 'שגיאה ביצירת משפחה');
    },
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FamilyForm }) => {
      const payload = { ...data, groupId: data.groupId || undefined };
      const res = await api.patch(`/admin/families/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'families'] });
      setEditingFamily(null);
      setEditError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg || 'שגיאה בעדכון משפחה');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/families/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'families'] });
      setDeletingFamily(null);
    },
  });

  const openEditModal = (f: AdminFamily) => {
    setEditingFamily(f);
    setEditForm({
      familyName: f.familyName,
      address: f.address ?? '',
      contactPhone: f.contactPhone ?? '',
      contactName: f.contactName ?? '',
      notes: f.notes ?? '',
      groupId: f.groupId ?? '',
    });
    setEditError('');
  };

  const filteredFamilies =
    families?.filter(
      (f) =>
        f.familyName.includes(searchTerm) ||
        (f.contactPhone ?? '').includes(searchTerm) ||
        (f.address ?? '').includes(searchTerm),
    ) ?? [];

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
          <span>שגיאה בטעינת משפחות</span>
        </div>
      </div>
    );
  }

  const FamilyFormFields = ({
    form,
    setForm,
  }: {
    form: FamilyForm;
    setForm: React.Dispatch<React.SetStateAction<FamilyForm>>;
  }) => (
    <div className="space-y-4">
      <div>
        <label className="block text-label-md font-medium mb-2">שם המשפחה *</label>
        <input
          type="text"
          value={form.familyName}
          onChange={(e) => setForm((f) => ({ ...f, familyName: e.target.value }))}
          placeholder="שם המשפחה"
          className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="block text-label-md font-medium mb-2">כתובת</label>
        <input
          type="text"
          value={form.address}
          onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          placeholder="רחוב, עיר"
          className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="block text-label-md font-medium mb-2">שם איש קשר</label>
        <input
          type="text"
          value={form.contactName}
          onChange={(e) => setForm((f) => ({ ...f, contactName: e.target.value }))}
          placeholder="שם איש קשר"
          className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="block text-label-md font-medium mb-2">טלפון איש קשר</label>
        <input
          type="tel"
          value={form.contactPhone}
          onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
          placeholder="05XXXXXXXX"
          dir="ltr"
          className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div>
        <label className="block text-label-md font-medium mb-2">שיוך לקבוצה (אופציונלי)</label>
        <select
          value={form.groupId}
          onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
          className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none"
        >
          <option value="">ללא שיוך לקבוצה</option>
          {groups?.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-label-md font-medium mb-2">הערות</label>
        <textarea
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="הערות נוספות"
          rows={3}
          className="w-full px-4 py-3 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none resize-none"
        />
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-sm sm:text-headline-md font-headline mb-1 sm:mb-2">משפחות</h1>
          <p className="text-body-sm sm:text-body-md text-on-surface-variant">
            ניהול משפחות הארגון ({families?.length || 0} משפחות)
          </p>
        </div>
        <button
          onClick={() => {
            setShowCreateModal(true);
            setCreateError('');
            setCreateForm(emptyForm);
          }}
          className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus className="h-5 w-5" />
          הוסף משפחה
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute start-4 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
        <input
          type="text"
          placeholder="חפש לפי שם, טלפון או כתובת..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-outline bg-surface-container-low ps-12 pe-4 py-3 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-24 animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : filteredFamilies.length === 0 ? (
        <div className="card text-center py-12">
          <Home className="h-12 w-12 mx-auto text-on-surface-variant/30 mb-4" />
          <p className="text-body-lg text-on-surface-variant">
            {searchTerm
              ? 'לא נמצאו משפחות התואמות את החיפוש'
              : 'אין משפחות. לחץ "הוסף משפחה" להוספה.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredFamilies.map((family) => (
            <div
              key={family.id}
              className="card-elevated hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => router.push(`/admin/families/${family.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-title-md font-medium">{family.familyName}</h3>
                    {family.groupName && (
                      <p className="text-label-sm text-on-surface-variant">{family.groupName}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditModal(family); }}
                    className="p-2 hover:bg-surface-container rounded-md transition-colors text-secondary"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeletingFamily(family); }}
                    className="p-2 hover:bg-surface-container rounded-md transition-colors text-error"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {family.contactPhone && (
                  <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                    <Phone className="h-4 w-4 flex-shrink-0" />
                    <span dir="ltr">{family.contactPhone}</span>
                    {family.contactName && <span>({family.contactName})</span>}
                  </div>
                )}
                {family.address && (
                  <div className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                    <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>{family.address}</span>
                  </div>
                )}
                {family.notes && (
                  <p className="text-body-sm text-on-surface-variant mt-2 pt-2 border-t border-outline/20 line-clamp-2">
                    {family.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-lg max-w-lg w-full shadow-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-outline/20 sticky top-0 bg-surface">
              <h2 className="text-headline-sm font-headline">הוסף משפחה חדשה</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 hover:bg-surface-container rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {createError && (
                <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                  {createError}
                </div>
              )}
              <FamilyFormFields form={createForm} setForm={setCreateForm} />
            </div>
            <div className="flex gap-3 p-6 border-t border-outline/20 sticky bottom-0 bg-surface">
              <button onClick={() => setShowCreateModal(false)} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => {
                  if (!createForm.familyName.trim()) {
                    setCreateError('שם המשפחה הוא שדה חובה');
                    return;
                  }
                  createMutation.mutate(createForm);
                }}
                disabled={createMutation.isPending}
                className="btn-primary flex-1"
              >
                {createMutation.isPending ? 'יוצר...' : 'הוסף משפחה'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingFamily && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-lg max-w-lg w-full shadow-xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-outline/20 sticky top-0 bg-surface">
              <h2 className="text-headline-sm font-headline">עריכת משפחה</h2>
              <button
                onClick={() => setEditingFamily(null)}
                className="p-2 hover:bg-surface-container rounded-md"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {editError && (
                <div className="mb-4 p-3 rounded-lg bg-error-container text-on-error-container text-body-sm">
                  {editError}
                </div>
              )}
              <FamilyFormFields form={editForm} setForm={setEditForm} />
            </div>
            <div className="flex gap-3 p-6 border-t border-outline/20 sticky bottom-0 bg-surface">
              <button onClick={() => setEditingFamily(null)} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => editMutation.mutate({ id: editingFamily.id, data: editForm })}
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
      {deletingFamily && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-surface rounded-t-2xl sm:rounded-lg max-w-sm w-full shadow-xl p-6">
            <h2 className="text-headline-sm font-headline mb-4">מחיקת משפחה</h2>
            <p className="text-body-md text-on-surface-variant mb-6">
              האם אתה בטוח שברצונך למחוק את משפחת "{deletingFamily.familyName}"? פעולה זו אינה ניתנת
              לביטול.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeletingFamily(null)} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingFamily.id)}
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
