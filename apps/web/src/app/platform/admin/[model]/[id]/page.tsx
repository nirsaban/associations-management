'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAdminSchema, useAdminRecord, useAdminDelete } from '@/hooks/usePlatformAdmin';
import { useToast } from '@/components/ui/Toast';

export default function AdminRecordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const modelName = params.model as string;
  const recordId = params.id as string;

  const { data: schema } = useAdminSchema(modelName);
  const { data: record, isLoading, isError } = useAdminRecord(modelName, recordId);
  const deleteMutation = useAdminDelete(modelName);

  const handleDelete = async () => {
    if (!confirm(schema?.hasSoftDelete ? 'לסמן רשומה כמחוקה?' : 'למחוק רשומה לצמיתות?')) return;
    try {
      await deleteMutation.mutateAsync(recordId);
      showToast('רשומה נמחקה', 'success');
      router.push(`/platform/admin/${modelName}`);
    } catch {
      showToast('שגיאה במחיקה', 'error');
    }
  };

  if (isLoading || !schema) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !record) {
    return (
      <div>
        <div className="mb-4">
          <Link href={`/platform/admin/${modelName}`} className="text-label-md text-primary hover:underline">
            &rarr; חזור לרשימה
          </Link>
        </div>
        <div className="rounded-xl bg-error-container p-6 text-on-error-container">
          רשומה לא נמצאה
        </div>
      </div>
    );
  }

  // Separate fields into groups
  const scalarFields = schema.fields.filter((f) => f.kind !== 'object');
  const relationFields = schema.fields.filter((f) => f.kind === 'object');

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-2 text-label-md">
        <Link href="/platform/admin" className="text-primary hover:underline">ניהול נתונים</Link>
        <span className="text-on-surface-variant">/</span>
        <Link href={`/platform/admin/${modelName}`} className="text-primary hover:underline">{schema.label}</Link>
        <span className="text-on-surface-variant">/</span>
      </div>

      <div className="flex items-start justify-between mb-6 gap-4">
        <div>
          <h2 className="text-headline-sm font-headline">{schema.label}</h2>
          <p className="text-body-sm font-mono text-on-surface-variant">{recordId}</p>
        </div>
        <button
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="bg-error-container text-error px-4 py-2 rounded-lg text-label-md hover:bg-error-container/80 transition-colors disabled:opacity-50"
        >
          {schema.hasSoftDelete ? 'סמן כמחוק' : 'מחק'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Scalar fields */}
        <section className="rounded-xl border border-outline-variant p-5">
          <h3 className="text-title-md font-headline mb-4">שדות</h3>
          <dl className="space-y-3">
            {scalarFields.map((field) => {
              const value = record[field.name];
              return (
                <div key={field.name} className="flex items-start gap-3">
                  <dt className="text-label-sm text-on-surface-variant min-w-[120px] font-mono">
                    {field.name}
                  </dt>
                  <dd className="text-body-sm flex-1 break-all">
                    {value === null || value === undefined ? (
                      <span className="text-on-surface-variant/50">null</span>
                    ) : field.type === 'Boolean' ? (
                      <span className={`px-2 py-0.5 rounded-full text-label-sm ${
                        value ? 'bg-secondary-container text-secondary' : 'bg-error-container text-error'
                      }`}>
                        {value ? 'true' : 'false'}
                      </span>
                    ) : field.type === 'DateTime' ? (
                      new Date(value as string).toLocaleString('he-IL')
                    ) : field.kind === 'enum' ? (
                      <span className="px-2 py-0.5 rounded-full text-label-sm bg-surface-container-high">
                        {String(value)}
                      </span>
                    ) : field.type === 'Json' ? (
                      <pre className="bg-surface-container-low rounded p-2 text-xs font-mono overflow-x-auto max-h-40">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      String(value)
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>
        </section>

        {/* Relations */}
        {relationFields.length > 0 && (
          <section className="rounded-xl border border-outline-variant p-5">
            <h3 className="text-title-md font-headline mb-4">קשרים</h3>
            <dl className="space-y-3">
              {relationFields.map((field) => {
                const value = record[field.name] as Record<string, unknown> | null;
                if (!value) {
                  return (
                    <div key={field.name} className="flex items-start gap-3">
                      <dt className="text-label-sm text-on-surface-variant min-w-[120px] font-mono">
                        {field.name}
                      </dt>
                      <dd className="text-on-surface-variant/50 text-body-sm">null</dd>
                    </div>
                  );
                }
                const display = field.displayField ? value[field.displayField] : value.id;
                return (
                  <div key={field.name} className="flex items-start gap-3">
                    <dt className="text-label-sm text-on-surface-variant min-w-[120px] font-mono">
                      {field.name}
                    </dt>
                    <dd>
                      <Link
                        href={`/platform/admin/${field.relationModel}/${value.id}`}
                        className="text-primary hover:underline text-body-sm"
                      >
                        {String(display || value.id)}
                      </Link>
                    </dd>
                  </div>
                );
              })}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
