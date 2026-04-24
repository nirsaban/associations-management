'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ChevronLeft, ChevronRight, Download, Package, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { exportOrdersToDocx } from '@/lib/export-orders-docx';

interface OrderFamily {
  familyId: string;
  familyName: string;
  contactName?: string;
  address?: string;
  items: unknown;
  status: string;
  notes?: string;
}

interface OrderGroup {
  groupId: string;
  groupName: string;
  families: OrderFamily[];
}

interface OrdersResponse {
  weekKey: string;
  groups: OrderGroup[];
}

function getCurrentWeekKey(): string {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000);
  const weekNum = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${now.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
}

function shiftWeek(weekKey: string, delta: number): string {
  const [yearStr, weekStr] = weekKey.split('-W');
  let year = parseInt(yearStr);
  let week = parseInt(weekStr) + delta;
  if (week < 1) { year--; week = 52; }
  if (week > 52) { year++; week = 1; }
  return `${year}-W${String(week).padStart(2, '0')}`;
}

function formatItems(items: unknown): string {
  if (!items) return '—';
  if (Array.isArray(items)) {
    return items
      .map((item: Record<string, unknown>) => {
        if (item.item) return `${item.item} (${item.quantity || ''} ${item.unit || ''})`.trim();
        return JSON.stringify(item);
      })
      .join(', ') || '—';
  }
  if (typeof items === 'object' && items !== null) {
    const obj = items as Record<string, unknown>;
    if (obj.text) return String(obj.text);
  }
  return String(items);
}

export default function AdminOrdersPage() {
  const { user } = useAuthStore();
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey());
  const [exporting, setExporting] = useState(false);

  const { data, isLoading, error } = useQuery<OrdersResponse>({
    queryKey: ['admin', 'orders', weekKey],
    queryFn: async () => {
      const response = await api.get<{ data: OrdersResponse }>('/admin/orders', { params: { weekKey } });
      return response.data.data;
    },
    enabled: !!user,
  });

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      const orgName = user?.name || 'עמותה';
      await exportOrdersToDocx(orgName, data.weekKey, data.groups);
    } finally {
      setExporting(false);
    }
  };

  if (user?.systemRole !== 'ADMIN') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container">
          <p>גישה מוגבלת</p>
        </div>
      </div>
    );
  }

  const totalFamilies = data?.groups.reduce((sum, g) => sum + g.families.length, 0) ?? 0;
  const completedOrders = data?.groups.reduce((sum, g) => sum + g.families.filter(f => f.status === 'COMPLETED').length, 0) ?? 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-headline-md font-headline">הזמנות שבועיות</h1>
          <p className="text-body-md text-on-surface-variant">צפייה בכל ההזמנות המשפחתיות לפי שבוע</p>
        </div>
        <button
          onClick={handleExport}
          disabled={!data || totalFamilies === 0 || exporting}
          className="btn-primary flex items-center gap-2 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
          {exporting ? 'מייצא...' : 'ייצוא ל-DOCX'}
        </button>
      </div>

      {/* Week Selector */}
      <div className="card-elevated">
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setWeekKey(shiftWeek(weekKey, 1))}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="text-center min-w-[120px]">
            <p className="text-title-lg font-medium">{weekKey}</p>
            {weekKey === getCurrentWeekKey() && (
              <p className="text-label-sm text-primary">השבוע הנוכחי</p>
            )}
          </div>
          <button
            onClick={() => setWeekKey(shiftWeek(weekKey, -1))}
            className="p-2 rounded-lg hover:bg-surface-container transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
        </div>

        {/* Summary */}
        {data && (
          <div className="flex justify-center gap-6 mt-4 text-body-sm text-on-surface-variant">
            <span>{data.groups.length} קבוצות</span>
            <span>{totalFamilies} משפחות</span>
            <span className="text-success">{completedOrders} הושלמו</span>
            <span className="text-warning">{totalFamilies - completedOrders} ממתינות</span>
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="animate-pulse space-y-4">
          {[1, 2].map(i => <div key={i} className="h-32 bg-surface-container rounded-lg" />)}
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הזמנות</span>
        </div>
      )}

      {data && data.groups.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-body-lg">אין הזמנות לשבוע זה</p>
        </div>
      )}

      {data?.groups.map((group) => (
        <div key={group.groupId} className="card-elevated">
          <h2 className="text-title-lg font-medium mb-4 flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            {group.groupName}
            <span className="text-body-sm text-on-surface-variant font-normal">({group.families.length} משפחות)</span>
          </h2>

          {group.families.length === 0 ? (
            <p className="text-body-sm text-on-surface-variant text-center py-4">אין הזמנות לקבוצה זו</p>
          ) : (
            <div className="space-y-3">
              {group.families.map((family) => (
                <div
                  key={family.familyId}
                  className="p-4 rounded-lg bg-surface-container-low border border-outline-variant"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm ${
                      family.status === 'COMPLETED'
                        ? 'bg-success-container text-on-success-container'
                        : 'bg-warning-container text-on-warning-container'
                    }`}>
                      {family.status === 'COMPLETED' ? (
                        <><CheckCircle2 className="h-3 w-3" /> הושלם</>
                      ) : (
                        <><Clock className="h-3 w-3" /> טיוטה</>
                      )}
                    </span>
                    <div className="text-right">
                      <p className="text-title-sm font-medium">{family.familyName}</p>
                      {family.address && (
                        <p className="text-body-sm text-on-surface-variant">{family.address}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-body-sm mt-2">
                    <span className="font-medium">פריטים: </span>
                    {formatItems(family.items)}
                  </div>
                  {family.notes && (
                    <p className="text-body-sm text-on-surface-variant mt-1 italic">
                      הערות: {family.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
