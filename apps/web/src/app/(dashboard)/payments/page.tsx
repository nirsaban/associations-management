'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { AlertCircle, CreditCard, Check, Clock, AlertTriangle, Filter, TrendingUp, Calendar, X } from 'lucide-react';
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

interface PaymentStatistics {
  currentMonth: { total: number; count: number; monthKey: string };
  currentWeek: { total: number; count: number };
  yearly: { total: number; count: number; year: number };
  bestPaymentDay: { day: number; count: number } | null;
  dayDistribution: Record<string, number>;
}

function getLast12Months(): { value: string; label: string }[] {
  const months = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    months.push({ value: key, label: format(d, 'MMMM yyyy', { locale: he }) });
  }
  return months;
}

export default function PaymentsPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.systemRole === 'ADMIN';
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Filters
  const [monthFilter, setMonthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const hasFilters = !!(monthFilter || statusFilter || fromDate || toDate);

  const clearFilters = () => {
    setMonthFilter('');
    setStatusFilter('');
    setFromDate('');
    setToDate('');
    setPage(1);
  };

  // Statistics
  const { data: stats } = useQuery<PaymentStatistics>({
    queryKey: ['admin-payments-stats'],
    queryFn: async () => {
      const res = await api.get<{ data: PaymentStatistics }>('/admin/payments/statistics');
      return res.data.data;
    },
    enabled: isAdmin,
  });

  // Payments list
  const {
    data: response,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['admin-payments', page, monthFilter, statusFilter, fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, unknown> = { page, pageSize };
      if (monthFilter) params.monthKey = monthFilter;
      if (statusFilter) params.status = statusFilter;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      const res = await api.get<{ data: AdminPaymentsResponse }>('/admin/payments', { params });
      return res.data.data;
    },
    enabled: isAdmin,
  });

  const payments = response?.payments ?? [];
  const total = response?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': case 'COMPLETED': return <Check className="h-4 w-4 text-success" />;
      case 'OVERDUE': return <AlertTriangle className="h-4 w-4 text-error" />;
      case 'PENDING': return <Clock className="h-4 w-4 text-warning" />;
      default: return <CreditCard className="h-4 w-4 text-on-surface-variant" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': case 'COMPLETED': return 'שולם';
      case 'OVERDUE': return 'פג תוקף';
      case 'PENDING': return 'ממתין';
      case 'CANCELLED': return 'בוטל';
      case 'FAILED': return 'נכשל';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': case 'COMPLETED': return 'bg-success-container text-on-success-container';
      case 'OVERDUE': return 'bg-error-container text-on-error-container';
      case 'PENDING': return 'bg-warning-container text-on-warning-container';
      default: return 'bg-surface-container text-on-surface-variant';
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

  const months = getLast12Months();

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-headline-md font-headline mb-2">תשלומים</h1>
        <p className="text-body-md text-on-surface-variant">
          ניהול תשלומים של כל המשתמשים ({total} סה"כ)
        </p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="card-elevated text-center">
            <CreditCard className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-label-sm text-on-surface-variant">חודש נוכחי</p>
            <p className="text-title-lg font-bold text-primary">₪{stats.currentMonth.total.toLocaleString()}</p>
            <p className="text-label-sm text-on-surface-variant">{stats.currentMonth.count} תשלומים</p>
          </div>
          <div className="card-elevated text-center">
            <Calendar className="h-6 w-6 text-secondary mx-auto mb-2" />
            <p className="text-label-sm text-on-surface-variant">שבוע אחרון</p>
            <p className="text-title-lg font-bold text-secondary">₪{stats.currentWeek.total.toLocaleString()}</p>
            <p className="text-label-sm text-on-surface-variant">{stats.currentWeek.count} תשלומים</p>
          </div>
          <div className="card-elevated text-center">
            <TrendingUp className="h-6 w-6 text-tertiary mx-auto mb-2" />
            <p className="text-label-sm text-on-surface-variant">שנתי {stats.yearly.year}</p>
            <p className="text-title-lg font-bold text-tertiary">₪{stats.yearly.total.toLocaleString()}</p>
            <p className="text-label-sm text-on-surface-variant">{stats.yearly.count} תשלומים</p>
          </div>
          <div className="card-elevated text-center">
            <Filter className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-label-sm text-on-surface-variant">יום תשלום מועדף</p>
            <p className="text-title-lg font-bold">
              {stats.bestPaymentDay ? `יום ${stats.bestPaymentDay.day}` : '—'}
            </p>
            <p className="text-label-sm text-on-surface-variant">
              {stats.bestPaymentDay ? `${stats.bestPaymentDay.count} תשלומים` : 'אין מספיק נתונים'}
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card-elevated">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="h-4 w-4 text-on-surface-variant" />
          <h3 className="text-title-sm font-medium">סינון</h3>
          {hasFilters && (
            <button onClick={clearFilters} className="mr-auto text-label-sm text-primary flex items-center gap-1 hover:underline">
              <X className="h-3 w-3" /> נקה סינון
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-outline px-3 py-2 text-sm bg-surface text-on-surface"
          >
            <option value="">כל החודשים</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-outline px-3 py-2 text-sm bg-surface text-on-surface"
          >
            <option value="">כל הסטטוסים</option>
            <option value="COMPLETED">שולם</option>
            <option value="PENDING">ממתין</option>
            <option value="FAILED">נכשל</option>
          </select>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
            placeholder="מתאריך"
            className="rounded-lg border border-outline px-3 py-2 text-sm bg-surface text-on-surface"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1); }}
            placeholder="עד תאריך"
            className="rounded-lg border border-outline px-3 py-2 text-sm bg-surface text-on-surface"
          />
        </div>
      </div>

      {/* Payments Table */}
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
          <p className="text-body-sm text-on-surface-variant">
            {hasFilters ? 'לא נמצאו תשלומים בסינון הנוכחי' : 'לא נמצאו תשלומים להצגה'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-outline/30">
            <table className="w-full">
              <thead className="border-b border-outline/30 bg-surface-container-low">
                <tr>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">משתמש</th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">חודש</th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">סכום</th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">סטטוס</th>
                  <th className="px-6 py-4 text-start text-label-md font-medium text-on-surface-variant">תאריך תשלום</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline/20">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-surface-container/50">
                    <td className="px-6 py-4">
                      <p className="text-body-md font-medium">{payment.userName || '—'}</p>
                      {payment.userPhone && (
                        <p className="text-body-sm text-on-surface-variant" dir="ltr">{payment.userPhone}</p>
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
                      <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-label-sm font-medium ${getStatusColor(payment.status)}`}>
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
          <div className="flex items-center justify-between">
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
