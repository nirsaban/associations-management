'use client';

import React, { useState } from 'react';
import {
  Home,
  Phone,
  MapPin,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Edit,
  Check,
  X,
  Users,
  Baby,
  FileText,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { useToast } from '@/components/ui/Toast';
import { GroupSwitcher } from '../_components/GroupSwitcher';
import { withGroupId } from '../_components/groupIdParam';

interface Family {
  id: string;
  familyName: string;
  address: string;
  contactPhone: string;
  notes?: string;
  childrenMinorCount: number;
  totalMemberCount: number;
}

type EditableField = 'contactPhone' | 'childrenMinorCount' | 'totalMemberCount' | 'address' | 'notes';

const ISRAELI_PHONE_RE = /^(0|\+972)\d{8,9}$/;

function validateField(
  field: EditableField,
  value: string,
  family: Family,
): string | null {
  if (field === 'contactPhone') {
    if (!ISRAELI_PHONE_RE.test(value.trim())) {
      return 'מספר טלפון לא תקין. יש להזין מספר ישראלי (למשל 0501234567)';
    }
  }
  if (field === 'childrenMinorCount') {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) return 'יש להזין מספר שאינו שלילי';
    if (n > family.totalMemberCount) return 'מספר ילדים לא יכול לעלות על סך חברי המשפחה';
  }
  if (field === 'totalMemberCount') {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) return 'יש להזין מספר שאינו שלילי';
    if (n < family.childrenMinorCount) return 'סך חברים לא יכול להיות קטן ממספר הילדים';
  }
  return null;
}

function fieldLabel(field: EditableField): string {
  const labels: Record<EditableField, string> = {
    contactPhone: 'טלפון איש קשר',
    childrenMinorCount: 'מספר ילדים קטינים',
    totalMemberCount: 'סך חברי משפחה',
    address: 'כתובת',
    notes: 'הערות',
  };
  return labels[field];
}

function castValue(field: EditableField, raw: string): unknown {
  if (field === 'childrenMinorCount' || field === 'totalMemberCount') {
    return parseInt(raw, 10);
  }
  return raw.trim();
}

interface InlineFieldProps {
  field: EditableField;
  value: string;
  family: Family;
  isEditing: boolean;
  onStartEdit: () => void;
  onCancel: () => void;
  onSave: (field: EditableField, value: string) => void;
  isSaving: boolean;
  icon: React.ReactNode;
}

function InlineField({
  field,
  value,
  family,
  isEditing,
  onStartEdit,
  onCancel,
  onSave,
  isSaving,
  icon,
}: InlineFieldProps) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isEditing) setDraft(value);
  }, [isEditing, value]);

  function handleSave() {
    const err = validateField(field, draft, family);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onSave(field, draft);
  }

  const isTextarea = field === 'notes';
  const isPhone = field === 'contactPhone';
  const isNumber = field === 'childrenMinorCount' || field === 'totalMemberCount';
  const label = fieldLabel(field);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
        {icon}
        <span>{label}</span>
      </div>

      {isEditing ? (
        <div className="flex flex-col gap-2">
          {isTextarea ? (
            <textarea
              className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              rows={3}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              dir="rtl"
              autoFocus
            />
          ) : (
            <input
              type={isNumber ? 'number' : 'text'}
              min={isNumber ? 0 : undefined}
              className="w-full rounded-md border border-outline bg-surface px-3 py-2 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={draft}
              dir={isPhone ? 'ltr' : 'rtl'}
              onChange={(e) => {
                setDraft(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave();
                if (e.key === 'Escape') onCancel();
              }}
              autoFocus
            />
          )}

          {error && (
            <p className="text-label-sm text-error flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="btn-primary px-3 py-1 text-label-sm flex items-center gap-1 disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              שמור
            </button>
            <button
              type="button"
              onClick={() => {
                setError(null);
                onCancel();
              }}
              className="btn-ghost px-3 py-1 text-label-sm flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" />
              ביטול
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-2 group">
          <span
            className="text-body-md flex-1"
            dir={isPhone ? 'ltr' : 'rtl'}
          >
            {value || <span className="text-on-surface-variant italic">לא הוזן</span>}
          </span>
          <button
            type="button"
            onClick={onStartEdit}
            className="btn-ghost px-2 py-1 text-label-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 flex-shrink-0"
          >
            <Edit className="h-3.5 w-3.5" />
            ערוך
          </button>
        </div>
      )}
    </div>
  );
}

interface FamilyCardProps {
  family: Family;
  onSaveField: (familyId: string, field: EditableField, value: string) => void;
  isSaving: boolean;
}

function FamilyCard({ family, onSaveField, isSaving }: FamilyCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);

  function startEdit(field: EditableField) {
    setEditingField(field);
  }

  function cancelEdit() {
    setEditingField(null);
  }

  function saveField(field: EditableField, value: string) {
    onSaveField(family.id, field, value);
    setEditingField(null);
  }

  return (
    <div className="card-elevated flex flex-col gap-0 overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-3 p-5 w-full text-start hover:bg-surface-variant/30 transition-colors"
      >
        <div className="p-2 rounded-full bg-primary/10 flex-shrink-0">
          <Home className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-title-md font-medium">{family.familyName}</p>
          <p className="text-body-sm text-on-surface-variant" dir="ltr">
            {family.contactPhone || '—'}
          </p>
          {family.address && (
            <p className="text-body-sm text-on-surface-variant truncate">{family.address}</p>
          )}
        </div>

        <div className="flex-shrink-0 text-on-surface-variant">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Expanded edit area */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 flex flex-col gap-5 border-t border-outline/20">
          {/* Family name — read only */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
              <Home className="h-4 w-4" />
              <span>שם משפחה</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-body-md font-medium">{family.familyName}</span>
              <span className="text-label-sm text-on-surface-variant italic">
                לעריכת שם יש לפנות לאדמין
              </span>
            </div>
          </div>

          <InlineField
            field="contactPhone"
            value={family.contactPhone ?? ''}
            family={family}
            isEditing={editingField === 'contactPhone'}
            onStartEdit={() => startEdit('contactPhone')}
            onCancel={cancelEdit}
            onSave={saveField}
            isSaving={isSaving}
            icon={<Phone className="h-4 w-4" />}
          />

          <InlineField
            field="address"
            value={family.address ?? ''}
            family={family}
            isEditing={editingField === 'address'}
            onStartEdit={() => startEdit('address')}
            onCancel={cancelEdit}
            onSave={saveField}
            isSaving={isSaving}
            icon={<MapPin className="h-4 w-4" />}
          />

          <InlineField
            field="childrenMinorCount"
            value={String(family.childrenMinorCount ?? 0)}
            family={family}
            isEditing={editingField === 'childrenMinorCount'}
            onStartEdit={() => startEdit('childrenMinorCount')}
            onCancel={cancelEdit}
            onSave={saveField}
            isSaving={isSaving}
            icon={<Baby className="h-4 w-4" />}
          />

          <InlineField
            field="totalMemberCount"
            value={String(family.totalMemberCount ?? 0)}
            family={family}
            isEditing={editingField === 'totalMemberCount'}
            onStartEdit={() => startEdit('totalMemberCount')}
            onCancel={cancelEdit}
            onSave={saveField}
            isSaving={isSaving}
            icon={<Users className="h-4 w-4" />}
          />

          <InlineField
            field="notes"
            value={family.notes ?? ''}
            family={family}
            isEditing={editingField === 'notes'}
            onStartEdit={() => startEdit('notes')}
            onCancel={cancelEdit}
            onSave={saveField}
            isSaving={isSaving}
            icon={<FileText className="h-4 w-4" />}
          />
        </div>
      )}
    </div>
  );
}

