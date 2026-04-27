'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link2, Eye, CreditCard, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

interface ReferralStat {
  userId: string;
  fullName: string;
  phone: string;
  code: string;
  isActive: boolean;
  clickCount: number;
  paymentCount: number;
  totalAmount: number;
}

export default function AdminReferralsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-referral-stats'],
    queryFn: async () => {
      const res = await api.get<{ data: ReferralStat[] }>('/referrals/admin/stats');
      return res.data.data;
    },
  });

  const totalClicks = stats?.reduce((s, r) => s + r.clickCount, 0) ?? 0;
  const totalPayments = stats?.reduce((s, r) => s + r.paymentCount, 0) ?? 0;
  const totalAmount = stats?.reduce((s, r) => s + r.totalAmount, 0) ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-headline-lg font-headline text-on-surface flex items-center gap-3">
          <Link2 className="h-7 w-7 text-primary" />
          הפניות
        </h1>
        <p className="text-body-md text-on-surface-variant mt-1">
          מעקב אחר קישורי הפניה אישיים של חברי העמותה
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl bg-surface-container border border-outline/10 p-5 text-center">
          <Eye className="h-5 w-5 mx-auto text-on-surface-variant mb-2" />
          <p className="text-headline-md font-semibold text-on-surface">{totalClicks.toLocaleString()}</p>
          <p className="text-label-md text-on-surface-variant">סה״כ צפיות</p>
        </div>
        <div className="rounded-xl bg-surface-container border border-outline/10 p-5 text-center">
          <CreditCard className="h-5 w-5 mx-auto text-on-surface-variant mb-2" />
          <p className="text-headline-md font-semibold text-on-surface">{totalPayments.toLocaleString()}</p>
          <p className="text-label-md text-on-surface-variant">סה״כ תשלומים</p>
        </div>
        <div className="rounded-xl bg-surface-container border border-outline/10 p-5 text-center">
          <TrendingUp className="h-5 w-5 mx-auto text-on-surface-variant mb-2" />
          <p className="text-headline-md font-semibold text-on-surface">₪{totalAmount.toLocaleString()}</p>
          <p className="text-label-md text-on-surface-variant">סה״כ גיוס</p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-outline/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-body-md">
            <thead>
              <tr className="bg-surface-container text-on-surface-variant text-label-md">
                <th className="text-right px-4 py-3 font-medium">שם</th>
                <th className="text-right px-4 py-3 font-medium">טלפון</th>
                <th className="text-right px-4 py-3 font-medium">קוד</th>
                <th className="text-center px-4 py-3 font-medium">צפיות</th>
                <th className="text-center px-4 py-3 font-medium">תשלומים</th>
                <th className="text-center px-4 py-3 font-medium">סה״כ גיוס</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-5 rounded bg-surface-container animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : stats && stats.length > 0 ? (
                stats
                  .sort((a, b) => b.totalAmount - a.totalAmount)
                  .map((r) => (
                    <tr key={r.userId} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-4 py-3 text-on-surface font-medium">{r.fullName}</td>
                      <td className="px-4 py-3 text-on-surface-variant" dir="ltr">{r.phone}</td>
                      <td className="px-4 py-3 font-mono text-body-sm text-on-surface-variant" dir="ltr">{r.code}</td>
                      <td className="px-4 py-3 text-center text-on-surface">{r.clickCount}</td>
                      <td className="px-4 py-3 text-center text-on-surface">{r.paymentCount}</td>
                      <td className="px-4 py-3 text-center text-on-surface font-medium">
                        {r.totalAmount > 0 ? `₪${r.totalAmount.toLocaleString()}` : '—'}
                      </td>
                    </tr>
                  ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-on-surface-variant">
                    אין נתוני הפניות עדיין. המשתמשים יקבלו קישור אישי כשיכנסו לדשבורד.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
