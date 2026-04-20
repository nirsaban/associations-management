'use client';

import React from 'react';
import { useGroups } from '@/hooks/useGroups';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { AlertCircle, Plus, Users } from 'lucide-react';

export default function GroupsPage() {
  const { list } = useGroups();
  const { user } = useAuthStore();
  const { data: groups, isLoading, error } = list;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-surface-container" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הקבוצות</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-headline mb-2">קבוצות</h1>
          <p className="text-body-md text-on-surface-variant">ניהול קבוצות וחברים</p>
        </div>
        {user?.systemRole === 'ADMIN' && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            קבוצה חדשה
          </button>
        )}
      </div>

      {!groups || groups.length === 0 ? (
        <div className="card text-center py-12">
          <Users className="h-12 w-12 mx-auto text-on-surface-variant/30 mb-4" />
          <h3 className="text-title-md font-medium mb-2">אין קבוצות</h3>
          <p className="text-body-sm text-on-surface-variant">התחל ביצירת קבוצה חדשה</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-title-md font-medium mb-3">{group.name}</h3>
              {group.description && (
                <p className="text-body-sm text-on-surface-variant mb-4 line-clamp-2">
                  {group.description}
                </p>
              )}
              <div className="flex gap-6 pt-4 border-t border-border">
                <div>
                  <p className="text-label-sm text-on-surface-variant">חברים</p>
                  <p className="text-title-md font-medium">{group.memberCount}</p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant">משפחות</p>
                  <p className="text-title-md font-medium">{group.familiesCount}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
