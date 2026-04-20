'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, CreditCard, Check, Clock, AlertTriangle, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface AdminPayment {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  amount: number;
  monthKey: string;
  status: string;
  paymentDate?: string;
  createdAt: string;
}

interface AdminPaymentsResponse {
  payments: AdminPayment[];
  total: number;
  page: number;
  pageSize: number;
}

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.systemRole === 'ADMIN';
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-payments', page],
    queryFn: async () => {
      const res = await api.get<{ data: AdminPaymentsResponse }>('/admin/payments', {
        params: { page, pageSize },
      });
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const payments = response?.payments ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
      case 'PAID':
        return <Check className="h-5 w-5 text-success" />;
      case 'overdue':
      case 'OVERDUE':
        return <AlertTriangle className="h-5 w-5 text-error" />;
      case 'pending':
      case 'PENDING':
        return <Clock className="h-5 w-5 text-warning" />;
      default:
        return <CreditCard className="h-5 w-5 text-on-surface-variant" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'שולם';
      case 'OVERDUE':
        return 'פג תוקף';
      case 'PENDING':
        return 'ממתין';
      case 'CANCELLED':
        return 'בוטל';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
        return 'bg-success-container text-on-success-container';
      case 'OVERDUE':
        return 'bg-error-container text-on-error-container';
      case 'PENDING':
        return 'bg-warning-container text-on-warning-container';
      case 'CANCELLED':
        return 'bg-surface-container text-on-surface-variant';
      default:
        return 'bg-surface-container';
    }
  };

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
          <span>שגיאה בטעינת התשלומים</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-headline mb-2">תשלומים</h1>
          <p className="text-body-md text-on-surface-variant">
            ניהול תשלומים של כל המשתמשים ({total} סה"כ)
          </p>
        </div>
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Filter className="h-5 w-5" />
          <span className="text-body-sm">סינון</span>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="card h-20 animate-pulse bg-surface-container" />
          ))}
        </div>
      ) : payments.length === 0 ? (
        <div className="card text-center py-12">
          <CreditCard className="h-12 w-12 mx-auto text-on-surface-variant/30 mb-4" />
          <h3 className="text-title-md font-medium mb-2">אין תשלומים</h3>
          <p className="text-body-sm text-on-surface-variant">לא נמצאו תשלומים להצגה</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-outline/30">
            <table className="w-full">
              <thead className="border-b border-outline/30 bg-surface-container-low">
                <tr>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    משתמש
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    חודש
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    סכום
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    סטטוס
                  </th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">
                    תאריך תשלום
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/20">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-surface-container/50">
                    <td className="px-6 py-4">
                      <p className="text-body-md font-medium">{payment.userName || '—'}</p>
                      {payment.userPhone && (
                        <p className="text-body-sm text-on-surface-variant" dir="ltr">
                          {payment.userPhone}
                        </p>
                      )}
                    </td>
                    <td className="px-6 py-4 text-body-md">
                      {payment.monthKey
                        ? format(new Date(payment.monthKey + '-01'), 'MMMM yyyy', { locale: he })
                        : '—'}
                    </td>
                    <td className="px-6 py-4 text-body-md font-bold text-primary">
                      ₪{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-label-sm font-medium ${getStatusColor(payment.status)}`}
                      >
                        {getStatusIcon(payment.status)}
                        {getStatusLabel(payment.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-body-md text-on-surface-variant">
                      {payment.paymentDate
                        ? format(new Date(payment.paymentDate), 'd MMMM yyyy', { locale: he })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-body-sm text-on-surface-variant">
              עמוד {page} מתוך {totalPages} ({total} תשלומים)
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="btn-outline px-4 py-2 disabled:opacity-50"
              >
                הקודם
              </button>
              <button
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
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
