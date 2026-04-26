'use client';

import { useEffect, useRef, useState } from 'react';
import './landing.css';
import {
  HeroSection,
  MarqueeSection,
  VideoSection,
  AboutSection,
  ActivitiesSection,
  GallerySection,
  ReviewsSection,
  StatsSection,
  CtaPaymentSection,
  JoinUsSection,
  FaqSection,
  FooterSection,
} from './_components/Sections';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface OrgData {
  name: string;
  legalName?: string;
  paymentLink?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappUrl?: string;
  websiteUrl?: string;
  logoUrl?: string;
  youtubeUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

interface Section {
  type: string;
  data: Record<string, unknown>;
}

interface LandingData {
  org: OrgData;
  sections: Section[];
}

/* ─── Section → nav label map ────────────────────────────────────────────── */
const NAV_LABELS: Record<string, { href: string; label: string }> = {
  about:       { href: '#about',      label: 'אודות' },
  activities:  { href: '#activities', label: 'פעילויות' },
  gallery:     { href: '#gallery',    label: 'גלריה' },
  join:        { href: '#contact',    label: 'צרו קשר' },
  reviews:     { href: '#reviews',    label: 'המלצות' },
  stats:       { href: '#stats',      label: 'במספרים' },
  faq:         { href: '#faq',        label: 'שאלות' },
  video:       { href: '#story',      label: 'הסיפור שלנו' },
  cta_payment: { href: '#donate',     label: 'תרמו' },
};

/* ─── Section renderer ───────────────────────────────────────────────────── */
function renderSection(section: Section, org: OrgData, i: number) {
  const props = {
    data: section.data,
    org,
    primaryColor: org.primaryColor || '#1A1410',
    accentColor: org.accentColor || '#B8893A',
    slug: '',
  };

  switch (section.type) {
    case 'hero':         return <HeroSection        key={i} {...props} />;
    case 'marquee':      return <MarqueeSection      key={i} {...props} />;
    case 'video':        return <VideoSection        key={i} {...props} />;
    case 'about':        return <AboutSection        key={i} {...props} />;
    case 'activities':   return <ActivitiesSection   key={i} {...props} />;
    case 'gallery':      return <GallerySection      key={i} {...props} />;
    case 'reviews':      return <ReviewsSection      key={i} {...props} />;
    case 'stats':        return <StatsSection        key={i} {...props} />;
    case 'cta_payment':  return <CtaPaymentSection   key={i} {...props} />;
    case 'join':         return <JoinUsSection       key={i} {...props} />;
    case 'faq':          return <FaqSection          key={i} {...props} />;
    case 'footer':       return <FooterSection       key={i} {...props} />;
    default:             return null;
  }
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default function LandingPage({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = params;
  const [data, setData] = useState<LandingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [navScrolled, setNavScrolled] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  /* ── Fetch landing data ─────────────────────────────────────────────── */
  useEffect(() => {
    const apiBase =
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';

    fetch(`${apiBase}/public/landing/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<LandingData>;
      })
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError('לא ניתן לטעון את הדף. אנא נסו שוב מאוחר יותר.');
        setLoading(false);
      });
  }, [slug]);

  /* ── Scroll reveal ──────────────────────────────────────────────────── */
  useEffect(() => {
    if (!data) return;

    const prefersReduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!('IntersectionObserver' in window) || prefersReduced) return;

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.remove('pending');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.05 }
    );

    requestAnimationFrame(() => {
      document.querySelectorAll('.lp-reveal').forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top >= window.innerHeight || r.bottom <= 0) {
          el.classList.add('pending');
          io.observe(el);
        }
      });
    });

    return () => io.disconnect();
  }, [data]);

  /* ── Nav scroll shadow ──────────────────────────────────────────────── */
  useEffect(() => {
    const handler = () => setNavScrolled(window.scrollY > 8);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  /* ── Color override ─────────────────────────────────────────────────── */
  useEffect(() => {
    if (!data?.org.accentColor) return;
    document.documentElement.style.setProperty(
      '--coral',
      data.org.accentColor
    );
    return () => {
      document.documentElement.style.removeProperty('--coral');
    };
  }, [data?.org.accentColor]);

  /* ── Loading ────────────────────────────────────────────────────────── */
  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--paper, #F4ECD8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          direction: 'rtl',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            border: '3px solid var(--paper-3, #DCCEAA)',
            borderTopColor: 'var(--coral, #B8893A)',
            animation: 'lp-spin 0.8s linear infinite',
          }}
        />
        <style>{`@keyframes lp-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Error ──────────────────────────────────────────────────────────── */
  if (error || !data) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--paper, #F4ECD8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          direction: 'rtl',
          gap: 16,
          padding: 32,
          textAlign: 'center',
          fontFamily: '"Frank Ruhl Libre", serif',
        }}
      >
        <div style={{ fontSize: 48, marginBottom: 8 }}>⚠</div>
        <h2 style={{ fontSize: 28, margin: 0, color: 'var(--ink, #1A1410)' }}>
          שגיאה בטעינת הדף
        </h2>
        <p style={{ color: 'var(--text-muted, #6B655C)', maxWidth: 420, lineHeight: 1.6 }}>
          {error || 'הדף לא נמצא. אנא בדקו את הכתובת ונסו שוב.'}
        </p>
        <a
          href="/"
          style={{
            marginTop: 8,
            padding: '12px 24px',
            background: 'var(--ink, #1A1410)',
            color: 'var(--paper, #F4ECD8)',
            borderRadius: 999,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          חזרה לדף הבית
        </a>
      </div>
    );
  }

  const { org, sections } = data;

  /* ── Nav links derived from section types ───────────────────────────── */
  const navLinks = sections
    .filter((s) => NAV_LABELS[s.type])
    .map((s) => NAV_LABELS[s.type])
    .filter(
      (link, idx, arr) => arr.findIndex((l) => l.href === link.href) === idx
    );

  /* ── Has footer ─────────────────────────────────────────────────────── */
  const hasFooter = sections.some((s) => s.type === 'footer');

  return (
    <div className="lp" dir="rtl" lang="he" ref={wrapperRef}>
      {/* ── Sticky nav ─────────────────────────────────────────────────── */}
      <nav className={`lp-nav${navScrolled ? ' scrolled' : ''}`} id="lp-nav">
        <a className="lp-brand" href="#top">
          {org.logoUrl ? (
            <img
              src={org.logoUrl}
              alt={org.name}
              style={{ width: 30, height: 30, borderRadius: 10, objectFit: 'cover' }}
            />
          ) : (
            <div className="lp-brand-mark" />
          )}
          <div className="lp-brand-name">{org.name}</div>
        </a>

        {navLinks.length > 0 && (
          <div className="lp-nav-links">
            {navLinks
              .filter((l) => l.href !== '#donate')
              .map((link) => (
                <a key={link.href} href={link.href}>
                  {link.label}
                </a>
              ))}
          </div>
        )}

        <a href="#donate" className="lp-btn lp-btn-primary">
          <span>תרמו</span>
        </a>
      </nav>

      {/* ── Sections ───────────────────────────────────────────────────── */}
      {sections.map((section, i) => renderSection(section, org, i))}

      {/* ── Fallback footer if none in sections ────────────────────────── */}
      {!hasFooter && (
        <FooterSection
          data={{}}
          org={org}
          primaryColor={org.primaryColor || '#1A1410'}
          accentColor={org.accentColor || '#B8893A'}
          slug={slug}
        />
      )}
    </div>
  );
}
