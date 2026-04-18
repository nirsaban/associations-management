'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, CheckCircle, User, Users, CreditCard, TruckIcon, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

interface HomepageContext {
  user: {
    fullName: string;
    phone: string;
    groupName?: string;
  };
  paymentSummary: {
    currentMonthStatus: 'paid' | 'pending' | 'overdue';
    currentMonthAmount: number;
    dueDate?: string;
  } | null;
  weeklyDistributor: {
    isDistributorThisWeek: boolean;
    weekKey: string;
    groupName: string;
    familyCount: number;
  } | null;
  notifications: Array<{
    id: string;
    title: string;
    body: string;
    type: 'info' | 'warning' | 'error';
    createdAt: string;
    read: boolean;
  }>;
}

export function UserDashboard() {
  const { user } = useAuthStore();

  // Use homepage context endpoint instead of separate dashboard endpoint
  const {
    data: context,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['homepage-context', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: HomepageContext }>('/homepage/context');
      return response.data.data;
    },
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card h-48 animate-pulse bg-surface-container" />
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
          <span>שגיאה בטעינת הדשבורד</span>
        </div>
      </div>
    );
  }

  const payment = context?.paymentSummary;
  const isDue = payment?.dueDate && new Date(payment.dueDate) < new Date();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-lg font-headline mb-2">
          שלום, {context?.user?.fullName || 'משתמש'}
        </h1>
        <p className="text-body-md text-on-surface-variant">ברוכים הבאים לדשבורד האישי שלך</p>
      </div>

      {/* Weekly Distributor Notice - High Priority */}
      {context?.weeklyDistributor?.isDistributorThisWeek && (
        <div className="card-elevated border-2 border-primary bg-primary-container/30">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-full bg-primary">
              <TruckIcon className="h-8 w-8 text-on-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-headline-md font-headline text-primary mb-2">אתה המחלק השבועי</h2>
              <p className="text-body-md text-on-surface-variant mb-4">
                שובץ לך תפקיד חלוקה עבור קבוצת {context.weeklyDistributor.groupName} השבוע
              </p>
              <div className="flex items-center gap-4 mb-4">
                <div className="px-4 py-2 rounded-lg bg-surface-container">
                  <p className="text-label-sm text-on-surface-variant">שבוע</p>
                  <p className="text-body-md font-medium">{context.weeklyDistributor.weekKey}</p>
                </div>
                <div className="px-4 py-2 rounded-lg bg-surface-container">
                  <p className="text-label-sm text-on-surface-variant">משפחות</p>
                  <p className="text-body-md font-medium">
                    {context.weeklyDistributor.familyCount}
                  </p>
                </div>
              </div>
              <Link href="/distributor/current" className="btn-primary inline-block">
                צפייה בפרטי החלוקה
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Summary Card */}
        <div className="card-elevated">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-full bg-primary/10">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-title-lg font-medium mb-1">הפרופיל שלי</h2>
              <p className="text-body-sm text-on-surface-variant">פרטים אישיים</p>
            </div>
          </div>

          <div className="space-y-3 mb-4">
            <div className="p-3 rounded-lg bg-surface-container">
              <p className="text-label-sm text-on-surface-variant">שם מלא</p>
              <p className="text-body-md font-medium">{context?.user?.fullName}</p>
            </div>
            <div className="p-3 rounded-lg bg-surface-container">
              <p className="text-label-sm text-on-surface-variant">טלפון</p>
              <p className="text-body-md font-medium">{context?.user?.phone}</p>
            </div>
          </div>

          <Link href="/profile" className="btn-outline w-full">
            צפייה בפרופיל מלא
          </Link>
        </div>

        {/* Payment Status Card */}
        <div
          className={`card-elevated border-2 ${
            payment?.currentMonthStatus === 'paid'
              ? 'border-success'
              : isDue
                ? 'border-error'
                : 'border-warning'
          }`}
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">סטטוס תשלום חודשי</p>
              {payment ? (
                <h2 className="text-headline-lg font-bold">
                  ₪{payment.currentMonthAmount.toLocaleString()}
                </h2>
              ) : (
                <h2 className="text-headline-md font-headline">אין תשלומים</h2>
              )}
            </div>
            {payment?.currentMonthStatus === 'paid' ? (
              <CheckCircle className="h-8 w-8 text-success" />
            ) : payment ? (
              <AlertCircle className={`h-8 w-8 ${isDue ? 'text-error' : 'text-warning'}`} />
            ) : (
              <CheckCircle className="h-8 w-8 text-success" />
            )}
          </div>

          {payment && (
            <>
              {payment.dueDate && (
                <div className="mb-4 p-4 rounded-lg bg-surface-container">
                  <p className="text-label-sm text-on-surface-variant mb-1">תאריך לתשלום</p>
                  <p className="text-body-md font-medium">
                    {format(new Date(payment.dueDate), 'd MMMM yyyy', { locale: he })}
                  </p>
                </div>
              )}

              {payment.currentMonthStatus === 'pending' && (
                <Link href="/my-donations" className="btn-primary w-full">
                  צפייה בתשלומים
                </Link>
              )}

              {payment.currentMonthStatus === 'paid' && (
                <div className="p-4 rounded-lg bg-success-container text-on-success-container text-center">
                  <p className="font-medium">תשלום שולם בהצלחה</p>
                </div>
              )}
            </>
          )}

          {!payment && (
            <div className="p-4 rounded-lg bg-success-container text-on-success-container text-center">
              <p className="font-medium">אין תשלומים ממתינים</p>
            </div>
          )}
        </div>

        {/* My Group Card */}
        <div className="card-elevated">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-full bg-secondary/10">
              <Users className="h-6 w-6 text-secondary" />
            </div>
            <div className="flex-1">
              <h2 className="text-title-lg font-medium mb-1">הקבוצה שלי</h2>
              <p className="text-body-sm text-on-surface-variant">
                {context?.user?.groupName || 'לא משויך לקבוצה'}
              </p>
            </div>
          </div>

          {context?.user?.groupName ? (
            <>
              <div className="p-4 rounded-lg bg-surface-container mb-4">
                <p className="text-label-sm text-on-surface-variant mb-1">שם הקבוצה</p>
                <p className="text-body-lg font-medium">{context.user.groupName}</p>
              </div>
              <Link href="/my-group" className="btn-outline w-full">
                צפייה בפרטי קבוצה
              </Link>
            </>
          ) : (
            <div className="p-4 rounded-lg bg-surface-container text-center">
              <p className="text-body-sm text-on-surface-variant">
                צור קשר עם מנהל המערכת לשיוך לקבוצה
              </p>
            </div>
          )}
        </div>

        {/* Recent Notifications Card */}
        <div className="card-elevated">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 rounded-full bg-tertiary/10">
              <Bell className="h-6 w-6 text-tertiary" />
            </div>
            <div className="flex-1">
              <h2 className="text-title-lg font-medium mb-1">התראות אחרונות</h2>
              <p className="text-body-sm text-on-surface-variant">
                {context?.notifications?.length || 0} התראות
              </p>
            </div>
          </div>

          {context?.notifications && context.notifications.length > 0 ? (
            <>
              <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                {context.notifications.slice(0, 3).map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-3 rounded-lg ${
                      notif.read ? 'bg-surface-container' : 'bg-primary-container/30'
                    }`}
                  >
                    <p className="text-body-sm font-medium line-clamp-2">{notif.title}</p>
                    <p className="text-label-sm text-on-surface-variant mt-1">
                      {format(new Date(notif.createdAt), 'HH:mm d/M', { locale: he })}
                    </p>
                  </div>
                ))}
              </div>
              <Link href="/notifications" className="btn-outline w-full">
                צפייה בכל ההתראות
              </Link>
            </>
          ) : (
            <div className="p-4 rounded-lg bg-surface-container text-center">
              <p className="text-body-sm text-on-surface-variant">אין התראות חדשות</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-headline-md font-headline mb-4">קישורים מהירים</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/my-donations" className="card hover:shadow-lg transition-shadow">
            <CreditCard className="h-8 w-8 text-primary mb-3" />
            <h3 className="text-title-md font-medium mb-2">התרומות שלי</h3>
            <p className="text-body-sm text-on-surface-variant">היסטוריית תשלומים ותרומות</p>
          </Link>

          <Link href="/profile" className="card hover:shadow-lg transition-shadow">
            <User className="h-8 w-8 text-secondary mb-3" />
            <h3 className="text-title-md font-medium mb-2">הגדרות פרופיל</h3>
            <p className="text-body-sm text-on-surface-variant">עדכון פרטים אישיים והגדרות</p>
          </Link>

          <Link href="/notifications" className="card hover:shadow-lg transition-shadow">
            <Bell className="h-8 w-8 text-tertiary mb-3" />
            <h3 className="text-title-md font-medium mb-2">התראות</h3>
            <p className="text-body-sm text-on-surface-variant">כל ההתראות וההודעות שלך</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