export default function ManagerFamiliesPage() {
  const { user, activeManagedGroupId } = useAuthStore();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const {
    data: families,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['manager-families', activeManagedGroupId],
    queryFn: async () => {
      const response = await api.get<{ data: Family[] }>(
        withGroupId('/manager/group/families', activeManagedGroupId),
      );
      return response.data.data;
    },
    enabled: !!user,
  });

  const updateFamily = useMutation({
    mutationFn: async ({
      familyId,
      data,
    }: {
      familyId: string;
      data: Record<string, unknown>;
    }) => {
      const response = await api.patch(
        withGroupId(`/manager/group/families/${familyId}`, activeManagedGroupId),
        data,
      );
      return response.data;
    },
    onMutate: async ({ familyId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['manager-families', activeManagedGroupId] });
      const previous = queryClient.getQueryData<Family[]>(['manager-families', activeManagedGroupId]);
      queryClient.setQueryData<Family[]>(['manager-families', activeManagedGroupId], (old) =>
        old
          ? old.map((f) => (f.id === familyId ? { ...f, ...data } : f))
          : old,
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['manager-families', activeManagedGroupId], context.previous);
      }
      showToast('שגיאה בשמירה', 'error');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-families', activeManagedGroupId] });
      showToast('נשמר', 'success');
    },
  });

  function handleSaveField(familyId: string, field: EditableField, rawValue: string) {
    const value = castValue(field, rawValue);
    updateFamily.mutate({ familyId, data: { [field]: value } });
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-4">
        <div className="h-10 w-48 rounded-lg bg-surface-container animate-pulse" />
        <div className="h-5 w-72 rounded-md bg-surface-container animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="card-elevated h-24 animate-pulse bg-surface-container" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3 items-center">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת רשימת המשפחות. אנא נסה שוב.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="space-y-3">
        <div>
          <h1 className="text-headline-md sm:text-headline-lg font-headline mb-1">המשפחות שלי</h1>
          <p className="text-body-md text-on-surface-variant">
            משפחות תחת ניהול הקבוצה שלך
          </p>
        </div>
        <GroupSwitcher />
      </div>

      {/* Families grid */}
      {!families || families.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Home className="h-16 w-16 text-on-surface-variant/30" />
          <p className="text-body-lg text-on-surface-variant">אין משפחות בקבוצה</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {families.map((family) => (
            <FamilyCard
              key={family.id}
              family={family}
              onSaveField={handleSaveField}
              isSaving={updateFamily.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}
