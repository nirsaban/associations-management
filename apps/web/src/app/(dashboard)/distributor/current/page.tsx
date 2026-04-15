'use client';

import React from 'react';
import { TruckIcon, Home, Phone, MapPin, AlertCircle, Info, ClipboardList } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';

interface DistributorFamily {
  id: string;
  familyName: string;
  address: string;
  contactPhone: string;
  contactName: string;
  notes?: string;
  orderSummary?: {
    itemsCount: number;
    items: string[];
  };
}

interface DistributorData {
  weekKey: string;
  groupName: string;
  families: DistributorFamily[];
}

export default function CurrentDistributorPage() {
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['distributor-current', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: DistributorData }>('/distributor/current');
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
          <span>שגיאה בטעינת פרטי החלוקה</span>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8">
        <div className="card-elevated max-w-2xl">
          <div className="flex items-center gap-4 mb-4">
            <Info className="h-10 w-10 text-primary" />
            <div>
              <h2 className="text-headline-md font-headline">אין שיבוץ חלוקה</h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                לא שובצת לך משימת חלוקה השבוע
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="card-elevated border-2 border-primary bg-primary-container/30">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-full bg-primary">
            <TruckIcon className="h-10 w-10 text-on-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-headline-lg font-headline text-primary mb-2">
              אתה המחלק השבועי
            </h1>
            <p className="text-body-md text-on-surface-variant mb-4">
              קבוצת {data.groupName} • שבוע {data.weekKey}
            </p>
            <div className="flex items-center gap-4">
              <div className="px-4 py-2 rounded-lg bg-surface-container">
                <p className="text-label-sm text-on-surface-variant">משפחות לחלוקה</p>
                <p className="text-headline-sm font-bold">{data.families.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Important Note */}
      <div className="card bg-warning-container/30 border-2 border-warning/40">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-body-md font-medium text-warning mb-1">
              הצגת מידע לחלוקה בלבד
            </p>
            <p className="text-body-sm text-on-surface-variant">
              כמחלק שבועי, תוכל לצפות בפרטי משפחות, כתובות וטלפונים לצורך ביצוע החלוקה.
              אין אפשרות לערוך הזמנות, תשלומים או משתמשים.
            </p>
          </div>
        </div>
      </div>

      {/* Families List for Delivery */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <ClipboardList className="h-6 w-6 text-primary" />
          רשימת משפחות לחלוקה
        </h2>

        {!data.families || data.families.length === 0 ? (
          <div className="text-center py-12">
            <Home className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-body-lg text-on-surface-variant">
              אין משפחות לחלוקה
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.families.map((family, index) => (
              <div
                key={family.id}
                className="p-5 rounded-lg bg-surface-container border-2 border-outline/20 hover:border-primary/40 transition-colors"
              >
                {/* Family Header with Number */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-on-primary font-bold text-title-md">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-title-lg font-bold mb-1">{family.familyName}</h3>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* Address */}
                  <div className="p-4 rounded-lg bg-surface">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-label-sm text-on-surface-variant mb-1">כתובת</p>
                        <p className="text-body-lg font-medium">{family.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="p-4 rounded-lg bg-surface">
                    <div className="flex items-start gap-3">
                      <Phone className="h-5 w-5 text-secondary flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-label-sm text-on-surface-variant mb-1">איש קשר</p>
                        <p className="text-body-md font-medium">{family.contactName}</p>
                        <p className="text-body-md text-on-surface-variant" dir="ltr">
                          {family.contactPhone}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                {family.orderSummary && family.orderSummary.itemsCount > 0 && (
                  <div className="p-4 rounded-lg bg-primary-container/20 border border-primary/20">
                    <p className="text-label-sm text-on-surface-variant mb-2">
                      סיכום הזמנה ({family.orderSummary.itemsCount} פריטים)
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {family.orderSummary.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container text-body-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Notes */}
                {family.notes && (
                  <div className="mt-4 p-4 rounded-lg bg-warning-container/20 border border-warning/20">
                    <p className="text-label-sm text-warning mb-1 font-medium">הערות חשובות</p>
                    <p className="text-body-sm text-on-surface">{family.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Instructions */}
      <div className="card bg-surface-container">
        <h3 className="text-title-md font-medium mb-3">הוראות לביצוע החלוקה</h3>
        <ul className="space-y-2 text-body-sm text-on-surface-variant">
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            יש לחלק למשפחות לפי הסדר המספרי
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            מומלץ ליצור קשר עם איש הקשר לפני הגעה
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            שים לב להערות חשובות המצוינות בכל משפחה
          </li>
          <li className="flex gap-2">
            <span className="text-primary">•</span>
            במקרה של בעיה ניתן לפנות למנהל הקבוצה
          </li>
        </ul>
      </div>
    </div>
  );
}
