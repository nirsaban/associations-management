'use client';

import React from 'react';
import { Users, User, Phone, CheckCircle, Clock, AlertCircle, Info } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface GroupMember {
  id: string;
  fullName: string;
  phone: string;
  joinedAt: string;
  paymentStatus: 'paid' | 'unpaid'; // NEVER show amounts
}

export default function ManagerMembersPage() {
  const { user } = useAuthStore();

  const {
    data: members,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['manager-members', user?.id],
    queryFn: async () => {
      const response = await api.get<{ data: GroupMember[] }>('/manager/group/members');
      return response.data.data;
    },
    enabled: !!user,
  });

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
          <span>שגיאה בטעינת רשימת חברים</span>
        </div>
      </div>
    );
  }

  const paidCount = members?.filter((m) => m.paymentStatus === 'paid').length || 0;
  const unpaidCount = members?.filter((m) => m.paymentStatus === 'unpaid').length || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 sm:space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-headline-md sm:text-headline-lg font-headline mb-1 sm:mb-2">חברי הקבוצה</h1>
        <p className="text-body-md text-on-surface-variant">רשימת חברים וסטטוס תשלומים</p>
      </div>

      {/* Important Warning */}
      <div className="card bg-warning-container/30 border-2 border-warning/40">
        <div className="flex gap-3">
          <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-body-md font-medium text-warning mb-1">הצגת סטטוס בלבד</p>
            <p className="text-body-sm text-on-surface-variant">
              כמנהל קבוצה, תוכל לראות רק את הסטטוס (שולם/לא שולם) ולא את סכומי התשלומים. לפרטים
              מלאים ומספריים יש לפנות למנהל המערכת.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Members */}
        <div className="card-elevated">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10">
              <Users className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">סה"כ חברים</p>
              <p className="text-headline-lg font-bold text-primary">{members?.length || 0}</p>
            </div>
          </div>
        </div>

        {/* Paid */}
        <div className="card-elevated border-2 border-success">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-success/10">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">שילמו החודש</p>
              <p className="text-headline-lg font-bold text-success">{paidCount}</p>
            </div>
          </div>
        </div>

        {/* Unpaid */}
        <div className="card-elevated border-2 border-warning">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-warning/10">
              <Clock className="h-8 w-8 text-warning" />
            </div>
            <div>
              <p className="text-label-sm text-on-surface-variant">טרם שילמו</p>
              <p className="text-headline-lg font-bold text-warning">{unpaidCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Members List */}
      <div className="card-elevated">
        <h2 className="text-title-lg font-medium mb-6 flex items-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          רשימת חברים
        </h2>

        {!members || members.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
            <p className="text-body-lg text-on-surface-variant">אין חברים בקבוצה</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-lg bg-surface-container hover:bg-surface-variant/50 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: Member Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-body-lg font-medium">{member.fullName}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <p
                          className="text-body-sm text-on-surface-variant flex items-center gap-1"
                          dir="ltr"
                        >
                          <Phone className="h-3 w-3" />
                          {member.phone}
                        </p>
                        <p className="text-body-sm text-on-surface-variant">
                          הצטרף {format(new Date(member.joinedAt), 'd MMMM yyyy', { locale: he })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment Status Badge */}
                  <div>
                    {member.paymentStatus === 'paid' ? (
                      <span className="px-4 py-2 rounded-full bg-success-container text-on-success-container flex items-center gap-2 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        שולם
                      </span>
                    ) : (
                      <span className="px-4 py-2 rounded-full bg-warning-container text-on-warning-container flex items-center gap-2 font-medium">
                        <Clock className="h-4 w-4" />
                        טרם שולם
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Note */}
      <div className="card bg-surface-container">
        <p className="text-body-sm text-on-surface-variant">
          <strong>לתשומת לבך:</strong> המידע המוצג כאן מוגבל לסטטוס תשלום בלבד. אין אפשרות לצפות
          בסכומי תשלומים או בפרטים פיננסיים מלאים. למידע נוסף או לדיווחים פיננסיים יש לפנות למנהל
          הארגון.
        </p>
      </div>
    </div>
  );
}
