'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  useAdminSchema,
  useAdminRecords,
  useAdminCreate,
  useAdminUpdate,
  useAdminDelete,
  FieldMeta,
} from '@/hooks/usePlatformAdmin';
import { useToast } from '@/components/ui/Toast';
import { AxiosError } from 'axios';

const ITEMS_PER_PAGE = 20;

// ── Cell Renderer ────────────────────────────────────────────────────────────

function CellValue({ field, value }: { field: FieldMeta; value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-on-surface-variant/50">—</span>;
  }

  if (field.kind === 'object' && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const display = field.displayField ? obj[field.displayField] : obj.id;
    return (
      <Link
        href={`/platform/admin/${field.relationModel}/${obj.id}`}
        className="text-primary hover:underline text-body-sm"
      >
        {String(display || obj.id)}
      </Link>
    );
  }

  if (field.kind === 'enum') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-label-sm bg-surface-container-high text-on-surface-variant">
        {String(value)}
      </span>
    );
  }

  if (field.type === 'Boolean') {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-label-sm ${
        value ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'
      }`}>
        {value ? 'כן' : 'לא'}
      </span>
    );
  }

  if (field.type === 'DateTime') {
    return (
      <span className="text-body-sm text-on-surface-variant">
        {new Date(value as string).toLocaleDateString('he-IL', {
          day: '2-digit', month: '2-digit', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
        })}
      </span>
    );
  }

  if (field.type === 'Json') {
    return (
      <span className="text-label-sm px-2 py-0.5 rounded bg-tertiary-fixed/30 text-tertiary cursor-pointer" title={JSON.stringify(value, null, 2)}>
        JSON
      </span>
    );
  }

  if (field.type === 'Decimal' || field.type === 'Float') {
    return <span className="text-body-sm font-mono">{Number(value).toFixed(2)}</span>;
  }

  if (field.type === 'Bytes') {
    return <span className="text-on-surface-variant/50">[binary]</span>;
  }

  // FK field with relation info — show the ID truncated
  if (field.relationModel && typeof value === 'string') {
    return (
      <span className="text-body-sm font-mono text-on-surface-variant" title={String(value)}>
        {String(value).slice(0, 12)}...
      </span>
    );
  }

  const str = String(value);
  return (
    <span className="text-body-sm" title={str.length > 40 ? str : undefined}>
      {str.length > 40 ? str.slice(0, 40) + '...' : str}
    </span>
  );
}

// ── Dynamic Form ─────────────────────────────────────────────────────────────

function DynamicForm({
  fields,
  initialData,
  onSubmit,
  isPending,
  onCancel,
}: {
  fields: FieldMeta[];
  initialData?: Record<string, unknown>;
  onSubmit: (data: Record<string, unknown>) => void;
  isPending: boolean;
  onCancel: () => void;
}) {
  const editableFields = fields.filter(
    (f) => !f.isReadOnly && f.kind !== 'object' && f.type !== 'Bytes',
  );

  const [formData, setFormData] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const f of editableFields) {
      initial[f.name] = initialData?.[f.name] ?? (f.type === 'Boolean' ? false : '');
    }
    return initial;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleaned: Record<string, unknown> = {};
    for (const f of editableFields) {
      const val = formData[f.name];
      if (val === '' && !f.isRequired) continue;
      if (f.type === 'Json' && typeof val === 'string') {
        try { cleaned[f.name] = JSON.parse(val as string); } catch { cleaned[f.name] = {}; }
      } else {
        cleaned[f.name] = val;
      }
    }
    onSubmit(cleaned);
  };

  const setValue = (name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[60vh] overflow-y-auto pe-2">
      {editableFields.map((field) => (
        <div key={field.name}>
          <label className="block text-label-md text-on-surface mb-1">
            {field.name}
            {field.isRequired && <span className="text-error me-1">*</span>}
          </label>

          {field.kind === 'enum' && field.enumValues ? (
            <select
              value={String(formData[field.name] || '')}
              onChange={(e) => setValue(field.name, e.target.value)}
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md bg-surface-container-lowest outline-none focus:border-primary"
              required={field.isRequired}
            >
              {!field.isRequired && <option value="">—</option>}
              {field.enumValues.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          ) : field.type === 'Boolean' ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={Boolean(formData[field.name])}
                onChange={(e) => setValue(field.name, e.target.checked)}
                className="w-5 h-5 rounded accent-primary"
              />
              <span className="text-body-sm">{formData[field.name] ? 'כן' : 'לא'}</span>
            </label>
          ) : field.type === 'DateTime' ? (
            <input
              type="datetime-local"
              value={formData[field.name] ? new Date(formData[field.name] as string).toISOString().slice(0, 16) : ''}
              onChange={(e) => setValue(field.name, e.target.value ? new Date(e.target.value).toISOString() : '')}
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md bg-surface-container-lowest outline-none focus:border-primary"
              dir="ltr"
            />
          ) : field.type === 'Int' || field.type === 'BigInt' ? (
            <input
              type="number"
              value={String(formData[field.name] ?? '')}
              onChange={(e) => setValue(field.name, e.target.value)}
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md bg-surface-container-lowest outline-none focus:border-primary"
              dir="ltr"
              required={field.isRequired}
            />
          ) : field.type === 'Float' || field.type === 'Decimal' ? (
            <input
              type="number"
              step="0.01"
              value={String(formData[field.name] ?? '')}
              onChange={(e) => setValue(field.name, e.target.value)}
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md bg-surface-container-lowest outline-none focus:border-primary"
              dir="ltr"
              required={field.isRequired}
            />
          ) : field.isTextarea || field.type === 'Json' ? (
            <textarea
              value={typeof formData[field.name] === 'object' ? JSON.stringify(formData[field.name], null, 2) : String(formData[field.name] ?? '')}
              onChange={(e) => setValue(field.name, e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md bg-surface-container-lowest outline-none focus:border-primary font-mono text-sm"
              dir={field.type === 'Json' ? 'ltr' : undefined}
              required={field.isRequired}
            />
          ) : (
            <input
              type="text"
              value={String(formData[field.name] ?? '')}
              onChange={(e) => setValue(field.name, e.target.value)}
              className="w-full rounded-lg border border-outline-variant px-3 py-2 text-body-md bg-surface-container-lowest outline-none focus:border-primary"
              dir={field.name.match(/email|url|slug|phone/i) ? 'ltr' : undefined}
              required={field.isRequired}
            />
          )}
        </div>
      ))}

      <div className="flex items-center gap-3 pt-4 border-t border-outline-variant">
        <button
          type="submit"
          disabled={isPending}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md hover:bg-primary-container transition-colors disabled:opacity-50"
        >
          {isPending ? '...' : 'שמור'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="text-label-md text-on-surface-variant hover:text-on-surface"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function AdminModelPage() {
  const params = useParams();
  const modelName = params.model as string;
  const { showToast } = useToast();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modal, setModal] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<Record<string, unknown> | null>(null);

  const { data: schema } = useAdminSchema(modelName);
  const { data: result, isLoading, isError } = useAdminRecords(modelName, {
    page,
    limit: ITEMS_PER_PAGE,
    search: debouncedSearch || undefined,
  });
  const createMutation = useAdminCreate(modelName);
  const updateMutation = useAdminUpdate(modelName);
  const deleteMutation = useAdminDelete(modelName);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setPage(1);
    setTimeout(() => setDebouncedSearch(val), 300);
  };

  const handleCreate = async (data: Record<string, unknown>) => {
    try {
      await createMutation.mutateAsync(data);
      showToast('רשומה נוצרה בהצלחה', 'success');
      setModal(null);
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>).response?.data?.message;
      showToast(typeof msg === 'string' ? msg : 'שגיאה ביצירה', 'error');
    }
  };

  const handleUpdate = async (data: Record<string, unknown>) => {
    if (!selectedRecord) return;
    try {
      await updateMutation.mutateAsync({ id: selectedRecord.id as string, data });
      showToast('רשומה עודכנה בהצלחה', 'success');
      setModal(null);
      setSelectedRecord(null);
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>).response?.data?.message;
      showToast(typeof msg === 'string' ? msg : 'שגיאה בעדכון', 'error');
    }
  };

  const handleDelete = async () => {
    if (!selectedRecord) return;
    try {
      await deleteMutation.mutateAsync(selectedRecord.id as string);
      showToast(schema?.hasSoftDelete ? 'רשומה סומנה כמחוקה' : 'רשומה נמחקה', 'success');
      setModal(null);
      setSelectedRecord(null);
    } catch (err) {
      const msg = (err as AxiosError<{ message?: string }>).response?.data?.message;
      showToast(typeof msg === 'string' ? msg : 'שגיאה במחיקה', 'error');
    }
  };

  if (!schema) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Columns to show in table (max 8, skip objects/lists/hidden)
  const tableFields = schema.fields
    .filter((f) => f.kind !== 'object' && !f.isList && f.type !== 'Bytes')
    .slice(0, 8);

  const records = result?.data || [];
  const totalPages = result?.meta ? Math.ceil(result.meta.total / ITEMS_PER_PAGE) : 1;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Link href="/platform/admin" className="text-label-md text-primary hover:underline">
          ניהול נתונים
        </Link>
        <span className="text-on-surface-variant">/</span>
      </div>
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-headline-sm sm:text-headline-md font-headline">{schema.label}</h2>
          <p className="text-body-sm font-mono text-on-surface-variant">{schema.name}</p>
        </div>
        <button
          onClick={() => { setSelectedRecord(null); setModal('create'); }}
          className="bg-primary text-on-primary px-4 py-2 rounded-lg text-label-md hover:bg-primary-container transition-colors whitespace-nowrap"
        >
          + חדש
        </button>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="חיפוש..."
          className="w-full sm:max-w-md rounded-lg border border-outline-variant px-3 py-2 text-body-md bg-surface-container-lowest outline-none focus:border-primary transition-colors"
          dir="rtl"
        />
      </div>

      {/* Loading / Error */}
      {isLoading && (
        <div className="rounded-xl border border-outline-variant p-8 text-center">
          <div className="w-6 h-6 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      )}
      {isError && (
        <div className="rounded-xl bg-error-container p-6 text-on-error-container">
          שגיאה בטעינת נתונים
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && (
        <>
          {records.length === 0 ? (
            <div className="rounded-xl border border-outline-variant p-8 text-center">
              <p className="text-title-lg mb-2">אין רשומות</p>
            </div>
          ) : (
            <div className="rounded-xl border border-outline-variant overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-container-low">
                    <tr>
                      {tableFields.map((f) => (
                        <th key={f.name} className="px-3 py-2.5 text-start text-label-sm text-on-surface-variant whitespace-nowrap">
                          {f.name}
                        </th>
                      ))}
                      <th className="px-3 py-2.5 text-start text-label-sm text-on-surface-variant">פעולות</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant">
                    {records.map((record, idx) => (
                      <tr key={(record.id as string) || idx} className="hover:bg-surface-container-low/50 transition-colors">
                        {tableFields.map((f) => (
                          <td key={f.name} className="px-3 py-2.5">
                            <CellValue field={f} value={record[f.name]} />
                          </td>
                        ))}
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/platform/admin/${modelName}/${record.id}`}
                              className="text-label-sm text-primary hover:underline"
                            >
                              צפייה
                            </Link>
                            <button
                              onClick={() => { setSelectedRecord(record); setModal('edit'); }}
                              className="text-label-sm text-secondary hover:underline"
                            >
                              עריכה
                            </button>
                            <button
                              onClick={() => { setSelectedRecord(record); setModal('delete'); }}
                              className="text-label-sm text-error hover:underline"
                            >
                              מחיקה
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-label-md border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40"
              >
                הקודם
              </button>
              <span className="text-body-sm text-on-surface-variant px-3">
                {page} / {totalPages} ({result?.meta.total} רשומות)
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-label-md border border-outline-variant hover:bg-surface-container-low transition-colors disabled:opacity-40"
              >
                הבא
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {/* Create Modal */}
      {modal === 'create' && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-surface rounded-2xl shadow-ambient-lg p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-title-lg font-headline mb-4">יצירת {schema.label}</h3>
            <DynamicForm
              fields={schema.fields}
              onSubmit={handleCreate}
              isPending={createMutation.isPending}
              onCancel={() => setModal(null)}
            />
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {modal === 'edit' && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-surface rounded-2xl shadow-ambient-lg p-6 w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-title-lg font-headline mb-4">עריכת {schema.label}</h3>
            <DynamicForm
              fields={schema.fields}
              initialData={selectedRecord}
              onSubmit={handleUpdate}
              isPending={updateMutation.isPending}
              onCancel={() => { setModal(null); setSelectedRecord(null); }}
            />
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {modal === 'delete' && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-on-surface/40 flex items-center justify-center p-4" onClick={() => setModal(null)}>
          <div className="bg-surface rounded-2xl shadow-ambient-lg p-6 w-full max-w-sm text-center" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-title-lg font-headline mb-3">
              {schema.hasSoftDelete ? 'סימון כמחוק' : 'מחיקה לצמיתות'}
            </h3>
            <p className="text-body-md text-on-surface-variant mb-6">
              {schema.hasSoftDelete
                ? 'הרשומה תסומן כמחוקה ולא תופיע ברשימות.'
                : 'הרשומה תימחק לצמיתות. פעולה זו אינה הפיכה.'}
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="bg-error text-on-error px-4 py-2 rounded-lg text-label-md hover:bg-error/80 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? '...' : 'מחק'}
              </button>
              <button
                onClick={() => { setModal(null); setSelectedRecord(null); }}
                className="text-label-md text-on-surface-variant hover:text-on-surface"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
