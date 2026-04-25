'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import './landing.css';
import {
  HeroSection,
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
    paymentLink?: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SECTION_COMPONENTS: Record<string, React.ComponentType<any>> = {
  hero: HeroSection,
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

export default function PublicLandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [landing, setLanding] = useState<LandingPageData | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Fetch landing data
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isPreview = searchParams.get('preview') === '1';
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
    fetch(`${apiUrl}/public/landing/${slug}${isPreview ? '?preview=1' : ''}`)
      .then(res => { if (!res.ok) throw new Error('Not found'); return res.json(); })
      .then(data => { setLanding(data.data); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  // Track view
  useEffect(() => {
    if (!landing || !landing.published) return;
    const key = `_lp_viewed_${slug}`;
    if (sessionStorage.getItem(key)) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
    fetch(`${apiUrl}/public/landing/${slug}/track`, { method: 'POST' }).catch(() => {});
    sessionStorage.setItem(key, '1');
  }, [landing, slug]);

  // Sticky nav scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-reveal (same technique as prototype)
  useEffect(() => {
    if (!landing || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!('IntersectionObserver' in window)) return;

    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.remove('pending'); io.unobserve(e.target); }
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

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBFAF7' }}>
      <div style={{ width: 32, height: 32, border: '3px solid #DFD8C7', borderTopColor: '#2F5F5C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>;
  }

  if (error || !landing) {
    return <div dir="rtl" lang="he" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FBFAF7', fontFamily: 'Inter, Heebo, sans-serif', color: '#15130F' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>העמוד לא נמצא</h1>
      <p style={{ color: '#6B645B' }}>ייתכן שהעמוד הוסר או שהכתובת שגויה</p>
    </div>;
  }

  const org = landing.organization;
  const primaryColor = org.primaryColor || '#2F5F5C';
  const accentColor = org.accentColor || '#C8732F';
  const themeName = (landing.theme || 'modern').toLowerCase();

  // Inline CSS var overrides for admin colors
  const colorStyle: React.CSSProperties = {
    '--primary': primaryColor,
    '--primary-hover': primaryColor,
    '--primary-50': `color-mix(in oklab, ${primaryColor} 12%, var(--n-50))`,
    '--primary-700': `color-mix(in oklab, ${primaryColor} 70%, var(--n-900))`,
    '--accent': accentColor,
    '--shadow-tint': `color-mix(in oklab, ${primaryColor} 18%, transparent)`,
  } as React.CSSProperties;

  return (
    <div className="lp" dir="rtl" lang="he" data-theme={themeName} style={colorStyle}>
      {/* Sticky nav */}
      <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
        <a className="lp-brand" href="#top">
          {org.logoUrl ? (
            <img src={org.logoUrl} alt="" className="lp-brand-mark" />
          ) : (
            <div className="lp-brand-mark" />
          )}
          <div className="lp-brand-name">{org.name}</div>
        </a>
        {org.paymentLink && (
          <a href={org.paymentLink} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-primary">
            תרמו
          </a>
        )}
      </nav>

      {/* Sections */}
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
