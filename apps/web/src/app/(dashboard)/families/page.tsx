'use client';

import React, { useState } from 'react';
import { useFamilies } from '@/hooks/useFamilies';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';
import { AlertCircle, Plus, Home, Search } from 'lucide-react';

export default function FamiliesPage() {
  const { list } = useFamilies();
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const { data: families, isLoading, error } = list;

  const filteredFamilies = families?.filter(
    (family) =>
      family.name.includes(searchTerm) ||
      family.contactPhone.includes(searchTerm) ||
      family.contactName.includes(searchTerm),
  );

  if (isLoading) {
    return (
      <div className="p-8">
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
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת המשפחות</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-headline-md font-headline mb-2">משפחות</h1>
          <p className="text-body-md text-on-surface-variant">ניהול משפחות המקבלות סיוע</p>
        </div>
        {user?.systemRole === 'ADMIN' ? (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            משפחה חדשה
          </button>
        ) : null}
      </div>

      {/* Search Bar */}
      <div className="mb-6 relative">
        <Search className="absolute start-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-on-surface-variant" />
        <input
          type="text"
          placeholder="חפש לפי שם, טלפון או שם יצירת קשר..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-lg border border-border bg-surface-container-low ps-12 px-4 py-3 text-body-md transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {!filteredFamilies || filteredFamilies.length === 0 ? (
        <div className="card text-center py-12">
          <Home className="h-12 w-12 mx-auto text-on-surface-variant/30 mb-4" />
          <h3 className="text-title-md font-medium mb-2">אין משפחות</h3>
          <p className="text-body-sm text-on-surface-variant">
            {searchTerm ? 'לא נמצאו משפחות התאמות החיפוש' : 'התחל ביצירת משפחה חדשה'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFamilies.map((family) => (
            <Link
              key={family.id}
              href={`/families/${family.id}`}
              className="card hover:shadow-lg transition-shadow cursor-pointer"
            >
              <h3 className="text-title-md font-medium mb-3">{family.name}</h3>
              <div className="space-y-2 mb-4 pb-4 border-b border-border">
                <div>
                  <p className="text-label-sm text-on-surface-variant">אנשי קשר</p>
                  <p className="text-body-sm font-medium">{family.contactName}</p>
                  <p className="text-label-sm text-on-surface-variant">{family.contactPhone}</p>
                </div>
              </div>

              {family.address && (
                <div>
                  <p className="text-label-sm text-on-surface-variant">כתובת</p>
                  <p className="text-body-sm font-medium line-clamp-2">
                    {family.address}
                    {family.city ? `, ${family.city}` : ''}
                  </p>
                </div>
              )}

              {(family.childrenCount || family.adultCount) && (
                <div className="flex gap-4 mt-4 pt-4 border-t border-border">
                  {family.childrenCount !== undefined && (
                    <div>
                      <p className="text-label-sm text-on-surface-variant">ילדים</p>
                      <p className="text-title-md font-medium">{family.childrenCount}</p>
                    </div>
                  )}
                  {family.adultCount !== undefined && (
                    <div>
                      <p className="text-label-sm text-on-surface-variant">מבוגרים</p>
                      <p className="text-title-md font-medium">{family.adultCount}</p>
                    </div>
                  )}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
