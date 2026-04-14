'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { Users, Upload, Settings, BarChart3 } from 'lucide-react';

export default function AdminPage() {
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
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-md font-headline mb-2">
          ניהול מערכת
        </h1>
        <p className="text-body-md text-on-surface-variant">
          כלים למנהלי מערכת
        </p>
      </div>

      {/* Admin Menu */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Manage Users */}
        <Link
          href="/dashboard/admin/users"
          className="card-elevated hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary-container/20 flex items-center justify-center">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-title-md font-medium">ניהול משתמשים</h3>
              <p className="text-label-sm text-on-surface-variant">
                צפה וערוך הרשאות
              </p>
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            ניהול משתמשים, תפקידים והרשאות במערכת
          </p>
        </Link>

        {/* CSV Import */}
        <Link
          href="/dashboard/admin/csv-import"
          className="card-elevated hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-secondary-container/20 flex items-center justify-center">
              <Upload className="h-6 w-6 text-secondary" />
            </div>
            <div>
              <h3 className="text-title-md font-medium">ייבוא נתונים</h3>
              <p className="text-label-sm text-on-surface-variant">
                ייבא משתמשים מ-CSV
              </p>
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            ייבוא מסיבי של משתמשים וקבוצות מקובץ CSV
          </p>
        </Link>

        {/* Reports */}
        <Link
          href="/dashboard/admin/reports"
          className="card-elevated hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-tertiary-container/20 flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-tertiary" />
            </div>
            <div>
              <h3 className="text-title-md font-medium">דוחות ניתוח</h3>
              <p className="text-label-sm text-on-surface-variant">
                צפה בנתונים וסטטיסטיקות
              </p>
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            דוחות התשלומים, פעילויות וניתוחים
          </p>
        </Link>

        {/* Settings */}
        <Link
          href="/dashboard/admin/settings"
          className="card-elevated hover:shadow-lg transition-shadow cursor-pointer"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-lg bg-warning-container/20 flex items-center justify-center">
              <Settings className="h-6 w-6 text-warning" />
            </div>
            <div>
              <h3 className="text-title-md font-medium">הגדרות מערכת</h3>
              <p className="text-label-sm text-on-surface-variant">
                קבע פרמטרים כוללים
              </p>
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            הגדרות מערכת, רשאות וביטחון
          </p>
        </Link>
      </div>
    </div>
  );
}
