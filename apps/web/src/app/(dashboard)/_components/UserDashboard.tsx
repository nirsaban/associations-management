'use client';

import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import Link from 'next/link';

export function UserDashboard() {
  const { userDashboard } = useDashboard();
  const { data, isLoading, error } = userDashboard;

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="card h-32 animate-pulse bg-surface-container" />
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

  const payment = data?.currentPayment;
  const isDue = payment?.dueDate && new Date(payment.dueDate) < new Date();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-headline mb-2">ברוכים הבאים</h1>
        <p className="text-body-md text-on-surface-variant">
          זהו דשבורד משתמש אישי שלך
        </p>
      </div>

      {/* Payment Status Card */}
      {payment && (
        <div className={`card-elevated border-2 ${
          payment.status === 'paid'
            ? 'border-success'
            : isDue
            ? 'border-error'
            : 'border-warning'
        }`}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">
                סטטוס תשלום חודשי
              </p>
              <h2 className="text-headline-md font-headline">₪{payment.amount}</h2>
            </div>
            {payment.status === 'paid' ? (
              <CheckCircle className="h-8 w-8 text-success" />
            ) : (
              <AlertCircle className={`h-8 w-8 ${isDue ? 'text-error' : 'text-warning'}`} />
            )}
          </div>

          <div className="mb-6 p-4 rounded-lg bg-surface-container">
            <p className="text-label-md text-on-surface-variant mb-2">תאריך הפקדה</p>
            <p className="text-body-md font-medium">
              {format(new Date(payment.dueDate), 'd MMMM yyyy', { locale: he })}
            </p>
          </div>

          {payment.status === 'pending' && (
            <Link
              href="/dashboard/payments"
              className="btn-primary w-full py-3"
            >
              תשלם עכשיו
            </Link>
          )}

          {payment.status === 'paid' && (
            <div className="p-4 rounded-lg bg-success-container text-on-success-container text-center">
              <p className="font-medium">תשלום שולם בהצלחה</p>
            </div>
          )}
        </div>
      )}

      {!payment && (
        <div className="card-elevated border-2 border-success">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-8 w-8 text-success" />
            <h2 className="text-headline-md font-headline">אין תשלומים ממתינים</h2>
          </div>
          <p className="text-body-md text-on-surface-variant">
            אתה עדכני עם כל התשלומים שלך
          </p>
        </div>
      )}

      {/* Notifications */}
      {data?.notifications && data.notifications.length > 0 && (
        <div>
          <h2 className="text-headline-md font-headline mb-4">התראות</h2>
          <div className="space-y-3">
            {data.notifications.map((notif) => (
              <div
                key={notif.id}
                className={`card px-4 py-3 flex items-start gap-3 ${
                  notif.type === 'error'
                    ? 'bg-error-container text-on-error-container'
                    : notif.type === 'warning'
                    ? 'bg-warning-container text-on-warning-container'
                    : 'bg-surface-container'
                }`}
              >
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-body-sm font-medium">{notif.message}</p>
                  <p className="text-label-sm opacity-75 mt-1">
                    {format(new Date(notif.createdAt), 'HH:mm d/M', { locale: he })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
