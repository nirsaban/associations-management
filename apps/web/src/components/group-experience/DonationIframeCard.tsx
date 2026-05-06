'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Building2, CheckCircle, AlertCircle, Heart, Sparkles } from 'lucide-react';
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
    <div className="space-y-5">
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
        <div>
          <span className="text-title-md font-medium text-on-surface block">{organizationName}</span>
          {paymentDescription && (
            <p className="text-body-sm text-on-surface-variant">{paymentDescription}</p>
          )}
        </div>
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

      {/* Big animated donate CTA */}
      {paymentLink ? (
        <motion.a
          href={paymentLink}
          target="_blank"
          rel="noopener noreferrer"
          className="relative block w-full overflow-hidden rounded-3xl"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {/* Animated gradient background */}
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #C49A6C 0%, #D4AA7D 25%, #B8864F 50%, #C49A6C 75%, #D4AA7D 100%)',
              backgroundSize: '200% 200%',
              animation: 'shimmer 3s ease-in-out infinite',
            }}
          />

          {/* Subtle pulse ring */}
          <div className="absolute inset-0 rounded-3xl animate-[ping_2s_ease-in-out_infinite] border-2 border-white/20" />

          {/* Content */}
          <div className="relative flex flex-col items-center gap-3 py-8 px-6 text-white">
            {/* Sparkle icon */}
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            >
              <Heart className="h-10 w-10 fill-white/30 stroke-white" strokeWidth={1.5} />
            </motion.div>

            {/* Main CTA text */}
            <div className="text-center">
              <p className="text-display-sm font-headline font-bold tracking-tight">
                תרמו עכשיו
              </p>
              <p className="text-body-lg mt-1 opacity-90">
                כל שקל עושה שינוי
              </p>
            </div>

            {/* Action hint */}
            <div className="flex items-center gap-2 mt-1 px-5 py-2.5 rounded-full bg-white/20 backdrop-blur-sm">
              <Sparkles className="h-4 w-4" />
              <span className="text-label-lg font-medium">לחצו לתרומה מאובטחת</span>
            </div>
          </div>

          <style>{`
            @keyframes shimmer {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}</style>
        </motion.a>
      ) : (
        <div className="flex flex-col items-center justify-center gap-3 py-8 rounded-2xl bg-surface-container">
          <p className="text-body-md text-on-surface-variant">קישור לתשלום אינו זמין כרגע</p>
        </div>
      )}
    </div>
  );
}
