'use client';

import React, { useState } from 'react';
import {
  ShoppingCart,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Clock,
  Edit,
  Plus,
  ChevronRight,
  X,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getCurrentWeekKey } from '@/lib/utils';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyOrderStatus {
  familyId: string;
  familyName: string;
  contactPhone?: string;
  hasOrder: boolean;
  orderId?: string;
  orderStatus?: string;
}

interface OrderModalState {
  isOpen: boolean;
  familyId: string;
  familyName: string;
  orderId?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function extractTextContent(shoppingListJson: unknown): string {
  if (!shoppingListJson) return '';
  if (typeof shoppingListJson === 'string') return shoppingListJson;
  if (typeof shoppingListJson === 'object' && shoppingListJson !== null) {
    const obj = shoppingListJson as Record<string, unknown>;
    if (typeof obj.text === 'string') return obj.text;
    if (Array.isArray(shoppingListJson)) {
      return JSON.stringify(shoppingListJson);
    }
  }
  return '';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'הושלם';
    case 'draft':
      return 'טיוטה';
    case 'missing':
      return 'חסר';
    default:
      return status;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'completed':
      return 'bg-success-container text-on-success-container';
    case 'draft':
      return 'bg-warning-container text-on-warning-container';
    case 'missing':
      return 'bg-error-container text-on-error-container';
    default:
      return 'bg-surface-container';
  }
}

