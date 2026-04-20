'use client';

import React, { useState } from 'react';
import { ShoppingCart, AlertCircle, CheckCircle, Clock, Edit, Plus } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { getCurrentWeekKey } from '@/lib/utils';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface FamilyOrderStatus {
  familyId: string;
  familyName: string;
  orderId?: string;
  status: 'draft' | 'completed' | 'missing';
  shoppingList: Array<{
    item: string;
    quantity: number;
    notes?: string;
  }>;
  notes?: string;
  updatedAt?: string;
}

interface WeeklyTasksData {
  weekKey: string;
  families: FamilyOrderStatus[];
}

interface OrderModalState {
  isOpen: boolean;
  familyId: string;
  familyName: string;
  orderId?: string;
}

export default function WeeklyOrdersPage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const weekKey = getCurrentWeekKey();
  const [modalState, setModalState] = useState<OrderModalState>({
    isOpen: false,
    familyId: '',
    familyName: '',
  });
  const [shoppingItems, setShoppingItems] = useState<
    Array<{ item: string; quantity: number; notes?: string }>
  >([]);
  const [orderNotes, setOrderNotes] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['manager-weekly-tasks', user?.id, weekKey],
    queryFn: async () => {
      const response = await api.get<{ data: WeeklyTasksData }>(
        `/manager/group/weekly-tasks?weekKey=${weekKey}`,
      );
      return response.data.data;
    },
    enabled: !!user,
  });

  const createOrderMutation = useMutation({
    mutationFn: async (orderData: {
      familyId: string;
      weekKey: string;
      shoppingList: Array<{ item: string; quantity: number; notes?: string }>;
      notes?: string;
      status: 'draft' | 'completed';
    }) => {
      const response = await api.post(
        `/manager/group/families/${orderData.familyId}/weekly-order`,
        {
          weekKey: orderData.weekKey,
          shoppingListJson: orderData.shoppingList,
          notes: orderData.notes,
          status: orderData.status,
        },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-weekly-tasks'] });
      closeModal();
    },
  });

  const updateOrderMutation = useMutation({
    mutationFn: async (orderData: {
      orderId: string;
      shoppingList: Array<{ item: string; quantity: number; notes?: string }>;
      notes?: string;
      status: 'draft' | 'completed';
    }) => {
      const response = await api.patch(`/manager/group/weekly-orders/${orderData.orderId}`, {
        shoppingListJson: orderData.shoppingList,
        notes: orderData.notes,
        status: orderData.status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manager-weekly-tasks'] });
      closeModal();
    },
  });

  const openModal = (family: FamilyOrderStatus) => {
    setModalState({
      isOpen: true,
      familyId: family.familyId,
      familyName: family.familyName,
      orderId: family.orderId,
    });
    if (family.status !== 'missing' && family.shoppingList?.length > 0) {
      setShoppingItems(family.shoppingList);
      setOrderNotes(family.notes || '');
    } else {
      setShoppingItems([{ item: '', quantity: 1 }]);
      setOrderNotes('');
    }
  };

  const closeModal = () => {
    setModalState({ isOpen: false, familyId: '', familyName: '' });
    setShoppingItems([]);
    setOrderNotes('');
  };

  const addShoppingItem = () => {
    setShoppingItems([...shoppingItems, { item: '', quantity: 1 }]);
  };

  const updateShoppingItem = (
    index: number,
    field: 'item' | 'quantity' | 'notes',
    value: string | number,
  ) => {
    const updated = [...shoppingItems];
    updated[index] = { ...updated[index], [field]: value };
    setShoppingItems(updated);
  };

  const removeShoppingItem = (index: number) => {
    setShoppingItems(shoppingItems.filter((_, i) => i !== index));
  };

  const handleSubmit = (status: 'draft' | 'completed') => {
    const validItems = shoppingItems.filter((item) => item.item.trim() !== '');
    if (validItems.length === 0) {
      return;
    }

    if (modalState.orderId) {
      updateOrderMutation.mutate({
        orderId: modalState.orderId,
        shoppingList: validItems,
        notes: orderNotes || undefined,
        status,
      });
    } else {
      createOrderMutation.mutate({
        familyId: modalState.familyId,
        weekKey: data?.weekKey || weekKey,
        shoppingList: validItems,
        notes: orderNotes || undefined,
        status,
      });
    }
  };

  const getStatusLabel = (status: string) => {
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
  };

  const getStatusColor = (status: string) => {
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
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5" />;
      case 'draft':
        return <Clock className="h-5 w-5" />;
      case 'missing':
        return <AlertCircle className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const isPending = createOrderMutation.isPending || updateOrderMutation.isPending;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="card h-64 animate-pulse bg-surface-container" />
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

  const completedCount = data?.families.filter((f) => f.status === 'completed').length || 0;
  const totalCount = data?.families.length || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-headline-md sm:text-headline-lg font-headline mb-1 sm:mb-2">הזמנות שבועיות</h1>
          <p className="text-body-md text-on-surface-variant">
            ניהול הזמנות עבור שבוע {data?.weekKey}
          </p>
        </div>

        {/* Progress Badge */}
        <div className="card-elevated px-6 py-3 text-center">
          <p className="text-label-sm text-on-surface-variant mb-1">התקדמות</p>
          <p className="text-headline-md font-bold text-primary">
            {completedCount} / {totalCount}
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <ShoppingCart className="h-6 w-6 text-primary" />
          רשימת משפחות והזמנות
        </h2>

        {!data?.families || data.families.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-body-lg text-on-surface-variant">אין משפחות להצגה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.families.map((family) => (
              <div
                key={family.familyId}
                className="p-4 rounded-lg bg-surface-container hover:bg-surface-variant/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Family Name & Status */}
                  <div className="flex items-center gap-4 flex-1">
                    {getStatusIcon(family.status)}
                    <div className="flex-1">
                      <p className="text-body-lg font-medium">{family.familyName}</p>
                      {family.status !== 'missing' && (
                        <p className="text-body-sm text-on-surface-variant mt-1">
                          {family.shoppingList?.length || 0} פריטים
                          {family.updatedAt && (
                            <>
                              {' '}
                              • עודכן{' '}
                              {format(new Date(family.updatedAt), 'd/M HH:mm', { locale: he })}
                            </>
                          )}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Status Badge & Actions */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-label-sm font-medium ${getStatusColor(family.status)}`}
                    >
                      {getStatusLabel(family.status)}
                    </span>
                    {family.status === 'missing' ? (
                      <button
                        onClick={() => openModal(family)}
                        className="btn-primary flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        צור הזמנה
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

                {/* Shopping List Preview */}
                {family.status !== 'missing' &&
                  family.shoppingList &&
                  family.shoppingList.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-outline/20">
                      <p className="text-label-sm text-on-surface-variant mb-2">פריטים:</p>
                      <div className="flex flex-wrap gap-2">
                        {family.shoppingList.slice(0, 5).map((item, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-1 rounded bg-primary-container/30 text-body-sm"
                          >
                            {item.quantity}× {item.item}
                          </span>
                        ))}
                        {family.shoppingList.length > 5 && (
                          <span className="px-2 py-1 text-body-sm text-on-surface-variant">
                            +{family.shoppingList.length - 5} נוספים
                          </span>
                        )}
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Order Modal */}
      {modalState.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-outline/20">
              <h3 className="text-headline-md font-headline mb-1">
                {modalState.orderId ? 'עריכת הזמנה' : 'יצירת הזמנה חדשה'}
              </h3>
              <p className="text-body-md text-on-surface-variant">משפחת {modalState.familyName}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Shopping List */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="text-title-sm font-medium">רשימת קניות</label>
                  <button
                    onClick={addShoppingItem}
                    className="btn-outline btn-sm flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    הוסף פריט
                  </button>
                </div>

                {shoppingItems.length === 0 && (
                  <p className="text-body-sm text-on-surface-variant text-center py-4">
                    לחץ "הוסף פריט" להוספת פריט לרשימה
                  </p>
                )}

                <div className="space-y-3">
                  {shoppingItems.map((item, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="שם הפריט"
                        value={item.item}
                        onChange={(e) => updateShoppingItem(index, 'item', e.target.value)}
                        className="flex-1 px-4 py-2 rounded-lg bg-surface-container border border-outline focus:border-primary focus:outline-none"
                      />
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) =>
                          updateShoppingItem(index, 'quantity', parseInt(e.target.value) || 1)
                        }
                        className="w-20 px-3 py-2 rounded-lg bg-surface-container border border-outline focus:border-primary focus:outline-none"
                      />
                      <button
                        onClick={() => removeShoppingItem(index)}
                        className="px-3 py-2 rounded-lg border border-error text-error hover:bg-error-container transition-colors text-body-sm"
                      >
                        הסר
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-title-sm font-medium mb-2 block">הערות</label>
                <textarea
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  placeholder="הערות נוספות להזמנה"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-surface-container border border-outline focus:border-primary focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-6 border-t border-outline/20">
              <button onClick={closeModal} className="btn-outline flex-1">
                ביטול
              </button>
              <button
                onClick={() => handleSubmit('draft')}
                className="btn-outline flex-1"
                disabled={isPending}
              >
                שמור כטיוטה
              </button>
              <button
                onClick={() => handleSubmit('completed')}
                className="btn-primary flex-1"
                disabled={isPending || shoppingItems.filter((i) => i.item.trim()).length === 0}
              >
                {isPending ? 'שומר...' : 'סמן כהושלם'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
