'use client';

import React from 'react';
import { Users, Phone, CheckCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface Member {
  userId: string;
  fullName: string;
  phone: string;
  paidThisMonth: boolean;
  currentMonthPaymentDate?: string | null;
}

interface MembersListProps {
  members: Member[];
  showPaidStatus?: boolean;
  showRole?: boolean;
  currentUserId?: string;
}

export function MembersList({
  members,
  showPaidStatus = true,
  showRole = false,
  currentUserId,
}: MembersListProps) {
  return (
    <div className="card-elevated">
      <h2 className="text-title-lg font-medium mb-5 flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        חברי הקבוצה
      </h2>

      {members.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-on-surface-variant/30 mx-auto mb-4" />
          <p className="text-body-lg text-on-surface-variant">אין חברים בקבוצה</p>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((member) => (
            <div
              key={member.userId}
              className="p-4 rounded-lg bg-surface-container hover:bg-surface-variant/50 transition-colors"
            >
              <div className="flex items-center justify-between gap-4">
                {/* Member info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-body-lg font-medium">{member.fullName}</p>
                    {showRole && currentUserId && member.userId === currentUserId && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                        מנהל הקבוצה
                      </span>
                    )}
                  </div>

                  <p
                    className="text-body-sm text-on-surface-variant mt-0.5 flex items-center gap-1"
                    dir="ltr"
                  >
                    <Phone className="h-3 w-3 shrink-0" />
                    {member.phone}
                  </p>

                  {showPaidStatus && member.paidThisMonth && member.currentMonthPaymentDate && (
                    <p className="text-label-sm text-on-surface-variant mt-0.5">
                      שולם ב-
                      {format(new Date(member.currentMonthPaymentDate), 'd בMMM yyyy', { locale: he })}
                    </p>
                  )}
                </div>

                {/* Payment status badge */}
                {showPaidStatus && (
                  <div className="shrink-0">
                    {member.paidThisMonth ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success-container text-on-success-container text-label-sm font-medium">
                        <CheckCircle className="h-3.5 w-3.5" />
                        שילם
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning-container text-on-warning-container text-label-sm font-medium">
                        <Clock className="h-3.5 w-3.5" />
                        לא שילם
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