function getStatusIcon(status: string): React.ReactNode {
  switch (status) {
    case 'completed':
      return <CheckCircle className="h-5 w-5 text-success" />;
    case 'draft':
      return <Clock className="h-5 w-5 text-warning" />;
    case 'missing':
      return <AlertCircle className="h-5 w-5 text-error" />;
    default:
      return null;
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WeeklyOrdersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const weekKey = getCurrentWeekKey();
  const { showToast } = useToast();

  const [modalState, setModalState] = useState<OrderModalState>({
    isOpen: false,
    familyId: '',
    familyName: '',
  });
  const [orderContent, setOrderContent] = useState('');

  // ── Query ──────────────────────────────────────────────────────────────────

  const { data: families, isLoading, error } = useQuery({
    queryKey: ['manager-weekly-tasks', user?.id, weekKey],
    queryFn: async () => {
      const response = await api.get<{ data: FamilyOrderStatus[] }>(
        `/manager/group/weekly-tasks?weekKey=${weekKey}`,
      );
      return response.data.data;
    },
    enabled: !!user,
  });

  // ── Mutation ───────────────────────────────────────────────────────────────

  const saveOrderMutation = useMutation({
    mutationFn: async ({ familyId, content }: { familyId: string; content: string }) => {
      const res = await api.put(
        `/manager/group/families/${familyId}/weekly-order`,
        { content, weekKey },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-weekly-tasks'] });
      showToast('ההזמנה נשמרה בהצלחה', 'success');
      closeModal();
    },
    onError: () => {
      showToast('שגיאה בשמירת ההזמנה', 'error');
    },
  });

  // ── Modal helpers ──────────────────────────────────────────────────────────

  const openModal = async (family: FamilyOrderStatus) => {
    setModalState({
      isOpen: true,
      familyId: family.familyId,
      familyName: family.familyName,
      orderId: family.orderId,
    });
    // Fetch existing order content if it exists
    if (family.hasOrder) {
      try {
        const res = await api.get(`/manager/group/families/${family.familyId}/weekly-order?weekKey=${weekKey}`);
        const orderData = res.data.data;
        if (orderData.exists && orderData.order) {
          setOrderContent(extractTextContent(orderData.order.shoppingListJson));
        } else {
          setOrderContent('');
        }
      } catch {
        setOrderContent('');
      }
    } else {
      setOrderContent('');
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, familyId: '', familyName: '' });
    setOrderContent('');
  };

  const handleSave = () => {
    saveOrderMutation.mutate({
      familyId: modalState.familyId,
      content: orderContent,
    });
  };

  // ── Computed ───────────────────────────────────────────────────────────────

  const completedCount = families?.filter((f) => f.hasOrder).length ?? 0;
  const totalCount = families?.length ?? 0;
  const allFilled = totalCount > 0 && completedCount === totalCount;

  // ── Loading / Error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="h-64 animate-pulse rounded-lg bg-surface-container" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="rounded-lg bg-error-container px-6 py-4 text-on-error-container flex gap-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span>שגיאה בטעינת הזמנות שבועיות</span>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/manager/dashboard"
            className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
            aria-label="חזור ללוח הבקרה"
          >
            <ChevronRight className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-headline-md sm:text-headline-lg font-headline mb-1 sm:mb-2">
              הזמנות שבועיות
            </h1>
            <p className="text-body-md text-on-surface-variant">
              ניהול הזמנות עבור שבוע {weekKey}
            </p>
          </div>
        </div>

        {/* Progress Badge */}
        <div className="card-elevated px-6 py-3 text-center shrink-0">
          <p className="text-label-sm text-on-surface-variant mb-1">התקדמות</p>
          <p className="text-headline-md font-bold text-primary">
            {completedCount} / {totalCount}
          </p>
        </div>
      </div>

      {/* All-filled celebratory banner */}
      {allFilled && (
        <div className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-success-container text-on-success-container text-body-md font-medium">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <span>כל ההזמנות מולאו לשבוע זה</span>
        </div>
      )}

      {/* Orders List */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          רשימת משפחות והזמנות
        </h2>

        {!families || families.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-body-lg text-on-surface-variant">אין משפחות להצגה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {families.map((family) => {
              const status = family.hasOrder
                ? (family.orderStatus === 'COMPLETED' ? 'completed' : 'draft')
                : 'missing';
              return (
                <div
                  key={family.familyId}
                  className="p-4 rounded-lg bg-surface-container hover:bg-surface-variant/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Family Name & Status */}
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {getStatusIcon(status)}
                      <div className="flex-1 min-w-0">
                        <p className="text-body-lg font-medium truncate">{family.familyName}</p>
                        {family.contactPhone && (
                          <p className="text-body-sm text-on-surface-variant mt-0.5" dir="ltr">
                            {family.contactPhone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge & Action */}
                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`px-3 py-1 rounded-full text-label-sm font-medium ${getStatusColor(status)}`}
                      >
                        {getStatusLabel(status)}
                      </span>
                      {!family.hasOrder ? (
                        <button
                          onClick={() => openModal(family)}
                          className="btn-primary flex items-center gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          מלא הזמנה
                        </button>
                      ) : (
                        <button
                          onClick={() => openModal(family)}
                          className="btn-outline flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" />
                          ערוך
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Modal — bottom sheet on mobile, centered on desktop */}
      {modalState.isOpen && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="bg-surface w-full sm:max-w-2xl sm:rounded-lg rounded-t-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto shadow-xl sm:mx-4 fixed bottom-0 sm:static">
            {/* Modal Header */}
            <div className="p-6 border-b border-outline/20 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-headline-md font-headline mb-1">
                  {modalState.orderId ? 'עריכת הזמנה' : 'יצירת הזמנה חדשה'}
                </h3>
                <p className="text-body-md text-on-surface-variant">
                  משפחת {modalState.familyName}
                </p>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
                aria-label="סגור"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <label className="text-title-sm font-medium mb-3 block">רשימת קניות</label>
              <textarea
                value={orderContent}
                onChange={(e) => setOrderContent(e.target.value)}
                placeholder="רשימת הקניות עבור השבוע הזה..."
                rows={10}
                className="w-full px-4 py-3 rounded-lg bg-surface-container border border-outline focus:border-primary focus:outline-none resize-none text-body-md"
                dir="rtl"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 p-6 border-t border-outline/20">
              <button onClick={closeModal} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={handleSave}
                disabled={saveOrderMutation.isPending || !orderContent.trim()}
                className="btn-primary flex-1"
              >
                {saveOrderMutation.isPending ? 'שומר...' : 'שמור הזמנה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
