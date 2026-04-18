'use client';

import React from 'react';
import { useFamilies } from '@/hooks/useFamilies';
import { AlertCircle, ArrowRight, MapPin, Phone, Users } from 'lucide-react';
import Link from 'next/link';

interface FamilyDetailPageProps {
  params: {
    id: string;
  };
}

export default function FamilyDetailPage({ params }: FamilyDetailPageProps) {
  const { get } = useFamilies();
  const { data: family, isLoading, error } = get(params.id);

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="space-y-4">
          <div className="card h-20 animate-pulse bg-surface-container" />
          <div className="card h-40 animate-pulse bg-surface-container" />
        </div>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת נתוני המשפחה</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <Link href="/families" className="flex items-center gap-2 text-primary hover:underline mb-6">
        <ArrowRight className="h-4 w-4" />
        חזרה למשפחות
      </Link>

      {/* Family Header */}
      <div className="card-elevated mb-8">
        <h1 className="text-headline-md font-headline mb-6">{family.name}</h1>

        {/* Contact Information */}
        <div className="space-y-4 pb-6 border-b border-border">
          <div className="flex items-start gap-4">
            <Users className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">אנשי קשר</p>
              <p className="text-body-md font-medium">{family.contactName}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <Phone className="h-5 w-5 text-secondary mt-1 flex-shrink-0" />
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">טלפון</p>
              <a
                href={`tel:${family.contactPhone}`}
                className="text-body-md font-medium text-primary hover:underline"
              >
                {family.contactPhone}
              </a>
            </div>
          </div>

          {family.address && (
            <div className="flex items-start gap-4">
              <MapPin className="h-5 w-5 text-tertiary mt-1 flex-shrink-0" />
              <div>
                <p className="text-label-md text-on-surface-variant mb-1">כתובת</p>
                <p className="text-body-md font-medium">
                  {family.address}
                  {family.city ? `, ${family.city}` : ''}
                  {family.zipCode ? `, ${family.zipCode}` : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Family Composition */}
        {(family.childrenCount !== undefined || family.adultCount !== undefined) && (
          <div className="mt-6 grid grid-cols-2 gap-4">
            {family.childrenCount !== undefined && (
              <div className="p-4 rounded-lg bg-primary-container/20">
                <p className="text-label-sm text-on-surface-variant mb-1">ילדים</p>
                <p className="text-headline-sm font-bold text-primary">{family.childrenCount}</p>
              </div>
            )}
            {family.adultCount !== undefined && (
              <div className="p-4 rounded-lg bg-secondary-container/20">
                <p className="text-label-sm text-on-surface-variant mb-1">מבוגרים</p>
                <p className="text-headline-sm font-bold text-secondary">{family.adultCount}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <button className="card text-center py-4 hover:shadow-lg transition-shadow">
          <p className="text-title-md font-medium mb-1">צור קשר</p>
          <p className="text-label-sm text-on-surface-variant">שלח הודעה לצור קשר</p>
        </button>

        <button className="card text-center py-4 hover:shadow-lg transition-shadow">
          <p className="text-title-md font-medium mb-1">עדכן פרטים</p>
          <p className="text-label-sm text-on-surface-variant">ערוך מידע משפחתי</p>
        </button>
      </div>
    </div>
  );
}
