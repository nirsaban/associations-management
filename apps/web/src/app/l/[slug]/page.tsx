'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import './landing.css';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface OrgData {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  paymentLink?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  legalName?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappUrl?: string;
  websiteUrl?: string;
  youtubeUrl?: string;
}

interface SectionRow {
  id: string;
  type: string;
  position: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  visible: boolean;
}

interface LandingResponse {
  data: {
    id: string;
    slug: string;
    title: string;
    theme: string;
    published: boolean;
    sections: SectionRow[];
    organization: OrgData;
  };
}

/* ─── Nav anchors ───────────────────────────────────────────────────────── */

const NAV_ANCHORS: Record<string, { href: string; he: string }> = {
  about:      { href: '#about',      he: 'אודות' },
  activities: { href: '#activities', he: 'פעילויות' },
  gallery:    { href: '#gallery',    he: 'גלריה' },
  join_us:    { href: '#contact',    he: 'צרו קשר' },
};

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [landing, setLanding] = useState<LandingResponse['data'] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  /* ── Fetch ── */
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
    const qs = new URLSearchParams(window.location.search);
    const preview = qs.get('preview') === '1' ? '?preview=1' : '';

    fetch(`${apiBase}/public/landing/${slug}${preview}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<LandingResponse>; })
      .then((json) => { setLanding(json.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  /* ── Nav scroll shadow ── */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* ── Count-up observer for .hero-stat .n elements ── */
  useEffect(() => {
    if (!landing) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        const el = e.target as HTMLElement;
        const target = el.dataset.num;
        if (!target) return;
        const m = target.match(/^([\d,]+)(.*)$/);
        if (!m) return;
        const final = parseInt(m[1].replace(/,/g, ''), 10);
        const suffix = m[2];
        const start = performance.now();
        const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(final * eased).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        el.textContent = '0' + suffix;
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });

    requestAnimationFrame(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      wrapper.querySelectorAll('.hero-stat .n').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl.dataset.num) htmlEl.dataset.num = htmlEl.textContent || '';
        obs.observe(htmlEl);
      });
    });

    return () => obs.disconnect();
  }, [landing]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F4ECD8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #EADFC4', borderTopColor: '#B8893A', animation: 'lp-spin .8s linear infinite' }} />
        <style>{`@keyframes lp-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !landing) {
    return (
      <div dir="rtl" lang="he" style={{ minHeight: '100vh', background: '#F4ECD8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Frank Ruhl Libre", serif', color: '#1A1410' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>העמוד לא נמצא</h1>
        <p style={{ color: '#6B655C' }}>ייתכן שהעמוד הוסר או שהכתובת שגויה</p>
      </div>
    );
  }

  /* ── Derive rendering data ── */
  const org = landing.organization;
  const sections = landing.sections.filter((s) => s.visible).sort((a, b) => a.position - b.position);
  const sectionTypes = new Set(sections.map((s) => s.type));
  const heroData = sections.find((s) => s.type === 'hero')?.data;

  const navLinks = Object.entries(NAV_ANCHORS)
    .filter(([type]) => sectionTypes.has(type))
    .map(([, v]) => v);

  /* ── Hero fields ── */
  const headline = (heroData?.headline as string) || '';
  const words = headline.split(/\s+/).filter(Boolean);
  const accentIndex = typeof heroData?.accent_word_index === 'number' ? heroData.accent_word_index : 2;
  const pillText = (heroData?.pill_text as string) || '';
  const sinceText = (heroData?.since_text as string) || '';
  const subheadline = (heroData?.subheadline as string) || '';
  const ctaLabel = (heroData?.cta_label as string) || '';
  const secondaryCtaLabel = (heroData?.secondary_cta_label as string) || '';
  const stats = (heroData?.stats as Array<{ value: string; label: string }>) || [];

  return (
    <div className="lp-landing" dir="rtl" lang="he" ref={wrapperRef}>
      {/* ═══ NAV (step 1) ═══ */}
      <nav className={`nav${scrolled ? ' scrolled' : ''}`} id="nav">
        <a className="brand" href="#top">
          {org.logoUrl
            ? <img src={org.logoUrl} alt="" style={{ width: 30, height: 30, borderRadius: 10, objectFit: 'cover' }} />
            : <div className="brand-mark" />
          }
          <div className="brand-name">{org.name}</div>
        </a>
        {navLinks.length > 0 && (
          <div className="nav-links">
            {navLinks.map((l) => <a key={l.href} href={l.href}>{l.he}</a>)}
          </div>
        )}
        <a href="#donate" className="btn btn-primary"><span>תרמו</span></a>
      </nav>

      {/* ═══ HERO (step 2) ═══ */}
      {heroData && headline && (
        <header className="hero" id="top">
          <div className="hero-bg" aria-hidden="true">
            <div className="blob blob-1" />
            <div className="blob blob-2" />
            <div className="blob blob-3" />
          </div>
          <div className="hero-inner">
            {/* Meta: pill + since */}
            {(pillText || sinceText) && (
              <div className="hero-meta">
                {pillText && (
                  <span className="hero-pill">
                    <span className="dot" />
                    <span>{pillText}</span>
                  </span>
                )}
                {sinceText && <span className="since">{sinceText}</span>}
              </div>
            )}

            {/* Headline with word-by-word reveal */}
            <h1>
              {words.map((word, i) => (
                <span key={i} className={`word${i === accentIndex ? ' accent' : ''}`}>
                  {word}{'\u00A0'}
                </span>
              ))}
            </h1>

            {subheadline && <p className="hero-sub">{subheadline}</p>}

            {/* CTA row */}
            {(ctaLabel || secondaryCtaLabel) && (
              <div className="hero-cta">
                {ctaLabel && (
                  <a href="#donate" className="btn btn-primary btn-lg"><span>{ctaLabel}</span></a>
                )}
                {secondaryCtaLabel && (
                  <a href="#story" className="btn btn-ghost btn-lg">
                    {secondaryCtaLabel} <span className="arrow">←</span>
                  </a>
                )}
              </div>
            )}

            {/* Stat tiles */}
            {stats.length > 0 && (
              <div className="hero-stats">
                {stats.map((s, i) => (
                  <div key={i} className="hero-stat">
                    <div className="n" data-num={s.value}>{s.value}</div>
                    <div className="l">{s.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </header>
      )}

      {/* Placeholder — remaining sections added in subsequent steps */}
      <div style={{ minHeight: '100vh', padding: '64px' }} />
    </div>
  );
}
