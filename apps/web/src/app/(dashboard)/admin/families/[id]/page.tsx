'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { ArrowRight, Phone, MapPin, Users, FileText, Package, CheckCircle2, Clock } from 'lucide-react';
import Link from 'next/link';

interface FamilyOrder {
  id: string;
  weekKey: string;
  shoppingListJson: unknown;
  status: string;
  notes: string | null;
  createdAt: string;
}

interface FamilyDetail {
  id: string;
  familyName: string;
  groupId?: string;
  groupName?: string;
  contactName?: string;
  contactPhone?: string;
  address?: string;
  notes?: string;
  orders?: FamilyOrder[];
  createdAt: string;
  updatedAt: string;
}

function formatItems(shoppingListJson: unknown): string {
  if (!shoppingListJson) return '—';
  if (Array.isArray(shoppingListJson)) {
    return shoppingListJson
      .map((item: Record<string, unknown>) => {
        if (item.item) return `${item.item} (${item.quantity || ''} ${item.unit || ''})`.trim();
        return JSON.stringify(item);
      })
      .join(', ') || '—';
  }
  if (typeof shoppingListJson === 'object' && shoppingListJson !== null) {
    const obj = shoppingListJson as Record<string, unknown>;
    if (obj.text) return String(obj.text);
  }
  return String(shoppingListJson);
}

export default function FamilyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const { data: family, isLoading, error } = useQuery<FamilyDetail>({
    queryKey: ['admin', 'family', id],
    queryFn: async () => {
      const response = await api.get<{ data: FamilyDetail }>(`/admin/families/${id}`);
      return response.data.data;
    },
    enabled: !!user && !!id,
  });

  if (user?.systemRole !== 'ADMIN') {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container">
          <p>גישה מוגבלת</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-surface-container rounded w-1/3" />
          <div className="h-32 bg-surface-container rounded" />
          <div className="h-64 bg-surface-container rounded" />
        </div>
      </div>
    );
  }

  if (error || !family) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container">
          <p>שגיאה בטעינת פרטי משפחה</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/families"
          className="p-2 rounded-lg hover:bg-surface-container transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-headline-md font-headline">{family.familyName}</h1>
          {family.groupName && (
            <p className="text-body-md text-on-surface-variant flex items-center gap-1">
              <Users className="h-4 w-4" />
              {family.groupName}
            </p>
          )}
        </div>
      </div>

      {/* Family Details Card */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-4">פרטי משפחה</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {family.contactName && (
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-on-surface-variant mt-0.5" />
              <div>
                <p className="text-label-sm text-on-surface-variant">איש קשר</p>
                <p className="text-body-md">{family.contactName}</p>
              </div>
            </div>
          )}
          {family.contactPhone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-on-surface-variant mt-0.5" />
              <div>
                <p className="text-label-sm text-on-surface-variant">טלפון</p>
                <p className="text-body-md" dir="ltr">{family.contactPhone}</p>
              </div>
            </div>
          )}
          {family.address && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <MapPin className="h-5 w-5 text-on-surface-variant mt-0.5" />
              <div>
                <p className="text-label-sm text-on-surface-variant">כתובת</p>
                <p className="text-body-md">{family.address}</p>
              </div>
            </div>
          )}
          {family.notes && (
            <div className="flex items-start gap-3 sm:col-span-2">
              <FileText className="h-5 w-5 text-on-surface-variant mt-0.5" />
              <div>
                <p className="text-label-sm text-on-surface-variant">הערות</p>
                <p className="text-body-md">{family.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order History */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-4 flex items-center gap-2">
          <Package className="h-5 w-5" />
          היסטוריית הזמנות
        </h2>

        {family.orders && family.orders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="pb-3 text-label-md text-on-surface-variant font-medium">שבוע</th>
                  <th className="pb-3 text-label-md text-on-surface-variant font-medium">פריטים</th>
                  <th className="pb-3 text-label-md text-on-surface-variant font-medium">סטטוס</th>
                  <th className="pb-3 text-label-md text-on-surface-variant font-medium">הערות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {family.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-surface-container-low">
                    <td className="py-3 text-body-sm font-medium whitespace-nowrap">{order.weekKey}</td>
                    <td className="py-3 text-body-sm max-w-xs truncate">{formatItems(order.shoppingListJson)}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm ${
                        order.status === 'COMPLETED'
                          ? 'bg-success-container text-on-success-container'
                          : 'bg-warning-container text-on-warning-container'
                      }`}>
                        {order.status === 'COMPLETED' ? (
                          <><CheckCircle2 className="h-3 w-3" /> הושלם</>
                        ) : (
                          <><Clock className="h-3 w-3" /> טיוטה</>
                        )}
                      </span>
                    </td>
                    <td className="py-3 text-body-sm text-on-surface-variant max-w-xs truncate">{order.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-body-sm text-on-surface-variant text-center py-8">אין הזמנות למשפחה זו</p>
        )}
      </div>
    </div>
  );
}
