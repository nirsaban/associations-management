'use client';

import React, { useState } from 'react';
import { Building2, CheckCircle, AlertCircle, ExternalLink, CreditCard } from 'lucide-react';
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
  const [iframeError, setIframeError] = useState(false);

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

      {/* Payment iframe with fallback button */}
      {paymentLink && !iframeError ? (
        <>
          <iframe
            src={paymentLink}
            title="טופס תרומה"
            className="w-full rounded-lg border border-outline/30 h-[500px] sm:h-[600px]"
            loading="lazy"
            allow="payment"
            onError={() => setIframeError(true)}
          />
          <a
            href={paymentLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-primary text-body-sm hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            פתיחה בחלון חדש
          </a>
        </>
      ) : paymentLink ? (
        <a
          href={paymentLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-primary text-on-primary text-title-md font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
        >
          <CreditCard className="h-5 w-5" />
          מעבר לתשלום
          <ExternalLink className="h-4 w-4 opacity-70" />
        </a>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-lg bg-surface-container">
          <p className="text-body-md text-on-surface-variant">קישור לתשלום אינו זמין כרגע</p>
        </div>
      )}
    </div>
  );
}
