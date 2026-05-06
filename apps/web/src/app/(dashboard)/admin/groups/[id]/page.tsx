'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import {
  AlertCircle,
  ArrowRight,
  Users,
  Home,
  Edit2,
  X,
  Plus,
  Trash2,
  MessageCircle,
  Phone,
} from 'lucide-react';

interface GroupDetail {
  id: string;
  organizationId: string;
  name: string;
  managerId?: string;
  managerName?: string;
  managerPhone?: string;
  memberCount?: number;
  familyCount?: number;
  familyNames?: string[];
  createdAt: string;
  updatedAt: string;
}

interface GroupMember {
  memberId: string;
  id: string;
  fullName?: string;
  phone: string;
  systemRole: string;
  joinedAt: string;
}

interface OrgUser {
  id: string;
  fullName?: string;
  phone: string;
}

interface OrgFamily {
  id: string;
  familyName: string;
  groupId?: string;
  groupName?: string;
}

function formatPhoneForWhatsApp(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) return `972${cleaned.slice(1)}`;
  if (cleaned.startsWith('972')) return cleaned;
  return `972${cleaned}`;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [editError, setEditError] = useState('');

  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');

  const [showAssignFamily, setShowAssignFamily] = useState(false);
  const [selectedFamilyId, setSelectedFamilyId] = useState('');

  const { data: group, isLoading, error } = useQuery<GroupDetail>({
    queryKey: ['admin', 'group', id],
    queryFn: async () => {
      const res = await api.get<{ data: GroupDetail }>(`/admin/groups/${id}`);
      return res.data.data;
    },
    enabled: user?.systemRole === 'ADMIN' && !!id,
  });

  const { data: membersData } = useQuery<{ data: GroupMember[] }>({
    queryKey: ['admin', 'group-members', id],
    queryFn: async () => {
      const res = await api.get<{ data: GroupMember[] }>(`/admin/groups/${id}/members`);
      return res.data;
    },
    enabled: user?.systemRole === 'ADMIN' && !!id,
  });

  const { data: orgUsers } = useQuery<OrgUser[]>({
    queryKey: ['admin', 'users-list'],
    queryFn: async () => {
      const res = await api.get<{ data: OrgUser[] }>('/admin/users', { params: { limit: 200 } });
      return res.data.data;
    },
    enabled: user?.systemRole === 'ADMIN',
  });

  const { data: allFamilies } = useQuery<OrgFamily[]>({
    queryKey: ['admin', 'families-list'],
    queryFn: async () => {
      const res = await api.get<{ data: OrgFamily[] }>('/admin/families', { params: { limit: 500 } });
      return res.data.data;
    },
    enabled: user?.systemRole === 'ADMIN',
  });

  const updateNameMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await api.patch(`/admin/groups/${id}`, { name });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'group', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
      setEditingName(false);
      setEditError('');
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setEditError(msg || 'שגיאה בעדכון שם הקבוצה');
    },
  });

  const assignManagerMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.patch(`/admin/groups/${id}`, { managerId: userId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'group', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'groups'] });
    },
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await api.post(`/admin/groups/${id}/members`, { userId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'group-members', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'group', id] });
      setShowAddMember(false);
      setSelectedUserId('');
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      await api.delete(`/admin/groups/${id}/members/${userId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'group-members', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'group', id] });
    },
  });

  const assignFamilyMutation = useMutation({
    mutationFn: async (familyId: string) => {
      const res = await api.post(`/admin/families/${familyId}/assign-group`, { groupId: id });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'group', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'families-list'] });
      setShowAssignFamily(false);
      setSelectedFamilyId('');
    },
  });

  const unassignFamilyMutation = useMutation({
    mutationFn: async (familyId: string) => {
      const res = await api.patch(`/admin/families/${familyId}`, { groupId: null });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'group', id] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'families-list'] });
    },
  });

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
          <span>שגיאה בטעינת פרטי הקבוצה</span>
        </div>
      </div>
    );
  }

  if (isLoading || !group) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="h-10 w-48 animate-pulse bg-surface-container rounded" />
        <div className="h-32 animate-pulse bg-surface-container rounded-lg" />
        <div className="h-48 animate-pulse bg-surface-container rounded-lg" />
      </div>
    );
  }

  const members = membersData?.data ?? [];
  const memberIds = new Set(members.map((m) => m.id));
  const unassignedFamilies = allFamilies?.filter((f) => !f.groupId || f.groupId !== id) ?? [];
  const groupFamilies = allFamilies?.filter((f) => f.groupId === id) ?? [];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => router.push('/admin/groups')}
        className="inline-flex items-center gap-2 text-body-sm text-on-surface-variant hover:text-on-surface transition-colors"
      >
        <ArrowRight className="h-4 w-4" />
        חזרה לקבוצות
      </button>

      {/* Header */}
      <div className="card-elevated">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            {editingName ? (
              <div className="space-y-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-headline-sm font-headline"
                  autoFocus
                />
                {editError && (
                  <p className="text-body-sm text-error">{editError}</p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      if (!nameInput.trim()) { setEditError('שם הקבוצה הוא שדה חובה'); return; }
                      updateNameMutation.mutate(nameInput.trim());
                    }}
                    disabled={updateNameMutation.isPending}
                    className="btn-primary text-body-sm px-4 py-1.5"
                  >
                    {updateNameMutation.isPending ? 'שומר...' : 'שמור'}
                  </button>
                  <button onClick={() => { setEditingName(false); setEditError(''); }} className="btn-outline text-body-sm px-4 py-1.5">
                    ביטול
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <h1 className="text-headline-sm sm:text-headline-md font-headline">{group.name}</h1>
                <button
                  onClick={() => { setNameInput(group.name); setEditingName(true); setEditError(''); }}
                  className="p-1.5 rounded-md hover:bg-surface-container text-secondary"
                  title="ערוך שם"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="mt-2 flex items-center gap-4 text-body-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1">
                <Users className="h-4 w-4" />
                {group.memberCount ?? 0} חברים
              </span>
              <span className="inline-flex items-center gap-1">
                <Home className="h-4 w-4" />
                {group.familyCount ?? 0} משפחות
              </span>
            </div>
          </div>
        </div>

        {/* Manager */}
        <div className="mt-4 pt-4 border-t border-outline/20">
          <p className="text-label-md font-medium mb-2">מנהל הקבוצה</p>
          {group.managerId && group.managerPhone ? (
            <div className="flex items-center gap-3">
              <div>
                <p className="text-body-md">{group.managerName || group.managerPhone}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-body-sm text-on-surface-variant" dir="ltr">{group.managerPhone}</span>
                  <a
                    href={`https://wa.me/${formatPhoneForWhatsApp(group.managerPhone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-success hover:text-success/80"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </a>
                  <a href={`tel:${group.managerPhone}`} className="inline-flex items-center text-primary hover:text-primary/80">
                    <Phone className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-body-sm text-on-surface-variant">לא שובץ מנהל</p>
          )}
          <div className="mt-3">
            <label className="block text-label-sm text-on-surface-variant mb-1">שנה מנהל</label>
            <select
              onChange={(e) => { if (e.target.value) assignManagerMutation.mutate(e.target.value); }}
              defaultValue=""
              className="px-3 py-2 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none text-body-sm"
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
      </div>

      {/* Members */}
      <div className="card-elevated">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-lg font-medium flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            חברי הקבוצה
          </h2>
          <button
            onClick={() => setShowAddMember(true)}
            className="btn-primary flex items-center gap-1.5 text-body-sm px-3 py-2"
          >
            <Plus className="h-4 w-4" />
            הוסף חבר
          </button>
        </div>

        {showAddMember && (
          <div className="mb-4 p-4 rounded-lg bg-surface-container-low border border-outline/20 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-label-sm text-on-surface-variant mb-1">בחר משתמש להוספה</label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none text-body-sm"
              >
                <option value="">בחר משתמש...</option>
                {orgUsers?.filter((u) => !memberIds.has(u.id)).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.phone}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { if (selectedUserId) addMemberMutation.mutate(selectedUserId); }}
              disabled={!selectedUserId || addMemberMutation.isPending}
              className="btn-primary text-body-sm px-4 py-2 disabled:opacity-50"
            >
              {addMemberMutation.isPending ? 'מוסיף...' : 'הוסף'}
            </button>
            <button onClick={() => { setShowAddMember(false); setSelectedUserId(''); }} className="p-2 hover:bg-surface-container rounded-md">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {members.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant text-center py-6">אין חברים בקבוצה זו</p>
        ) : (
          <div className="divide-y divide-outline/20">
            {members.map((member) => (
              <div key={member.memberId} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-body-md">{member.fullName || member.phone}</p>
                  <p className="text-body-sm text-on-surface-variant" dir="ltr">{member.phone}</p>
                </div>
                <button
                  onClick={() => removeMemberMutation.mutate(member.id)}
                  disabled={removeMemberMutation.isPending}
                  className="p-2 hover:bg-surface-container rounded-md text-error"
                  title="הסר מהקבוצה"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Families */}
      <div className="card-elevated">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title-lg font-medium flex items-center gap-2">
            <Home className="h-5 w-5 text-primary" />
            משפחות בקבוצה
          </h2>
          <button
            onClick={() => setShowAssignFamily(true)}
            className="btn-primary flex items-center gap-1.5 text-body-sm px-3 py-2"
          >
            <Plus className="h-4 w-4" />
            שייך משפחה
          </button>
        </div>

        {showAssignFamily && (
          <div className="mb-4 p-4 rounded-lg bg-surface-container-low border border-outline/20 flex items-end gap-3">
            <div className="flex-1">
              <label className="block text-label-sm text-on-surface-variant mb-1">בחר משפחה לשיוך</label>
              <select
                value={selectedFamilyId}
                onChange={(e) => setSelectedFamilyId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-outline bg-surface-container focus:border-primary focus:outline-none text-body-sm"
              >
                <option value="">בחר משפחה...</option>
                {unassignedFamilies.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.familyName}{f.groupName ? ` (${f.groupName})` : ''}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={() => { if (selectedFamilyId) assignFamilyMutation.mutate(selectedFamilyId); }}
              disabled={!selectedFamilyId || assignFamilyMutation.isPending}
              className="btn-primary text-body-sm px-4 py-2 disabled:opacity-50"
            >
              {assignFamilyMutation.isPending ? 'משייך...' : 'שייך'}
            </button>
            <button onClick={() => { setShowAssignFamily(false); setSelectedFamilyId(''); }} className="p-2 hover:bg-surface-container rounded-md">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {groupFamilies.length === 0 ? (
          <p className="text-body-sm text-on-surface-variant text-center py-6">אין משפחות משויכות לקבוצה זו</p>
        ) : (
          <div className="divide-y divide-outline/20">
            {groupFamilies.map((family) => (
              <div key={family.id} className="flex items-center justify-between py-3">
                <p className="text-body-md">{family.familyName}</p>
                <button
                  onClick={() => unassignFamilyMutation.mutate(family.id)}
                  disabled={unassignFamilyMutation.isPending}
                  className="p-2 hover:bg-surface-container rounded-md text-on-surface-variant"
                  title="הסר שיוך לקבוצה"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
