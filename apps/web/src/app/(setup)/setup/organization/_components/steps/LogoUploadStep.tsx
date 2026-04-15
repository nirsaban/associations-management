'use client';

import React, { useState } from 'react';
import { WizardData } from '../../page';
import { Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoUploadStepProps = {
  data: WizardData;
  onUpdate: (data: WizardData) => void;
};

export function LogoUploadStep({ data, onUpdate }: LogoUploadStepProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('אנא בחר קובץ תמונה (PNG, JPG, SVG)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('גודל הקובץ חייב להיות פחות מ-2MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      onUpdate({
        ...data,
        logoFile: file,
        logoPreview: e.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    onUpdate({
      ...data,
      logoFile: undefined,
      logoPreview: undefined,
    });
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-title-lg font-medium mb-2">לוגו העמותה</h2>
        <p className="text-body-sm text-on-surface-variant">
          העלה לוגו לעמותה (אופציונלי - ניתן לדלג)
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
          isDragging && 'border-primary bg-primary/5',
          !isDragging && 'border-border hover:border-primary/50'
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        {data.logoPreview ? (
          <div className="space-y-4">
            <img
              src={data.logoPreview}
              alt="תצוגה מקדימה"
              className="max-h-32 mx-auto object-contain"
            />
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleRemove}
                className="btn-outline flex items-center gap-2"
              >
                <X className="h-4 w-4" />
                הסר תמונה
              </button>
              <label className="btn-ghost cursor-pointer">
                החלף תמונה
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto text-on-surface-variant mb-4" />
            <p className="text-body-lg mb-2">גרור קובץ לכאן או לחץ לבחירה</p>
            <p className="text-body-sm text-on-surface-variant mb-4">
              PNG, JPG או SVG - עד 2MB
            </p>
            <label className="btn-primary inline-flex cursor-pointer">
              בחר קובץ
              <input
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
              />
            </label>
          </>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-error-container px-4 py-3 text-body-sm text-on-error-container">
          {error}
        </div>
      )}

      <div className="bg-surface-container-high rounded-lg p-4">
        <p className="text-body-sm text-on-surface-variant">
          <strong>המלצות:</strong>
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2 text-body-sm text-on-surface-variant">
          <li>השתמש בתמונה מרובעת או עגולה</li>
          <li>רזולוציה מינימלית: 200x200 פיקסלים</li>
          <li>רקע שקוף (PNG) מומלץ</li>
          <li>הלוגו יוצג בגודל קטן - הקפד על קריאות</li>
        </ul>
      </div>
    </div>
  );
}
