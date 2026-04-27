'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link2, Copy, Check, Share2, Eye, CreditCard, TrendingUp } from 'lucide-react';
import api from '@/lib/api';

interface ReferralStats {
  code: string;
  isActive: boolean;
  clickCount: number;
  paymentCount: number;
  totalAmount: number;
  landingSlug: string | null;
}

export default function ReferralCard() {
  const [copied, setCopied] = useState(false);

  const { data: stats, isLoading, isError } = useQuery({
    queryKey: ['my-referral'],
    queryFn: async () => {
      const res = await api.get<{ data: ReferralStats }>('/referrals/me');
      return res.data.data;
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl bg-surface-container h-48" />
    );
  }

  if (isError || !stats || !stats.landingSlug) return null;

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const referralLink = `${baseUrl}/l/${stats.landingSlug}?ref=${stats.code}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = referralLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function shareWhatsApp() {
    const text = `בואו לתרום דרך הקישור שלי! ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  }

  function shareNative() {
    if (navigator.share) {
      navigator.share({
        title: 'הקישור שלי לתרומה',
        text: 'בואו לתרום דרך הקישור שלי!',
        url: referralLink,
      }).catch(() => {});
    }
  }

  return (
    <section aria-labelledby="referral-heading">
      <h2 id="referral-heading" className="text-title-lg font-medium mb-4 text-on-surface">
        הקישור שלי
      </h2>

      <div className="rounded-xl border border-outline/20 bg-surface-container overflow-hidden">
        {/* Encouragement banner */}
        <div className="bg-primary/10 px-5 py-3">
          <p className="text-body-md text-on-surface font-medium flex items-center gap-2">
            <Link2 className="h-4 w-4 text-primary shrink-0" />
            שתפו את הקישור שלכם וגרמו לעוד אנשים לתרום
          </p>
        </div>

        {/* Link display */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              dir="ltr"
              className="flex-1 rounded-lg border border-outline/30 bg-surface px-3 py-2.5 text-body-sm text-on-surface font-mono truncate"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              type="button"
              onClick={copyLink}
              className={`shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-body-sm font-medium transition-all ${
                copied
                  ? 'bg-success text-on-success'
                  : 'bg-primary text-on-primary hover:bg-primary/90'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  הועתק
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  העתק
                </>
              )}
            </button>
          </div>

          {/* Share buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={shareWhatsApp}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#25D366] text-white text-body-sm font-medium hover:bg-[#20bd5a] transition-colors"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              שתף בוואטסאפ
            </button>

            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <button
                type="button"
                onClick={shareNative}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline/30 text-on-surface text-body-sm font-medium hover:bg-surface-container transition-colors"
              >
                <Share2 className="h-4 w-4" />
                שתף
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="text-center rounded-lg bg-surface px-3 py-3 border border-outline/10">
              <Eye className="h-4 w-4 mx-auto text-on-surface-variant mb-1" />
              <p className="text-headline-sm font-semibold text-on-surface">{stats.clickCount}</p>
              <p className="text-label-sm text-on-surface-variant">צפיות</p>
            </div>
            <div className="text-center rounded-lg bg-surface px-3 py-3 border border-outline/10">
              <CreditCard className="h-4 w-4 mx-auto text-on-surface-variant mb-1" />
              <p className="text-headline-sm font-semibold text-on-surface">{stats.paymentCount}</p>
              <p className="text-label-sm text-on-surface-variant">תשלומים</p>
            </div>
            <div className="text-center rounded-lg bg-surface px-3 py-3 border border-outline/10">
              <TrendingUp className="h-4 w-4 mx-auto text-on-surface-variant mb-1" />
              <p className="text-headline-sm font-semibold text-on-surface">
                {stats.totalAmount > 0 ? `₪${stats.totalAmount.toLocaleString()}` : '₪0'}
              </p>
              <p className="text-label-sm text-on-surface-variant">סה״כ</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
