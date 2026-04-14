'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { ROLE_LABELS } from '@/lib/constants';

interface User {
  id: string;
  phone: string;
  name?: string;
  role: string;
  groupId?: string;
  email?: string;
  createdAt: string;
}

export default function UsersPage() {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['admin', 'users', page],
    queryFn: async () => {
      const res = await api.get('/users', {
        params: { page, pageSize },
      });
      return res.data.data;
    },
  });

  const users = response?.users as User[] || [];
  const total = response?.total || 0;
  const totalPages = Math.ceil(total / pageSize);

  const filteredUsers = users.filter(
    (u) =>
      u.name?.includes(searchTerm) ||
      u.phone.includes(searchTerm) ||
      u.email?.includes(searchTerm)
  );

  if (user?.systemRole !== 'ADMIN') {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container">
          <p>גישה מגובלת</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת משתמשים</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-headline mb-2">משתמשים</h1>
          <p className="text-body-md text-on-surface-variant">
            ניהול משתמשים במערכת ({total} סה"כ)
          </p>
        </div>
        <button className="btn-primary flex items-center gap-2">
          <Plus className="h-5 w-5" />
          משתמש חדש
        </button>
      </div>

      {/* Search */}
      <div className="mb-6 relative">
        <Search className="absolute start-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
        <input
          type="text"
          placeholder="חפש לפי שם, טלפון או אימייל..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-container-low ps-12 px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card h-16 animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-border bg-surface-container-low">
                <tr>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    שם
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    טלפון
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    תפקיד
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    אימייל
                  </th>
                  <th className="px-6 py-4 text-center text-label-md font-medium text-on-surface-variant">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-surface-container-low/50">
                    <td className="px-6 py-4 text-body-md font-medium">
                      {u.name || '—'}
                    </td>
                    <td className="px-6 py-4 text-body-md">{u.phone}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary-container/20 text-primary text-label-sm font-medium">
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-md">
                      {u.email || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-2 hover:bg-surface-container rounded-md transition-colors text-secondary">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button className="p-2 hover:bg-surface-container rounded-md transition-colors text-error">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between">
            <p className="text-body-sm text-on-surface-variant">
              עמוד {page} מתוך {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-outline px-4 py-2 disabled:opacity-50"
              >
                קודם
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="btn-outline px-4 py-2 disabled:opacity-50"
              >
                הבא
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
