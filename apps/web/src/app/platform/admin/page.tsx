'use client';

import Link from 'next/link';
import { useAdminModels } from '@/hooks/usePlatformAdmin';

export default function AdminIndexPage() {
  const { data: models, isLoading, isError } = useAdminModels();

  if (isLoading) {
    return (
      <div>
        <h2 className="text-headline-md font-headline mb-6">ניהול נתונים</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-xl p-5 bg-surface-container animate-pulse h-24" />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !models) {
    return (
      <div className="rounded-xl bg-error-container p-6 text-on-error-container">
        שגיאה בטעינת רשימת המודלים
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-headline-md font-headline mb-6">ניהול נתונים</h2>
      <p className="text-body-md text-on-surface-variant mb-6">
        {models.length} טבלאות במערכת
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {models.map((model) => (
          <Link
            key={model.name}
            href={`/platform/admin/${model.name}`}
            className="rounded-xl border border-outline-variant p-5 hover:bg-surface-container-low/50 transition-colors group"
          >
            <h3 className="text-title-md font-headline group-hover:text-primary transition-colors">
              {model.label}
            </h3>
            <p className="text-label-sm font-mono text-on-surface-variant mt-1">
              {model.name}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-headline-sm font-headline text-primary">
                {model.recordCount}
              </span>
              <div className="flex gap-1">
                {model.isTenantScoped && (
                  <span className="text-label-sm px-1.5 py-0.5 rounded bg-secondary-container/40 text-secondary">
                    tenant
                  </span>
                )}
                {model.hasSoftDelete && (
                  <span className="text-label-sm px-1.5 py-0.5 rounded bg-tertiary-fixed/30 text-tertiary">
                    soft-del
                  </span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
