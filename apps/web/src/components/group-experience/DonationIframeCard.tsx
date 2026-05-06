'use client';

import React, { useState, useEffect } from 'react';
import { Building2, CheckCircle, AlertCircle, CreditCard, ArrowRight, X } from 'lucide-react';
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

function PaymentFullscreen({
  paymentLink,
  organizationName,
  onClose,
}: {
  paymentLink: string;
  organizationName: string;
  onClose: () => void;
}) {
  // Lock body scroll when fullscreen is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface-container border-b border-outline-variant shrink-0">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-label-lg font-medium text-on-surface hover:bg-surface-variant transition-colors"
        >
          <ArrowRight className="h-5 w-5" />
          חזרה
        </button>
        <span className="text-title-sm font-medium text-on-surface truncate mx-4">
          {organizationName} — תשלום
        </span>
        <button
          onClick={onClose}
          className="p-2 rounded-full text-on-surface-variant hover:bg-surface-variant transition-colors"
          aria-label="סגירה"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Iframe fills remaining space */}
      <iframe
        src={paymentLink}
        title="טופס תרומה"
        className="flex-1 w-full border-0"
        allow="payment"
      />
    </div>
  );
}

export function DonationIframeCard({
  paymentLink,
  paymentDescription,
  organizationName,
  organizationLogoUrl,
  isPaid,
  paidAt,
}: DonationIframeCardProps) {
  const [showFullscreen, setShowFullscreen] = useState(false);

  return (
    <>
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

        {/* Payment button — opens fullscreen iframe */}
        {paymentLink ? (
          <button
            onClick={() => setShowFullscreen(true)}
            className="flex items-center justify-center gap-3 w-full py-4 px-6 rounded-2xl bg-primary text-on-primary text-title-md font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-md"
          >
            <CreditCard className="h-5 w-5" />
            מעבר לתשלום
          </button>
        ) : (
          <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-lg bg-surface-container">
            <p className="text-body-md text-on-surface-variant">קישור לתשלום אינו זמין כרגע</p>
          </div>
        )}
      </div>

      {/* Fullscreen payment overlay */}
      {showFullscreen && paymentLink && (
        <PaymentFullscreen
          paymentLink={paymentLink}
          organizationName={organizationName}
          onClose={() => setShowFullscreen(false)}
        />
      )}
    </>
  );
}
