'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { CsvImporter } from './_components/CsvImporter';

export default function CsvImportPage() {
  const { user } = useAuthStore();

  if (user?.systemRole !== 'ADMIN') {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container">
          <p>גישה מגובלת. עמוד זה זמין רק למנהלי מערכת.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-md font-headline mb-2">ייבוא משתמשים</h1>
        <p className="text-body-md text-on-surface-variant">
          ייבא משתמשים וקבוצות מקובץ CSV
        </p>
      </div>

      {/* Instructions */}
      <div className="card-elevated mb-8">
        <h2 className="text-title-lg font-medium mb-4">הוראות הייבוא</h2>
        <div className="space-y-3 text-body-sm text-on-surface-variant">
          <p>
            1. כדי להתחיל, הכן קובץ CSV עם העמודות הבאות:
          </p>
          <ul className="list-disc list-inside space-y-2 ms-4">
            <li>
              <span className="font-mono bg-surface-container px-2 py-1 rounded">
                phone
              </span>{' '}
              - מספר טלפון ישראלי (חובה)
            </li>
            <li>
              <span className="font-mono bg-surface-container px-2 py-1 rounded">
                role
              </span>{' '}
              - תפקיד (admin, manager, user, distributor) (חובה)
            </li>
            <li>
              <span className="font-mono bg-surface-container px-2 py-1 rounded">
                name
              </span>{' '}
              - שם מלא (אופציונלי)
            </li>
            <li>
              <span className="font-mono bg-surface-container px-2 py-1 rounded">
                email
              </span>{' '}
              - כתובת דוא"ל (אופציונלי)
            </li>
          </ul>
          <p className="mt-4">
            2. גרור את הקובץ לאזור הירוק או בחר קובץ CSV
          </p>
          <p>
            3. בדוק את התצוגה המקדימה והקלק "ייבא משתמשים"
          </p>
        </div>
      </div>

      {/* Sample CSV */}
      <div className="card mb-8">
        <h3 className="text-title-md font-medium mb-4">דוגמה CSV</h3>
        <div className="bg-surface-container p-4 rounded-lg overflow-x-auto font-mono text-label-sm">
          <pre>{`phone,role,name,email
0501234567,manager,יוסי כהן,yossi@example.com
0502345678,user,מרים לוי,miriam@example.com
0503456789,distributor,דוד אברהם,david@example.com`}</pre>
        </div>
      </div>

      {/* Importer Component */}
      <CsvImporter />
    </div>
  );
}
