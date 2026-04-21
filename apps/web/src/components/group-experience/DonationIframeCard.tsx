'use client';

import React from 'react';
import { Building2, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

interface DonationIframeCardProps {
  paymentLink: string | null;
  paymentDescription?: string | null;
  organizationName: string;
  organizationLogoUrl?: string | null;
  isPaid: boolean;
  paidAt?: string | null;
}

export function DonationIframeCard({
  paymentLink,
  paymentDescription,
  organizationName,
  organizationLogoUrl,
  isPaid,
  paidAt,
}: DonationIframeCardProps) {
  return (
    <div className="card-elevated space-y-4">
      {/* Org header */}
      <div className="flex items-center gap-3">
        {organizationLogoUrl ? (
          <img
            src={organizationLogoUrl}
            alt={organizationName}
            className="h-10 w-10 rounded-full object-cover border border-outline/20 shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
        )}
        <span className="text-title-md font-medium text-on-surface">{organizationName}</span>
      </div>

      {/* Heading */}
      <div>
        <h2 className="text-headline-md font-headline text-on-surface mb-1">תרומות לעמותה</h2>
        {paymentDescription && (
          <p className="text-body-md text-on-surface-variant">{paymentDescription}</p>
        )}
      </div>

      {/* Payment status pill */}
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-body-sm font-medium ${
          isPaid
            ? 'bg-success-container text-on-success-container'
            : 'bg-warning-container text-on-warning-container'
        }`}
      >
        {isPaid ? (
          <>
            <CheckCircle className="h-4 w-4 shrink-0" />
            שילמת החודש
            {paidAt && (
              <span className="font-normal opacity-80">
                ({format(new Date(paidAt), 'd בMMM', { locale: he })})
              </span>
            )}
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 shrink-0" />
            טרם שולם לחודש זה
          </>
        )}
      </div>

      {/* Iframe or placeholder */}
      {paymentLink ? (
        <iframe
          src={paymentLink}
          title="טופס תרומה"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          className="w-full rounded-lg border border-outline/30 h-[500px] sm:h-[600px]"
          loading="lazy"
        />
      ) : (
        <div className="flex items-center justify-center h-32 rounded-lg bg-surface-container text-body-md text-on-surface-variant">
          קישור לתשלום אינו זמין כרגע
        </div>
      )}
    </div>
  );
}
