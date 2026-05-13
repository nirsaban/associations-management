'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, CreditCard, Search, ArrowRight, Phone, Mail, Bell } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface UnpaidUser {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  reminderCount?: number;
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getLast12Months(): { value: string; label: string }[] {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ value: key, label: format(d, 'MMMM yyyy', { locale: he }) });
  }
  return months;
}

export default function UnpaidUsersPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.systemRole === 'ADMIN';
  const [monthKey, setMonthKey] = useState(getCurrentMonthKey());
  const [search, setSearch] = useState('');

  const { data: unpaidUsers, isLoading, error } = useQuery<UnpaidUser[]>({
    queryKey: ['unpaid-users', monthKey],
    queryFn: async () => {
      const res = await api.get<{ data: UnpaidUser[] }>('/admin/unpaid-users', {
        params: { monthKey },
      });
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const filtered = (unpaidUsers ?? []).filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.phone?.includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const months = getLast12Months();
  const currentMonthLabel = months.find((m) => m.value === monthKey)?.label ?? monthKey;

  if (!isAdmin) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container">
          <p>גישה מוגבלת - דף זה מיועד למנהלים בלבד</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הנתונים</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin" className="p-2 rounded-full hover:bg-surface-container transition-colors">
          <ArrowRight className="h-5 w-5 text-on-surface-variant" />
        </Link>
        <div>
          <h1 className="text-headline-md font-headline">טרם שילמו החודש</h1>
          <p className="text-body-md text-on-surface-variant">
            משתמשים שלא שילמו עבור {currentMonthLabel}
          </p>
        </div>
      </div>

      {/* Stats + Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="card-elevated flex items-center gap-4 flex-1">
          <div className="p-3 rounded-full bg-warning/10">
            <CreditCard className="h-7 w-7 text-warning" />
          </div>
          <div>
            <p className="text-headline-lg font-bold text-warning">{filtered.length}</p>
            <p className="text-label-md text-on-surface-variant">טרם שילמו</p>
          </div>
        </div>
        <div className="card-elevated flex items-center gap-3 flex-1">
          <select
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="rounded-lg border border-outline px-3 py-2 text-sm bg-surface text-on-surface flex-1"
          >
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש לפי שם, טלפון או אימייל..."
          className="w-full rounded-lg border border-outline pr-10 pl-4 py-3 text-body-md bg-surface text-on-surface placeholder:text-on-surface-variant/50"
        />
      </div>

      {/* Users List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto text-success/30 mb-4" />
          <h3 className="text-title-md font-medium mb-2">
            {search ? 'לא נמצאו תוצאות' : 'כולם שילמו!'}
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {search ? 'נסו לשנות את מילות החיפוש' : `כל המשתמשים שילמו עבור ${currentMonthLabel}`}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-outline/30">
          <table className="w-full">
            <thead className="border-b border-outline/30 bg-surface-container-low">
              <tr>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">שם</th>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">טלפון</th>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">אימייל</th>
                <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">תזכורות שנשלחו</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/20">
              {filtered.map((u) => (
                <tr key={u.id} className="hover:bg-surface-container/50">
                  <td className="px-6 py-4">
                    <p className="text-body-md font-medium">{u.fullName || '—'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-body-md" dir="ltr">
                      <Phone className="h-3.5 w-3.5 text-on-surface-variant" />
                      {u.phone}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {u.email ? (
                      <span className="inline-flex items-center gap-1.5 text-body-md">
                        <Mail className="h-3.5 w-3.5 text-on-surface-variant" />
                        {u.email}
                      </span>
                    ) : (
                      <span className="text-body-sm text-on-surface-variant">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-label-sm font-medium ${
                      (u.reminderCount ?? 0) > 0
                        ? 'bg-warning-container text-on-warning-container'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}>
                      <Bell className="h-3.5 w-3.5" />
                      {u.reminderCount ?? 0}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
