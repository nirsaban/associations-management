'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ChevronLeft, ChevronRight, Phone, Globe, Pause, Play } from 'lucide-react';
import api from '@/lib/api';

interface Business {
  id: string;
  title: string;
  description: string;
  category: string | null;
  logoUrl: string | null;
  coverImageUrl: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  whatsappUrl: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  linkedinUrl: string | null;
  isActive: boolean;
  user: {
    id: string;
    fullName: string;
    phone: string | null;
    avatarUrl: string | null;
  };
}

const AUTO_ROTATE_MS = 4500;

export function BusinessPromoSlider() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState<Business | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    let cancelled = false;
    api.get<{ data: Business[] }>('/community/businesses')
      .then(res => {
        if (cancelled) return;
        setBusinesses(res.data.data);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const next = useCallback(() => {
    setIndex(i => (businesses.length === 0 ? 0 : (i + 1) % businesses.length));
  }, [businesses.length]);

  const prev = useCallback(() => {
    setIndex(i => (businesses.length === 0 ? 0 : (i - 1 + businesses.length) % businesses.length));
  }, [businesses.length]);

  useEffect(() => {
    if (paused || businesses.length <= 1) return;
    timerRef.current = setTimeout(next, AUTO_ROTATE_MS);
    return () => clearTimeout(timerRef.current);
  }, [index, paused, businesses.length, next]);

  if (loading || businesses.length === 0) return null;

  const current = businesses[index];

  return (
    <>
      <section
        aria-label="עסקים מהקהילה"
        className="relative rounded-xl border border-outline/20 bg-surface-container-lowest overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div className="flex items-stretch gap-3 px-3 py-2.5 min-h-[72px]">
          {/* Tag */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 text-primary text-label-sm font-medium whitespace-nowrap self-start mt-0.5">
            <Briefcase className="h-3.5 w-3.5" />
            עסק מהקהילה
          </div>

          {/* Logo / icon */}
          <button
            onClick={() => setOpen(current)}
            className="flex-shrink-0 w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all"
            aria-label={`פתח את ${current.title}`}
          >
            {current.logoUrl ? (
              <img src={current.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <Briefcase className="h-5 w-5 text-on-surface-variant opacity-50" />
            )}
          </button>

          {/* Title + description */}
          <button
            onClick={() => setOpen(current)}
            className="flex-1 min-w-0 text-start hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-body-md font-semibold text-on-surface truncate">{current.title}</h3>
              {current.category && (
                <span className="text-label-sm text-on-surface-variant">· {current.category}</span>
              )}
            </div>
            <p className="text-label-md text-on-surface-variant line-clamp-1 mt-0.5">
              {current.description}
            </p>
            <p className="text-[11px] text-on-surface-variant opacity-70 mt-0.5">
              {current.user.fullName}
            </p>
          </button>

          {/* Nav buttons (desktop) */}
          {businesses.length > 1 && (
            <div className="hidden sm:flex items-center gap-1 self-center flex-shrink-0">
              <button
                onClick={prev}
                className="p-1.5 rounded-full hover:bg-surface-container transition-colors"
                aria-label="קודם"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPaused(p => !p)}
                className="p-1.5 rounded-full hover:bg-surface-container transition-colors"
                aria-label={paused ? 'הפעל' : 'השהה'}
              >
                {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={next}
                className="p-1.5 rounded-full hover:bg-surface-container transition-colors"
                aria-label="הבא"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Progress dots */}
        {businesses.length > 1 && (
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
            {businesses.map((_, i) => (
              <button
                key={i}
                onClick={() => setIndex(i)}
                aria-label={`עבור לעסק ${i + 1}`}
                className={`h-1 rounded-full transition-all ${
                  i === index ? 'bg-primary w-4' : 'bg-outline/40 w-1 hover:bg-outline/60'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {open && <BusinessDetailsModal business={open} onClose={() => setOpen(null)} />}
    </>
  );
}

// ─── Details Modal ──────────────────────────────────────────────

function BusinessDetailsModal({ business: b, onClose }: { business: Business; onClose: () => void }) {
  const links: { url: string; label: string; key: string }[] = [
    b.website && { url: b.website, label: 'אתר', key: 'website' },
    b.whatsappUrl && { url: b.whatsappUrl, label: 'וואטסאפ', key: 'whatsapp' },
    b.facebookUrl && { url: b.facebookUrl, label: 'פייסבוק', key: 'fb' },
    b.instagramUrl && { url: b.instagramUrl, label: 'אינסטגרם', key: 'ig' },
    b.tiktokUrl && { url: b.tiktokUrl, label: 'טיקטוק', key: 'tt' },
    b.youtubeUrl && { url: b.youtubeUrl, label: 'יוטיוב', key: 'yt' },
    b.linkedinUrl && { url: b.linkedinUrl, label: 'לינקדאין', key: 'li' },
  ].filter(Boolean) as { url: string; label: string; key: string }[];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Cover */}
        {b.coverImageUrl && (
          <div className="h-32 relative bg-surface-container">
            <img src={b.coverImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-16 h-16 rounded-xl bg-surface-container flex items-center justify-center overflow-hidden flex-shrink-0 border border-outline/20">
              {b.logoUrl ? (
                <img src={b.logoUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <Briefcase className="h-7 w-7 text-on-surface-variant" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-title-lg font-headline text-on-surface">{b.title}</h3>
              {b.category && (
                <p className="text-body-sm text-primary mt-0.5">{b.category}</p>
              )}
              <p className="text-label-sm text-on-surface-variant mt-1">
                בעל/ת העסק: {b.user.fullName}
              </p>
            </div>
          </div>

          <p className="text-body-md text-on-surface whitespace-pre-wrap mb-5">{b.description}</p>

          {/* Contact actions */}
          <div className="space-y-2 mb-4">
            {b.phone && (
              <a
                href={`tel:${b.phone}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                <Phone className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-body-md text-on-surface" dir="ltr">{b.phone}</span>
              </a>
            )}
            {b.email && (
              <a
                href={`mailto:${b.email}`}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high transition-colors"
              >
                <Globe className="h-4 w-4 text-primary flex-shrink-0" />
                <span className="text-body-md text-on-surface truncate" dir="ltr">{b.email}</span>
              </a>
            )}
          </div>

          {/* Social links */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {links.map(link => (
                <a
                  key={link.key}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-full bg-primary/10 text-primary text-body-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-outline/10 p-3 flex items-center justify-between">
          <Link
            href="/profile/business"
            className="text-body-sm text-primary hover:underline"
          >
            רוצה לפרסם גם אתה?
          </Link>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-body-sm hover:bg-surface-container"
          >
            סגירה
          </button>
        </div>
      </div>
    </div>
  );
}
