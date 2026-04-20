'use client';

import React, { useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

type PageState = 'upload' | 'validating' | 'preview' | 'importing' | 'summary';

interface FieldDiff {
  field: string;
  oldValue: string | null;
  newValue: string | null;
}

interface FamilyGroupLink {
  name: string;
  action: 'link_existing' | 'auto_create' | 'clear' | 'none';
}

interface FamilyValidatedRow {
  rowNumber: number;
  familyName: string;
  action: 'create' | 'update';
  fieldDiff: FieldDiff[];
  groupLink: FamilyGroupLink | null;
  status: 'valid' | 'valid_with_warnings' | 'error';
  warnings: string[];
  errors: { field: string; message: string }[];
  contactPhone: string | null;
  childrenMinorCount: number | null;
  totalMemberCount: number | null;
  address: string | null;
  groupName: string | null;
}

interface FamilyValidateResult {
  summary: {
    totalRows: number;
    validRows: number;
    rowsWithWarnings: number;
    rowsWithErrors: number;
    familiesToCreate: number;
    familiesToUpdate: number;
    groupsToAutoCreate: number;
  };
  rows: FamilyValidatedRow[];
}

interface FamilyCommitResult {
  familiesCreated: number;
  familiesUpdated: number;
  groupsAutoCreated: number;
  familiesLinkedToGroup: number;
  familyGroupsCleared: number;
}

export default function FamiliesImportPage() {
  const { user } = useAuthStore();
  const [state, setState] = useState<PageState>('upload');
  const [csvContent, setCsvContent] = useState('');
  const [validateResult, setValidateResult] = useState<FamilyValidateResult | null>(null);
  const [commitResult, setCommitResult] = useState<FamilyCommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user?.systemRole !== 'ADMIN') {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container">
          <p>גישה מגובלת. עמוד זה זמין רק למנהלי מערכת.</p>
        </div>
      </div>
    );
  }

  const handleFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setError('גודל הקובץ חורג מ-5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      const content = e.target?.result as string;
      setCsvContent(content);
      setState('validating');
      setError(null);

      try {
        const res = await api.post('/admin/import/families/validate', { csvContent: content });
        setValidateResult(res.data.data);
        setState('preview');
      } catch (err: any) {
        setError(err.response?.data?.message || 'שגיאה באימות הקובץ');
        setState('upload');
      }
    };
    reader.readAsText(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary');
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('border-primary');
  };

  const handleCommit = async () => {
    setState('importing');
    try {
      const res = await api.post('/admin/import/families/commit', { csvContent, rows: validateResult?.rows || [] });
      setCommitResult(res.data.data);
      setState('summary');
    } catch (err: any) {
      setError(err.response?.data?.message || 'שגיאה בייבוא');
      setState('preview');
    }
  };

  const handleReset = () => {
    setState('upload');
    setCsvContent('');
    setValidateResult(null);
    setCommitResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const BOM = '\uFEFF';
    const template = `familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address\nמשפחת כהן,0501112222,3,ביתר א,5,רחוב הרצל 10 ירושלים\nמשפחת לוי,0503334444,,ביתר א,,רחוב יפו 22 ירושלים\nמשפחת מזרחי,,,,,`;
    const blob = new Blob([BOM + template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'families-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadReport = () => {
    if (!validateResult) return;
    const BOM = '\uFEFF';
    const header = 'row,familyName,action,status,notes\n';
    const reportRows = validateResult.rows
      .filter((r) => r.status !== 'valid')
      .map((r) => {
        const notes = [...r.warnings, ...r.errors.map((e) => e.message)].join(' | ');
        return `${r.rowNumber},"${r.familyName}","${r.action}","${r.status}","${notes}"`;
      })
      .join('\n');
    const blob = new Blob([BOM + header + reportRows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'families-import-report.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const importableRows = validateResult?.rows.filter((r) => r.status !== 'error') || [];
  const hasImportableRows = importableRows.length > 0;
  const hasIssues = validateResult?.rows.some((r) => r.status !== 'valid') || false;

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-headline-md font-headline mb-2">ייבוא משפחות</h1>
          <p className="text-body-md text-on-surface-variant">ייבא משפחות מקובץ CSV — חדשות ייווצרו, קיימות יעודכנו</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 rounded-lg border border-outline/30 text-body-sm hover:bg-surface-container transition-colors"
        >
          הורד תבנית CSV
        </button>
      </div>

      {/* Upload state */}
      {state === 'upload' && (
        <div className="space-y-6">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className="border-2 border-dashed border-outline/30 rounded-xl p-12 text-center transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              onChange={handleFileInput}
              className="hidden"
            />
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <h3 className="text-title-md font-medium mb-2">גרור קובץ CSV כאן</h3>
            <p className="text-body-sm text-on-surface-variant mb-4">או</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-body-md font-medium hover:bg-primary/90 transition-colors"
            >
              בחר קובץ
            </button>
            <p className="text-body-sm text-on-surface-variant mt-4">קובץ CSV או TXT, עד 5MB</p>
          </div>

          {/* Format instructions */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-title-md font-medium mb-3">פורמט הקובץ</h3>
            <div className="bg-surface-container rounded-lg p-4 font-mono text-label-sm overflow-x-auto" dir="ltr">
              <pre>{`familyName,contactPhone,childrenMinorCount,groupName,totalMemberCount,address
משפחת כהן,0501112222,3,ביתר א,5,רחוב הרצל 10 ירושלים
משפחת לוי,0503334444,,ביתר א,,רחוב יפו 22 ירושלים
משפחת מזרחי,,,,,`}</pre>
            </div>
            <div className="mt-4 text-body-sm text-on-surface-variant space-y-1">
              <p><strong>שם משפחה:</strong> חובה — אם קיים בעמותה, יעודכן</p>
              <p><strong>טלפון איש קשר:</strong> אופציונלי — לא יכול להיות זהה לטלפון משתמש קיים</p>
              <p><strong>ילדים קטינים / סך נפשות:</strong> אופציונלי — מספרים שלמים</p>
              <p><strong>שם קבוצה:</strong> אופציונלי — קבוצה חדשה תיווצר אוטומטית</p>
              <p><strong>כתובת:</strong> אופציונלי — טקסט חופשי</p>
            </div>
          </div>
        </div>
      )}

      {/* Validating state */}
      {state === 'validating' && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-body-md text-on-surface-variant">מאמת נתונים...</p>
        </div>
      )}

      {/* Preview state */}
      {state === 'preview' && validateResult && (
        <div className="space-y-6">
          {/* Summary banner */}
          <div className="flex flex-wrap items-center gap-4 p-4 rounded-xl bg-surface-container-low">
            {validateResult.summary.familiesToCreate > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-green-500" />
                <span className="text-body-sm font-medium">{validateResult.summary.familiesToCreate} משפחות חדשות</span>
              </div>
            )}
            {validateResult.summary.familiesToUpdate > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-body-sm font-medium">{validateResult.summary.familiesToUpdate} לעדכון</span>
              </div>
            )}
            {validateResult.summary.groupsToAutoCreate > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-body-sm font-medium">{validateResult.summary.groupsToAutoCreate} קבוצות חדשות ייווצרו</span>
              </div>
            )}
            {validateResult.summary.rowsWithErrors > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-body-sm font-medium">{validateResult.summary.rowsWithErrors} שורות עם שגיאות</span>
              </div>
            )}
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-xl border border-outline/20">
            <table className="w-full text-body-sm">
              <thead className="bg-surface-container-low sticky top-0">
                <tr>
                  <th className="px-3 py-3 text-start text-label-md font-medium">#</th>
                  <th className="px-3 py-3 text-start text-label-md font-medium">שם משפחה</th>
                  <th className="px-3 py-3 text-start text-label-md font-medium">פעולה</th>
                  <th className="px-3 py-3 text-start text-label-md font-medium">איש קשר</th>
                  <th className="px-3 py-3 text-start text-label-md font-medium">ילדים / נפשות</th>
                  <th className="px-3 py-3 text-start text-label-md font-medium">קבוצה</th>
                  <th className="px-3 py-3 text-start text-label-md font-medium">כתובת</th>
                  <th className="px-3 py-3 text-start text-label-md font-medium">סטטוס</th>
                  <th className="px-3 py-3 text-start text-label-md font-medium">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {validateResult.rows.map((row) => {
                  const bgClass = row.status === 'error'
                    ? 'bg-red-50/30'
                    : row.status === 'valid_with_warnings'
                    ? 'bg-amber-50/30'
                    : 'bg-green-50/30';

                  return (
                    <tr key={row.rowNumber} className={bgClass}>
                      <td className="px-3 py-2">{row.rowNumber}</td>
                      <td className="px-3 py-2 font-medium">{row.familyName}</td>
                      <td className="px-3 py-2">
                        {row.action === 'create' ? (
                          <span className="px-2 py-0.5 rounded bg-green-100 text-green-700 text-label-sm">חדש</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 text-label-sm">עדכון</span>
                        )}
                      </td>
                      <td className="px-3 py-2 font-mono text-label-sm" dir="ltr">
                        {row.contactPhone || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {row.childrenMinorCount !== null || row.totalMemberCount !== null
                          ? `${row.childrenMinorCount ?? '—'} / ${row.totalMemberCount ?? '—'}`
                          : '—'}
                      </td>
                      <td className="px-3 py-2">
                        {row.groupLink?.action === 'link_existing' && (
                          <span className="text-green-600">{row.groupName} <span className="text-label-sm">(קיימת)</span></span>
                        )}
                        {row.groupLink?.action === 'auto_create' && (
                          <span className="text-blue-600">{row.groupName} <span className="text-label-sm">(תיווצר)</span></span>
                        )}
                        {row.groupLink?.action === 'clear' && (
                          <span className="text-orange-500 text-label-sm">יוסר</span>
                        )}
                        {(row.groupLink?.action === 'none' || !row.groupLink) && (
                          <span className="text-on-surface-variant">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 max-w-[150px] truncate" title={row.address || ''}>
                        {row.address || '—'}
                      </td>
                      <td className="px-3 py-2">
                        {row.status === 'valid' && <span className="text-green-600">✓</span>}
                        {row.status === 'valid_with_warnings' && <span className="text-amber-500">⚠️</span>}
                        {row.status === 'error' && <span className="text-red-600">✗</span>}
                      </td>
                      <td className="px-3 py-2 text-body-sm max-w-xs">
                        {row.errors.length > 0 && (
                          <div className="text-red-600">
                            {row.errors.map((e, i) => <div key={i}>{e.message}</div>)}
                          </div>
                        )}
                        {row.warnings.length > 0 && (
                          <div className="text-amber-600">
                            {row.warnings.map((w, i) => <div key={i}>{w}</div>)}
                          </div>
                        )}
                        {row.action === 'update' && row.fieldDiff.length > 0 && (
                          <div className="text-on-surface-variant text-label-sm mt-1">
                            שדות שישתנו: {row.fieldDiff.map((d) => d.field).join(', ')}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* No importable rows message */}
          {!hasImportableRows && (
            <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
              אין שורות תקינות לייבוא. תקן את השגיאות ונסה שוב.
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            {hasImportableRows && (
              <button
                onClick={handleCommit}
                className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-body-md font-medium hover:bg-primary/90 transition-colors"
              >
                יבא משפחות ({importableRows.length})
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg border border-outline/30 text-body-md hover:bg-surface-container transition-colors"
            >
              בטל
            </button>
            {hasIssues && (
              <button
                onClick={handleDownloadReport}
                className="px-4 py-2.5 rounded-lg text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                הורד דוח
              </button>
            )}
          </div>
        </div>
      )}

      {/* Importing state */}
      {state === 'importing' && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-body-md text-on-surface-variant">מייבא משפחות...</p>
        </div>
      )}

      {/* Summary state */}
      {state === 'summary' && commitResult && (
        <div className="space-y-6">
          <div className="bg-green-50 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-headline-sm font-headline mb-4">הייבוא הושלם בהצלחה!</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto text-start">
              <div className="bg-white rounded-lg p-4">
                <p className="text-display-sm font-bold text-primary">{commitResult.familiesCreated}</p>
                <p className="text-body-sm text-on-surface-variant">משפחות נוצרו</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-display-sm font-bold text-primary">{commitResult.familiesUpdated}</p>
                <p className="text-body-sm text-on-surface-variant">משפחות עודכנו</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-display-sm font-bold text-primary">{commitResult.groupsAutoCreated}</p>
                <p className="text-body-sm text-on-surface-variant">קבוצות נוצרו</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-display-sm font-bold text-primary">{commitResult.familiesLinkedToGroup}</p>
                <p className="text-body-sm text-on-surface-variant">שויכו לקבוצות</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-display-sm font-bold text-primary">{commitResult.familyGroupsCleared}</p>
                <p className="text-body-sm text-on-surface-variant">שיוכים הוסרו</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-center">
            <a
              href="/admin/families"
              className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-body-md font-medium hover:bg-primary/90 transition-colors"
            >
              עבור לרשימת משפחות
            </a>
            <a
              href="/admin/groups"
              className="px-6 py-2.5 rounded-lg border border-outline/30 text-body-md hover:bg-surface-container transition-colors"
            >
              עבור לרשימת קבוצות
            </a>
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg border border-outline/30 text-body-md hover:bg-surface-container transition-colors"
            >
              ייבא שוב
            </button>
          </div>
        </div>
      )}

      {/* Global error */}
      {error && (
        <div className="mt-4 rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}
    </div>
  );
}
