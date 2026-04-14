'use client';

import React, { useState } from 'react';
import { usePayments } from '@/hooks/usePayments';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, CreditCard, Check, Clock, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function PaymentsPage() {
  const { list, history, pay } = usePayments();
  const { user } = useAuthStore();
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const isAdmin = user?.systemRole === 'ADMIN';
  const listQuery = isAdmin ? list : history;
  const { data: payments, isLoading, error } = listQuery;
  const { mutate: payMutation, isPending: isPaymentPending } = pay;

  if (error) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת התשלומים</span>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <Check className="h-5 w-5 text-success" />;
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-error" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <CreditCard className="h-5 w-5 text-on-surface-variant" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'שולם';
      case 'overdue':
        return 'פג תוקף';
      case 'pending':
        return 'ממתין';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success-container text-on-success-container';
      case 'overdue':
        return 'bg-error-container text-on-error-container';
      case 'pending':
        return 'bg-warning-container text-on-warning-container';
      case 'cancelled':
        return 'bg-surface-container text-on-surface-variant';
      default:
        return 'bg-surface-container';
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-headline-md font-headline mb-2">תשלומים</h1>
        <p className="text-body-md text-on-surface-variant">
          {isAdmin ? 'ניהול תשלומים של כל המשתמשים' : 'היסטוריית התשלומים שלך'}
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : !payments || payments.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto text-on-surface-variant/30 mb-4" />
          <h3 className="text-title-md font-medium mb-2">
            {isAdmin ? 'אין תשלומים' : 'אין תשלומים'}
          </h3>
          <p className="text-body-sm text-on-surface-variant">
            {isAdmin
              ? 'כל התשלומים עדכניים'
              : 'אתה עדכני עם כל התשלומים'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {payments.map((payment) => (
            <div key={payment.id} className="card">
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-border">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="text-title-md font-medium">
                        {'userName' in payment && payment.userName
                          ? payment.userName
                          : 'משתמש'}
                      </p>
                      <p className="text-label-sm text-on-surface-variant">
                        {'groupName' in payment && payment.groupName
                          ? payment.groupName
                          : 'הקבוצה'}
                      </p>
                    </div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-label-sm font-medium ${getStatusColor(
                    payment.status
                  )}`}
                >
                  {getStatusLabel(payment.status)}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-label-sm text-on-surface-variant mb-1">
                    סכום
                  </p>
                  <p className="text-title-md font-bold text-primary">
                    ₪{payment.amount}
                  </p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant mb-1">
                    חודש
                  </p>
                  <p className="text-body-sm font-medium">
                    {format(new Date(payment.month + '-01'), 'MMMM yyyy', {
                      locale: he,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-label-sm text-on-surface-variant mb-1">
                    תאריך הפקדה
                  </p>
                  <p className="text-body-sm font-medium">
                    {format(new Date(payment.dueDate), 'd/M', { locale: he })}
                  </p>
                </div>
              </div>

              {payment.status === 'pending' && (
                <button
                  onClick={() => payMutation(payment.id)}
                  disabled={isPaymentPending}
                  className="btn-primary w-full py-2"
                >
                  {isPaymentPending && selectedPaymentId === payment.id
                    ? 'עיבוד...'
                    : 'תשלם עכשיו'}
                </button>
              )}

              {payment.status === 'paid' && payment.paidAt && (
                <div className="p-3 rounded-lg bg-success-container/20 text-on-success text-center text-label-sm font-medium">
                  תשלום בוצע ב-
                  {format(new Date(payment.paidAt), 'd MMMM yyyy', {
                    locale: he,
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
