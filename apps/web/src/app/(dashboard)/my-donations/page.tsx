'use client';

import React, { useState } from 'react';
import { useAuthStore } from '@/store/auth.store';
import { CreditCard, AlertCircle, CheckCircle, Clock, X, Filter } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface PaymentRecord {
  id: string;
  amount: number;
  monthKey: string;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
  paidAt?: string;
  createdAt: string;
}

export default function MyDonationsPage() {
  const { user } = useAuthStore();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const { data: payments, isLoading, error } = useQuery({
    queryKey: ['my-payments', user?.id, selectedYear],
    queryFn: async () => {
      const response = await api.get<{ data: PaymentRecord[] }>(
        `/payments/me?year=${selectedYear}`
      );
      return response.data.data;
    },
    enabled: !!user,
  });

  // Generate year options (last 3 years)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'שולם';
      case 'pending':
        return 'ממתין';
      case 'overdue':
        return 'באיחור';
      case 'cancelled':
        return 'בוטל';
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-warning" />;
      case 'overdue':
        return <AlertCircle className="h-5 w-5 text-error" />;
      case 'cancelled':
        return <X className="h-5 w-5 text-on-surface-variant" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-success-container text-on-success-container';
      case 'pending':
        return 'bg-warning-container text-on-warning-container';
      case 'overdue':
        return 'bg-error-container text-on-error-container';
      case 'cancelled':
        return 'bg-surface-variant text-on-surface-variant';
      default:
        return 'bg-surface-container';
    }
  };

  const parseMonthKey = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    return new Date(parseInt(year), parseInt(month) - 1);
  };

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
          <span>שגיאה בטעינת היסטוריית תשלומים</span>
        </div>
      </div>
    );
  }

  const totalPaid = payments?.filter(p => p.status === 'paid').reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalPending = payments?.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0) || 0;

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-lg font-headline mb-2">התרומות שלי</h1>
          <p className="text-body-md text-on-surface-variant">
            היסטוריית תשלומים ותרומות
          </p>
        </div>

        {/* Year Filter */}
        <div className="flex items-center gap-3">
          <Filter className="h-5 w-5 text-on-surface-variant" />
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 rounded-lg bg-surface-container border-2 border-outline focus:border-primary focus:outline-none"
          >
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Paid */}
        <div className="card-elevated border-2 border-success">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">סה"כ שולם</p>
              <p className="text-headline-lg font-bold text-success">₪{totalPaid.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            תשלומים שאושרו בשנת {selectedYear}
          </p>
        </div>

        {/* Total Pending */}
        <div className="card-elevated border-2 border-warning">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-label-md text-on-surface-variant mb-1">ממתין לתשלום</p>
              <p className="text-headline-lg font-bold text-warning">₪{totalPending.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-full bg-warning/10">
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant">
            תשלומים שטרם אושרו
          </p>
        </div>
      </div>

      {/* Payments List */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <CreditCard className="h-6 w-6 text-primary" />
          רשימת תשלומים
        </h2>

        {!payments || payments.length === 0 ? (
          <div className="text-center py-12">
            <CreditCard className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-body-lg text-on-surface-variant">
              אין תשלומים להצגה עבור שנת {selectedYear}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="p-4 rounded-lg bg-surface-container hover:bg-surface-variant/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Status & Date */}
                  <div className="flex items-center gap-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <p className="text-body-md font-medium">
                        {format(parseMonthKey(payment.monthKey), 'MMMM yyyy', { locale: he })}
                      </p>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">
                        {payment.paidAt
                          ? `שולם ב-${format(new Date(payment.paidAt), 'd MMMM yyyy', { locale: he })}`
                          : `נוצר ב-${format(new Date(payment.createdAt), 'd MMMM yyyy', { locale: he })}`
                        }
                      </p>
                    </div>
                  </div>

                  {/* Right: Amount & Status */}
                  <div className="flex items-center gap-4">
                    <p className="text-headline-sm font-bold">₪{payment.amount.toLocaleString()}</p>
                    <span className={`px-3 py-1 rounded-full text-label-sm font-medium ${getStatusColor(payment.status)}`}>
                      {getStatusLabel(payment.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
