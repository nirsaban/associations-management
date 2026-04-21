'use client';

import React, { useState } from 'react';
import {
  Home,
  Phone,
  MapPin,
  Users,
  Baby,
  FileText,
  ChevronDown,
  ChevronUp,
  Edit,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyData {
  id: string;
  familyName: string;
  contactPhone?: string | null;
  address?: string | null;
  childrenMinorCount?: number | null;
  totalMemberCount?: number | null;
  notes?: string | null;
}

interface FamilyCardProps {
  family: FamilyData;
  editable?: boolean;
  onSave?: (familyId: string, data: Record<string, unknown>) => Promise<void>;
}

type EditableField = 'contactPhone' | 'childrenMinorCount' | 'totalMemberCount' | 'address' | 'notes';

// ─── Validation ───────────────────────────────────────────────────────────────

const ISRAELI_PHONE_RE = /^(0|\+972)\d{8,9}$/;

function validateField(
  field: EditableField,
  value: string,
  family: FamilyData,
): string | null {
  if (field === 'contactPhone') {
    if (value.trim() && !ISRAELI_PHONE_RE.test(value.trim())) {
      return 'מספר טלפון לא תקין. יש להזין מספר ישראלי (למשל 0501234567)';
    }
  }
  if (field === 'childrenMinorCount') {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) return 'יש להזין מספר שאינו שלילי';
    const total = family.totalMemberCount ?? 0;
    if (n > total) return 'מספר ילדים לא יכול לעלות על סך חברי המשפחה';
  }
  if (field === 'totalMemberCount') {
    const n = parseInt(value, 10);
    if (isNaN(n) || n < 0) return 'יש להזין מספר שאינו שלילי';
    const children = family.childrenMinorCount ?? 0;
    if (n < children) return 'סך חברים לא יכול להיות קטן ממספר הילדים';
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

// ─── InlineField ─────────────────────────────────────────────────────────────

interface InlineFieldProps {
  field: EditableField;
  value: string;
  family: FamilyData;
  editable: boolean;
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
  editable,
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
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
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
          <span className="text-body-md flex-1" dir={isPhone ? 'ltr' : 'rtl'}>
            {value || <span className="text-on-surface-variant italic">לא הוזן</span>}
          </span>
          {editable && (
            <button
              type="button"
              onClick={onStartEdit}
              className="btn-ghost px-2 py-1 text-label-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 focus:opacity-100 shrink-0"
            >
              <Edit className="h-3.5 w-3.5" />
              ערוך
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── FamilyCard ───────────────────────────────────────────────────────────────

export function FamilyCard({ family, editable = false, onSave }: FamilyCardProps) {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  function cancelEdit() {
    setEditingField(null);
  }

  async function saveField(field: EditableField, rawValue: string) {
    if (!onSave) return;
    const value = castValue(field, rawValue);
    setIsSaving(true);
    try {
      await onSave(family.id, { [field]: value });
      showToast('נשמר', 'success');
    } catch {
      showToast('שגיאה בשמירה', 'error');
    } finally {
      setIsSaving(false);
      setEditingField(null);
    }
  }

  return (
    <div className="card-elevated flex flex-col gap-0 overflow-hidden">
      {/* Collapsed header — always visible */}
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex items-center gap-3 p-5 w-full text-start hover:bg-surface-variant/30 transition-colors"
      >
        <div className="p-2 rounded-full bg-primary/10 shrink-0">
          <Home className="h-5 w-5 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-title-md font-medium">{family.familyName}</p>
          {family.contactPhone && (
            <p className="text-body-sm text-on-surface-variant" dir="ltr">
              {family.contactPhone}
            </p>
          )}
          {family.address && (
            <p className="text-body-sm text-on-surface-variant truncate">{family.address}</p>
          )}
        </div>

        <div className="shrink-0 text-on-surface-variant">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {/* Expanded area */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 flex flex-col gap-5 border-t border-outline/20">
          {/* Family name — always read-only */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2 text-label-sm text-on-surface-variant">
              <Home className="h-4 w-4" />
              <span>שם משפחה</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-body-md font-medium">{family.familyName}</span>
              {editable && (
                <span className="text-label-sm text-on-surface-variant italic">
                  לעריכת שם יש לפנות לאדמין
                </span>
              )}
            </div>
          </div>

          <InlineField
            field="contactPhone"
            value={family.contactPhone ?? ''}
            family={family}
            editable={editable}
            isEditing={editingField === 'contactPhone'}
            onStartEdit={() => setEditingField('contactPhone')}
            onCancel={cancelEdit}
            onSave={saveField}
            isSaving={isSaving}
            icon={<Phone className="h-4 w-4" />}
          />

          <InlineField
            field="address"
            value={family.address ?? ''}
            family={family}
            editable={editable}
            isEditing={editingField === 'address'}
            onStartEdit={() => setEditingField('address')}
            onCancel={cancelEdit}
            onSave={saveField}
            isSaving={isSaving}
            icon={<MapPin className="h-4 w-4" />}
          />

          <InlineField
            field="childrenMinorCount"
            value={String(family.childrenMinorCount ?? 0)}
            family={family}
            editable={editable}
            isEditing={editingField === 'childrenMinorCount'}
            onStartEdit={() => setEditingField('childrenMinorCount')}
            onCancel={cancelEdit}
            onSave={saveField}
            isSaving={isSaving}
            icon={<Baby className="h-4 w-4" />}
          />

          <InlineField
            field="totalMemberCount"
            value={String(family.totalMemberCount ?? 0)}
            family={family}
            editable={editable}
            isEditing={editingField === 'totalMemberCount'}
            onStartEdit={() => setEditingField('totalMemberCount')}
            onCancel={cancelEdit}
            onSave={saveField}
            isSaving={isSaving}
            icon={<Users className="h-4 w-4" />}
          />

          <InlineField
            field="notes"
            value={family.notes ?? ''}
            family={family}
            editable={editable}
            isEditing={editingField === 'notes'}
            onStartEdit={() => setEditingField('notes')}
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
