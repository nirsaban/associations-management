'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Briefcase, Phone, Globe, Pause, Play } from 'lucide-react';
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

// Read speed for the marquee, in px per second. Higher = faster.
const PX_PER_SECOND = 200;
// Cap duration so very large lists don't feel infinitely slow.
const MAX_DURATION_S = 20;
const MIN_DURATION_S = 6;
// Estimated width (px) of a single business chip including gap, used for
// pre-layout repeat count before the DOM is measured.
const ESTIMATED_ITEM_WIDTH_PX = 320;

export function BusinessPromoSlider() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [paused, setPaused] = useState(false);
  const [open, setOpen] = useState<Business | null>(null);
  const [duration, setDuration] = useState(40);
  const [repeatCount, setRepeatCount] = useState(2);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ data: Business[] }>('/community/businesses')
      .then((res) => {
        if (cancelled) return;
        const list = res.data.data;
        console.debug('[BusinessSlider] loaded', list.length, 'businesses');
        setBusinesses(list);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // After the businesses are set, compute how many times the list must be
  // repeated so the track fills at least two full viewport widths. This ensures
  // the seamless loop works even when the business list is very short (1-2 items).
  useEffect(() => {
    if (businesses.length === 0) return;

    const container = trackRef.current?.parentElement;
    const viewportWidth = container?.clientWidth ?? (typeof window !== 'undefined' ? window.innerWidth : 1280);

    const estimatedContentWidth = businesses.length * ESTIMATED_ITEM_WIDTH_PX;
    // We need the total track (= repeats × contentWidth) to be >= 2 × viewportWidth
    // so that -50% translation always covers one full loop.
    const neededRepeats = Math.max(2, Math.ceil((viewportWidth * 2) / estimatedContentWidth));
    setRepeatCount(neededRepeats);
  }, [businesses]);

  // Compute animation duration from actual rendered content width so speed is
  // constant regardless of how many businesses are loaded. Runs after repeatCount
  // settles so scrollWidth reflects the final DOM layout.
  useEffect(() => {
    if (!trackRef.current || businesses.length === 0) return;
    // The animation translates from 0 to -(1/repeatCount) of the total width,
    // i.e. exactly one copy of the content. scrollWidth / repeatCount = contentWidth.
    const contentWidth = trackRef.current.scrollWidth / repeatCount;
    if (contentWidth > 0) {
      const raw = contentWidth / PX_PER_SECOND;
      setDuration(Math.min(MAX_DURATION_S, Math.max(MIN_DURATION_S, raw)));
    }
  }, [businesses, repeatCount]);

  if (loading || businesses.length === 0) return null;

  // Build the looped track: repeat the list `repeatCount` times so short lists
  // always fill the viewport and the seamless animation works correctly.
  const loop = Array.from({ length: repeatCount }, (_, rep) =>
    businesses.map((b) => ({ ...b, _key: `${b.id}-${rep}` })),
  ).flat();

  return (
    <>
      <section
        aria-label="עסקים מהקהילה"
        className="news-ticker relative rounded-xl border border-primary/20 bg-surface-container-lowest overflow-hidden"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* LIVE chyron — stays fixed on the right (RTL "start" side) */}
        <div className="news-ticker__chyron">
          <span className="news-ticker__live">
            <span className="news-ticker__live-dot" aria-hidden="true">
              <span className="news-ticker__live-dot-ping" />
              <span className="news-ticker__live-dot-core" />
            </span>
            LIVE
          </span>
          <span className="news-ticker__chyron-label">
            <Briefcase className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">עסקים מהקהילה</span>
          </span>
        </div>

        {/* Edge fades — give the impression items appear/exit through a window */}
        <div className="news-ticker__fade news-ticker__fade--start" aria-hidden="true" />
        <div className="news-ticker__fade news-ticker__fade--end" aria-hidden="true" />

        {/* Pause control — bottom-end corner */}
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          className="news-ticker__pause"
          aria-label={paused ? 'המשך הזרמת עסקים' : 'השהה הזרמת עסקים'}
        >
          {paused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
        </button>

        {/* The marquee track */}
        <div
          ref={trackRef}
          className="news-ticker__track"
          style={{
            // Track runs in LTR direction so translateX math is predictable;
            // each chip carries its own dir-aware text alignment.
            // The keyframe animates by -(100/repeatCount)% so exactly one copy
            // of the content scrolls through before the loop restarts.
            animationDuration: `${duration}s`,
            animationPlayState: paused ? 'paused' : 'running',
            ['--repeat-count' as string]: repeatCount,
          }}
        >
          {loop.map(({ _key, ...b }) => (
            <button
              type="button"
              key={_key}
              onClick={() => setOpen(b)}
              className="news-ticker__item"
              aria-label={`פתח את ${b.title}`}
            >
              <span className="news-ticker__logo" aria-hidden="true">
                {b.logoUrl ? (
                  <img src={b.logoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Briefcase className="h-4 w-4 opacity-50" />
                )}
              </span>
              <span className="news-ticker__copy">
                <span className="news-ticker__title">{b.title}</span>
                {b.category && (
                  <span className="news-ticker__category"> · {b.category}</span>
                )}
                <span className="news-ticker__desc"> — {b.description}</span>
                <span className="news-ticker__author"> · {b.user.fullName}</span>
              </span>
              <span className="news-ticker__sep" aria-hidden="true">◆</span>
            </button>
          ))}
        </div>

        <style jsx>{`
          .news-ticker {
            /* keep the chyron and pause button from being clipped by overflow:hidden */
            isolation: isolate;
          }

          /* Subtle scan-line / vignette so it reads as a broadcast strip */
          .news-ticker::before {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background:
              linear-gradient(180deg, rgb(var(--primary) / 0.04) 0%, transparent 30%, transparent 70%, rgb(var(--primary) / 0.04) 100%);
            z-index: 1;
          }

          /* ── LIVE chyron ── */
          .news-ticker__chyron {
            position: absolute;
            top: 0;
            bottom: 0;
            inset-inline-start: 0;
            z-index: 4;
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 0 12px;
            background: linear-gradient(
              to var(--ticker-fade-end, left),
              rgb(var(--surface)) 0%,
              rgb(var(--surface)) 65%,
              rgb(var(--surface) / 0) 100%
            );
          }
          /* dir-aware fade target — RTL fades to the visual left; LTR to the right */
          [dir='rtl'] .news-ticker__chyron { --ticker-fade-end: left; }
          [dir='ltr'] .news-ticker__chyron { --ticker-fade-end: right; }

          .news-ticker__live {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 3px 8px;
            border-radius: 4px;
            background: rgb(var(--error));
            color: rgb(var(--text-inverse));
            font-size: 11px;
            font-weight: 800;
            letter-spacing: 0.08em;
            line-height: 1;
            box-shadow: 0 0 0 1px rgb(var(--error) / 0.4), 0 2px 8px rgb(var(--error) / 0.35);
          }
          .news-ticker__live-dot {
            position: relative;
            display: inline-flex;
            width: 8px;
            height: 8px;
          }
          .news-ticker__live-dot-ping {
            position: absolute;
            inset: 0;
            border-radius: 9999px;
            background: rgb(255 255 255 / 0.9);
            opacity: 0.75;
            animation: nt-ping 1.4s cubic-bezier(0, 0, 0.2, 1) infinite;
          }
          .news-ticker__live-dot-core {
            position: relative;
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 9999px;
            background: rgb(255 255 255);
          }
          @keyframes nt-ping {
            0% { transform: scale(1); opacity: 0.8; }
            80%, 100% { transform: scale(2); opacity: 0; }
          }

          .news-ticker__chyron-label {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 12px;
            font-weight: 600;
            color: rgb(var(--text-muted));
            white-space: nowrap;
          }

          /* ── Edge fades ── */
          .news-ticker__fade {
            position: absolute;
            top: 0;
            bottom: 0;
            width: 56px;
            z-index: 3;
            pointer-events: none;
          }
          .news-ticker__fade--start {
            inset-inline-start: 0;
            background: linear-gradient(
              to var(--fade-out, left),
              rgb(var(--surface-container-lowest, var(--surface))) 0%,
              rgb(var(--surface-container-lowest, var(--surface)) / 0) 100%
            );
          }
          .news-ticker__fade--end {
            inset-inline-end: 0;
            background: linear-gradient(
              to var(--fade-out-end, right),
              rgb(var(--surface-container-lowest, var(--surface))) 0%,
              rgb(var(--surface-container-lowest, var(--surface)) / 0) 100%
            );
          }
          [dir='rtl'] .news-ticker__fade--start { --fade-out: left; }
          [dir='ltr'] .news-ticker__fade--start { --fade-out: right; }
          [dir='rtl'] .news-ticker__fade--end { --fade-out-end: right; }
          [dir='ltr'] .news-ticker__fade--end { --fade-out-end: left; }

          /* ── Pause / play button ── */
          .news-ticker__pause {
            position: absolute;
            bottom: 4px;
            inset-inline-end: 6px;
            z-index: 4;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            border-radius: 9999px;
            background: rgb(var(--surface) / 0.85);
            backdrop-filter: blur(4px);
            border: 1px solid rgb(var(--border));
            color: rgb(var(--text-muted));
            opacity: 0;
            transition: opacity 200ms ease, color 200ms ease;
          }
          .news-ticker:hover .news-ticker__pause,
          .news-ticker__pause:focus-visible {
            opacity: 1;
          }
          .news-ticker__pause:hover { color: rgb(var(--primary)); }

          /* ── Track ── */
          .news-ticker__track {
            display: flex;
            flex-wrap: nowrap;
            align-items: center;
            gap: 40px;
            padding: 14px 0;
            /* leave room for the chyron on the start side */
            padding-inline-start: 150px;
            white-space: nowrap;
            will-change: transform;
            animation-name: nt-scroll;
            animation-timing-function: linear;
            animation-iteration-count: infinite;
            direction: ltr; /* track is laid out LTR; each item carries its own dir */
            min-width: max-content; /* prevent any wrapping/stacking even on narrow viewports */
          }

          @media (max-width: 640px) {
            .news-ticker__track { padding-inline-start: 88px; }
          }

          @keyframes nt-scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(calc(-100% / var(--repeat-count, 2))); }
          }

          /* ── Item ── */
          .news-ticker__item {
            display: inline-flex;
            align-items: center;
            gap: 10px;
            flex: 0 0 auto;
            cursor: pointer;
            color: rgb(var(--text));
            transition: color 180ms ease, transform 180ms ease;
            direction: rtl;
          }
          .news-ticker__item:hover {
            color: rgb(var(--primary));
            transform: translateY(-1px);
          }
          .news-ticker__item:focus-visible {
            outline: 2px solid rgb(var(--primary) / 0.5);
            outline-offset: 4px;
            border-radius: 4px;
          }

          .news-ticker__logo {
            flex: 0 0 auto;
            width: 28px;
            height: 28px;
            border-radius: 6px;
            overflow: hidden;
            background: rgb(var(--surface-container, var(--surface-alt)));
            display: inline-flex;
            align-items: center;
            justify-content: center;
            color: rgb(var(--text-muted));
            border: 1px solid rgb(var(--border));
          }

          .news-ticker__copy {
            display: inline-flex;
            align-items: baseline;
            font-size: 14px;
            line-height: 1.2;
            white-space: nowrap;
            flex: 0 0 auto;
          }
          .news-ticker__title {
            font-weight: 700;
            color: inherit;
          }
          .news-ticker__category {
            color: rgb(var(--primary));
            font-weight: 600;
          }
          .news-ticker__desc {
            color: rgb(var(--text-muted));
            max-width: 360px;
            overflow: hidden;
            text-overflow: ellipsis;
            display: inline-block;
            vertical-align: bottom;
            white-space: nowrap;
          }
          .news-ticker__author {
            color: rgb(var(--text-muted));
            opacity: 0.8;
          }

          .news-ticker__sep {
            color: rgb(var(--primary));
            opacity: 0.45;
            font-size: 10px;
            margin-inline-start: 6px;
          }

          @media (prefers-reduced-motion: reduce) {
            .news-ticker__track { animation: none; }
            .news-ticker__live-dot-ping { animation: none; }
          }
        `}</style>
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
