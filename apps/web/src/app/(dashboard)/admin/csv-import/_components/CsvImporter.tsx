'use client';

import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { Upload, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import Papa from 'papaparse';

interface CsvRow {
  [key: string]: string;
}

interface ImportResult {
  successful: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export function CsvImporter() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CsvRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importMutation = useMutation({
    mutationFn: async (rows: CsvRow[]) => {
      const response = await api.post('/admin/import-users', { users: rows });
      return response.data.data as ImportResult;
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrors([]);
    setPreview([]);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setErrors(
            results.errors.map(
              (err) => `שורה ${err.row}: ${err.message}`
            )
          );
          return;
        }

        const rows = results.data as CsvRow[];
        const required = ['phone', 'role'];
        const invalidRows = rows.filter((row) =>
          required.some((field) => !row[field] || row[field].trim() === '')
        );

        if (invalidRows.length > 0) {
          setErrors([
            `${invalidRows.length} שורות חסרות שדות חובה (phone, role)`,
          ]);
          return;
        }

        setPreview(rows.slice(0, 5));
        setFile(selectedFile);
      },
      error: (error) => {
        setErrors([`שגיאה בקריאת הקובץ: ${error.message}`]);
      },
    });
  };

  const handleImport = async () => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as CsvRow[];
        importMutation.mutate(rows);
      },
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-primary/10');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('bg-primary/10');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary/10');
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && fileInputRef.current) {
      // Create a DataTransfer to set the file
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      fileInputRef.current.files = dataTransfer.files;
      handleFileChange({
        target: { files: dataTransfer.files },
      } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="card border-2 border-dashed border-border rounded-lg p-12 text-center transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
        />
        <Upload className="h-12 w-12 mx-auto text-primary/40 mb-4" />
        <h3 className="text-title-md font-medium mb-2">
          גרור קובץ CSV כאן או בחר
        </h3>
        <p className="text-body-sm text-on-surface-variant mb-6">
          קובץ חייב להכיל עמודות: phone, role, ו-name (אופציונלי)
        </p>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary"
        >
          בחר קובץ
        </button>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="rounded-lg bg-error-container px-6 py-4 space-y-2">
          {errors.map((error, idx) => (
            <div key={idx} className="flex gap-3 text-on-error-container">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-body-sm">{error}</p>
            </div>
          ))}
        </div>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <h3 className="text-title-md font-medium mb-4">תצוגה מקדימה</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead className="border-b border-border bg-surface-container-low">
                <tr>
                  {Object.keys(preview[0]).map((key) => (
                    <th
                      key={key}
                      className="px-4 py-3 text-start text-label-md font-medium"
                    >
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {preview.map((row, idx) => (
                  <tr key={idx}>
                    {Object.values(row).map((value, idx) => (
                      <td key={idx} className="px-4 py-3">
                        {value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-label-sm text-on-surface-variant mt-4">
            מוצגות 5 שורות ראשונות בלבד
          </p>
        </div>
      )}

      {/* Import Result */}
      {importMutation.isSuccess && importMutation.data && (
        <div className="rounded-lg bg-success-container/20 px-6 py-4 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle className="h-6 w-6 text-success flex-shrink-0" />
            <div>
              <p className="text-title-md font-medium text-on-surface">
                ייבוא הושלם בהצלחה
              </p>
              <p className="text-body-sm text-on-surface-variant mt-1">
                {importMutation.data.successful} משתמשים ייובאו
                {importMutation.data.failed > 0 &&
                  `, ${importMutation.data.failed} נכשל`}
              </p>
            </div>
          </div>

          {importMutation.data.errors.length > 0 && (
            <div className="ml-9 space-y-2 border-t border-success/30 pt-4">
              <p className="text-label-md font-medium">שגיאות:</p>
              {importMutation.data.errors.map((err, idx) => (
                <p key={idx} className="text-body-sm text-on-surface-variant">
                  שורה {err.row}: {err.error}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Import Button */}
      {file && !importMutation.isSuccess && (
        <button
          onClick={handleImport}
          disabled={importMutation.isPending}
          className="btn-primary w-full py-3"
        >
          {importMutation.isPending ? (
            <div className="flex items-center justify-center gap-2">
              <Loader className="h-5 w-5 animate-spin" />
              מייבא...
            </div>
          ) : (
            'ייבא משתמשים'
          )}
        </button>
      )}
    </div>
  );
}
