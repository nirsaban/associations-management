'use client';

import React from 'react';
import { Truck, Phone, AlertCircle } from 'lucide-react';

interface CurrentWeekDistributorCardProps {
  assigned: boolean;
  fullName?: string;
  phone?: string;
}

export function CurrentWeekDistributorCard({
  assigned,
  fullName,
  phone,
}: CurrentWeekDistributorCardProps) {
  if (!assigned) {
    return (
      <div className="flex items-center gap-3 px-5 py-4 rounded-xl bg-warning-container text-on-warning-container">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span className="text-body-md font-medium">טרם מונה מחלק לשבוע זה</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-xl bg-secondary/10 border border-secondary/30">
      <div className="p-2 rounded-full bg-secondary/20 shrink-0">
        <Truck className="h-5 w-5 text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-sm text-on-surface-variant">המחלק השבועי</p>
        <p className="text-body-lg font-medium text-on-surface">{fullName}</p>
        {phone && (
          <p
            className="text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5"
            dir="ltr"
          >
            <Phone className="h-3 w-3 shrink-0" />
            {phone}
          </p>
        )}
      </div>
    </div>
  );
}
