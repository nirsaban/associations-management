'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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

interface Section {
  id: string;
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  visible: boolean;
  position: number;
}

interface LandingPageData {
  id: string;
  slug: string;
  title: string;
  seoDescription?: string;
  theme: string;
  published: boolean;
  sections: Section[];
  organization: {
    id: string;
    name: string;
    slug: string;
    logoUrl?: string;
    primaryColor: string;
    accentColor: string;
    aboutShort?: string;
    contactPhone?: string;
    contactEmail?: string;
    address?: string;
    legalName?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    whatsappUrl?: string;
    websiteUrl?: string;
    youtubeUrl?: string;
    paymentLink?: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
  marquee: MarqueeSection,
  video: VideoSection,
  about: AboutSection,
  activities: ActivitiesSection,
  gallery: GallerySection,
  reviews: ReviewsSection,
  stats: StatsSection,
  cta_payment: CtaPaymentSection,
  join_us: JoinUsSection,
  faq: FaqSection,
  footer: FooterSection,
};

/* Nav link labels — derived from section types present in the page */
const NAV_LINKS: Record<string, { href: string; label: string }> = {
  about:      { href: '#about',      label: 'אודות'    },
  activities: { href: '#activities', label: 'פעילויות' },
  gallery:    { href: '#gallery',    label: 'גלריה'    },
  join_us:    { href: '#contact',    label: 'צרו קשר'  },
};

export default function PublicLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [landing, setLanding] = useState<LandingPageData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  /* ── Fetch landing data ── */
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isPreview = searchParams.get('preview') === '1';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
    fetch(`${apiUrl}/public/landing/${slug}${isPreview ? '?preview=1' : ''}`)
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then(data => { setLanding(data.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  /* ── Track view (once per session) ── */
  useEffect(() => {
    if (!landing || !landing.published) return;
    const key = `_lp_viewed_${slug}`;
    if (sessionStorage.getItem(key)) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
    fetch(`${apiUrl}/public/landing/${slug}/track`, { method: 'POST' }).catch(() => {});
    sessionStorage.setItem(key, '1');
  }, [landing, slug]);

  /* ── Sticky nav scroll listener ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* ── Scroll-reveal via IntersectionObserver ── */
  useEffect(() => {
    if (!landing || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.remove('pending');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.05 });

    requestAnimationFrame(() => {
      document.querySelectorAll('.lp-reveal').forEach(el => {
        const r = el.getBoundingClientRect();
        if (r.top >= window.innerHeight || r.bottom <= 0) {
          el.classList.add('pending');
          io.observe(el);
        }
      });
    });

    return () => io.disconnect();
  }, [landing]);

  /* ── Count-up animation for hero stat .n elements ── */
  useEffect(() => {
    if (!landing || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const statsObs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        statsObs.unobserve(e.target);
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

    // Observe hero stat number elements
    document.querySelectorAll('.lp-hero-stat .n').forEach(el => {
      const htmlEl = el as HTMLElement;
      if (!htmlEl.dataset.num) htmlEl.dataset.num = htmlEl.textContent || '';
      statsObs.observe(htmlEl);
    });

    return () => statsObs.disconnect();
  }, [landing]);

  /* ── Loading state ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F4ECD8' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #EADFC4', borderTopColor: '#B8893A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  /* ── Error / not found state ── */
  if (error || !landing) {
    return (
      <div dir="rtl" lang="he" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F4ECD8', fontFamily: '"Frank Ruhl Libre", serif', color: '#1A1410' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>העמוד לא נמצא</h1>
        <p style={{ color: '#6B655C' }}>ייתכן שהעמוד הוסר או שהכתובת שגויה</p>
      </div>
    );
  }

  const org = landing.organization;
  const primaryColor = org.primaryColor || '#1A1410';
  const accentColor = org.accentColor || '#B8893A';
  const themeName = (landing.theme || 'modern').toLowerCase();

  /* Build nav links from visible section types */
  const visibleTypes = new Set(landing.sections.filter(s => s.visible).map(s => s.type));
  const navLinks = Object.entries(NAV_LINKS).filter(([type]) => visibleTypes.has(type));
  const hasDonate = visibleTypes.has('cta_payment');

  return (
    <div
      className="lp"
      dir="rtl"
      lang="he"
      data-theme={themeName}
      style={{ '--coral': accentColor, '--coral-2': accentColor } as React.CSSProperties}
    >
      {/* ── Sticky nav — mirrors prototype exactly ── */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <a className="lp-brand" href="#top">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt="" className="lp-brand-mark" style={{ objectFit: 'contain' }} />
          ) : (
            <div className="lp-brand-mark" />
          )}
          <div className="lp-brand-name">{org.name}</div>
        </a>

        {navLinks.length > 0 && (
          <div className="lp-nav-links">
            {navLinks.map(([, link]) => (
              <a key={link.href} href={link.href}>{link.label}</a>
            ))}
          </div>
        )}

        {hasDonate && (
          <a href="#donate" className="lp-btn lp-btn-primary">
            <span>תרמו</span>
          </a>
        )}
      </nav>

      {/* ── Sections ── */}
      {landing.sections
        .filter(s => s.visible)
        .sort((a, b) => a.position - b.position)
        .map(section => {
          const Component = SECTION_COMPONENTS[section.type];
          if (!Component) return null;
          return (
            <Component
              key={section.id}
              data={section.data}
              org={org}
              primaryColor={primaryColor}
              accentColor={accentColor}
              slug={slug}
            />
          );
        })}
    </div>
  );
}
