'use client';

import React from 'react';
import { Home, Phone, MapPin, AlertCircle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface Family {
  id: string;
  familyName: string;
  contactName: string;
  contactPhone: string;
  address: string;
  notes?: string;
}

export default function ManagerFamiliesPage() {
  const { user } = useAuthStore();

  const { data: families, isLoading, error } = useQuery({
    queryKey: ['manager-families', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: Family[] }>('/manager/families');
      return response.data.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="card h-64 animate-pulse bg-surface-container" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת רשימת משפחות</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-headline-lg font-headline mb-2">משפחות בקבוצה</h1>
        <p className="text-body-md text-on-surface-variant">
          רשימת משפחות תחת ניהול הקבוצה שלך
        </p>
      </div>

      {/* Info Note */}
      <div className="card bg-primary-container/30 border-2 border-primary/20">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-body-md font-medium text-primary mb-1">
              הרשאות תצוגה בלבד
            </p>
            <p className="text-body-sm text-on-surface-variant">
              כמנהל קבוצה, תוכל לצפות בפרטי המשפחות בקבוצה שלך.
              לעריכה או הוספת משפחות חדשות יש לפנות למנהל המערכת.
            </p>
          </div>
        </div>
      </div>

      {/* Families List */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <Home className="h-6 w-6 text-primary" />
          רשימת משפחות ({families?.length || 0})
        </h2>

        {!families || families.length === 0 ? (
          <div className="text-center py-12">
            <Home className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-body-lg text-on-surface-variant mb-2">
              אין משפחות בקבוצה
            </p>
            <p className="text-body-sm text-on-surface-variant">
              צור קשר עם מנהל המערכת להוספת משפחות
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {families.map((family) => (
              <div
                key={family.id}
                className="p-5 rounded-lg bg-surface-container hover:bg-surface-variant/50 transition-colors"
              >
                {/* Family Name */}
                <div className="flex items-start gap-3 mb-4">
                  <div className="p-2 rounded-full bg-primary/10">
                    <Home className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-title-md font-medium mb-1">{family.familyName}</h3>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-on-surface-variant flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-label-sm text-on-surface-variant">איש קשר</p>
                      <p className="text-body-md font-medium">{family.contactName}</p>
                      <p className="text-body-sm text-on-surface-variant" dir="ltr">
                        {family.contactPhone}
                      </p>
                    </div>
                  </div>

                  {family.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-on-surface-variant flex-shrink-0 mt-1" />
                      <div className="flex-1">
                        <p className="text-label-sm text-on-surface-variant">כתובת</p>
                        <p className="text-body-md">{family.address}</p>
                      </div>
                    </div>
                  )}

                  {family.notes && (
                    <div className="pt-3 border-t border-outline/20">
                      <p className="text-label-sm text-on-surface-variant mb-1">הערות</p>
                      <p className="text-body-sm text-on-surface-variant">{family.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
