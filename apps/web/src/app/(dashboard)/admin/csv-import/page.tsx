'use client';

import React, { useState, useRef } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { api } from '@/lib/api';

type PageState = 'upload' | 'validating' | 'preview' | 'importing' | 'summary';

interface ValidatedRow {
  rowNum: number;
  phone: string;
  fullName: string;
  groupName: string | null;
  groupRole: 'MANAGER' | 'MEMBER' | null;
}

interface ErrorRow {
  row: number;
  reason: string;
  data?: Record<string, unknown>;
}

interface CommitResult {
  usersCreated: number;
  groupsCreated: number;
  membersCreated: number;
  managersCreated: number;
}

export default function CsvImportPage() {
  const { user } = useAuthStore();
  const [state, setState] = useState<PageState>('upload');
  const [csvContent, setCsvContent] = useState('');
  const [validRows, setValidRows] = useState<ValidatedRow[]>([]);
  const [errorRows, setErrorRows] = useState<ErrorRow[]>([]);
  const [commitResult, setCommitResult] = useState<CommitResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (user?.systemRole !== 'ADMIN') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
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
        const res = await api.post('/admin/import/users/validate', { csvContent: content });
        const data = res.data.data;
        setValidRows(data.validRows);
        setErrorRows(data.errorRows);
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
      const res = await api.post('/admin/import/users/commit', { csvContent });
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
    setValidRows([]);
    setErrorRows([]);
    setCommitResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownloadTemplate = () => {
    const BOM = '\uFEFF';
    const template = `phone,fullName,groupName,role\n0501234567,ישראל ישראלי,ביתר א,מנהל קבוצה\n0501234568,חיים כהן,ביתר א,חבר קבוצה\n0501234569,שרה לוי,,תורם`;
    const blob = new Blob([BOM + template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadErrors = () => {
    const BOM = '\uFEFF';
    const header = 'row,phone,fullName,groupName,role,error\n';
    const rows = errorRows.map((err) => {
      const d = err.data || {};
      return `${err.row},"${d.phone || ''}","${d.fullName || ''}","${d.groupName || ''}","${d.role || ''}","${err.reason}"`;
    }).join('\n');
    const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'import-errors.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-headline-sm sm:text-headline-md font-headline mb-1 sm:mb-2">ייבוא משתמשים</h1>
          <p className="text-body-sm sm:text-body-md text-on-surface-variant">ייבא משתמשים וקבוצות מקובץ CSV</p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 rounded-lg border border-outline/30 text-body-sm hover:bg-surface-container transition-colors w-full sm:w-auto"
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
            className="border-2 border-dashed border-outline/30 rounded-xl p-6 sm:p-12 text-center transition-colors"
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
            <p className="text-body-sm text-on-surface-variant mt-4">
              קובץ CSV או TXT, עד 5MB
            </p>
          </div>

          {/* Format instructions */}
          <div className="bg-surface-container-low rounded-xl p-6">
            <h3 className="text-title-md font-medium mb-3">פורמט ��קובץ</h3>
            <div className="bg-surface-container rounded-lg p-4 font-mono text-label-sm overflow-x-auto" dir="ltr">
              <pre>{`phone,fullName,groupName,role
0501234567,ישראל ישראלי,ביתר א,מנהל קבוצה
0501234568,חיים כהן,ביתר א,חבר קבוצה
0501234569,שרה לוי,,תורם`}</pre>
            </div>
            <div className="mt-4 text-body-sm text-on-surface-variant space-y-1">
              <p><strong>תפקידים אפשריים:</strong> תורם, חבר קבוצה, מנהל קבוצה</p>
              <p><strong>שם קבוצה:</strong> אופציונלי — אם ריק, המשתמש לא משויך ל��בוצה</p>
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
      {state === 'preview' && (
        <div className="space-y-6">
          {/* Summary banner */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-surface-container-low">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-body-md font-medium">{validRows.length} שורות תקינות</span>
            </div>
            {errorRows.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-body-md font-medium">{errorRows.length} שורות עם שגיאות</span>
              </div>
            )}
          </div>

          {/* Preview table */}
          <div className="overflow-x-auto rounded-xl border border-outline/20">
            <table className="w-full text-body-sm">
              <thead className="bg-surface-container-low sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-start text-label-md font-medium">#</th>
                  <th className="px-4 py-3 text-start text-label-md font-medium">טלפון</th>
                  <th className="px-4 py-3 text-start text-label-md font-medium">שם מלא</th>
                  <th className="px-4 py-3 text-start text-label-md font-medium">קבוצה</th>
                  <th className="px-4 py-3 text-start text-label-md font-medium">תפק��ד</th>
                  <th className="px-4 py-3 text-start text-label-md font-medium">סטטוס</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/10">
                {validRows.map((row) => (
                  <tr key={row.rowNum} className="bg-green-50/30">
                    <td className="px-4 py-2">{row.rowNum}</td>
                    <td className="px-4 py-2 font-mono" dir="ltr">{row.phone}</td>
                    <td className="px-4 py-2">{row.fullName}</td>
                    <td className="px-4 py-2">{row.groupName || '—'}</td>
                    <td className="px-4 py-2">{row.groupRole === 'MANAGER' ? 'מנהל קבוצה' : row.groupRole === 'MEMBER' ? 'חבר קבוצה' : 'תורם'}</td>
                    <td className="px-4 py-2 text-green-600">✓</td>
                  </tr>
                ))}
                {errorRows.map((row) => (
                  <tr key={`err-${row.row}`} className="bg-red-50/30">
                    <td className="px-4 py-2">{row.row}</td>
                    <td className="px-4 py-2 font-mono" dir="ltr">{String(row.data?.phone || '')}</td>
                    <td className="px-4 py-2">{String(row.data?.fullName || '')}</td>
                    <td className="px-4 py-2">{String(row.data?.groupName || '—')}</td>
                    <td className="px-4 py-2">{String(row.data?.role || '')}</td>
                    <td className="px-4 py-2 text-red-600 text-body-sm">{row.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            {validRows.length > 0 && (
              <button
                onClick={handleCommit}
                className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-body-md font-medium hover:bg-primary/90 transition-colors"
              >
                יבא {validRows.length} שורות תקינות
              </button>
            )}
            <button
              onClick={handleReset}
              className="px-6 py-2.5 rounded-lg border border-outline/30 text-body-md hover:bg-surface-container transition-colors"
            >
              בטל
            </button>
            {errorRows.length > 0 && (
              <button
                onClick={handleDownloadErrors}
                className="px-4 py-2.5 rounded-lg text-body-sm text-on-surface-variant hover:bg-surface-container transition-colors"
              >
                הורד דוח שגיאות
              </button>
            )}
          </div>
        </div>
      )}

      {/* Importing state */}
      {state === 'importing' && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-body-md text-on-surface-variant">מייבא...</p>
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
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-start">
              <div className="bg-white rounded-lg p-4">
                <p className="text-display-sm font-bold text-primary">{commitResult.usersCreated}</p>
                <p className="text-body-sm text-on-surface-variant">משתמשים נוספו</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-display-sm font-bold text-primary">{commitResult.groupsCreated}</p>
                <p className="text-body-sm text-on-surface-variant">קבוצות נוצרו</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-display-sm font-bold text-primary">{commitResult.membersCreated}</p>
                <p className="text-body-sm text-on-surface-variant">שולבו כחברי קבוצה</p>
              </div>
              <div className="bg-white rounded-lg p-4">
                <p className="text-display-sm font-bold text-primary">{commitResult.managersCreated}</p>
                <p className="text-body-sm text-on-surface-variant">כמנהלי קבוצה</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 justify-center">
            <a
              href="/admin/users"
              className="px-6 py-2.5 rounded-lg bg-primary text-on-primary text-body-md font-medium hover:bg-primary/90 transition-colors"
            >
              צפה במשתמשים
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
