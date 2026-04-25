'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { derivePrimaryScale } from './themes';
import './tokens.css';
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

/* ── Sticky nav (from prototype) ── */
function StickyNav({ orgName, logoUrl, paymentLink }: { orgName: string; logoUrl?: string; paymentLink?: string }) {
  const [scrolled, setScrolled] = React.useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '20px clamp(20px, 5vw, 56px)',
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(251,250,247,0.85)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'border-color 200ms',
    }}>
      <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
        {logoUrl ? (
          <img src={logoUrl} alt="" style={{ width: 24, height: 24, borderRadius: 7, objectFit: 'contain' }} />
        ) : (
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'var(--primary)' }} />
        )}
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 21 }}>{orgName}</span>
      </a>
      {paymentLink && (
        <a href={paymentLink} target="_blank" rel="noopener noreferrer" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          borderRadius: 'var(--r-btn)', padding: '10px 20px', fontSize: 14, fontWeight: 500,
          background: 'var(--primary)', color: '#fff', boxShadow: 'var(--e-cta)',
          textDecoration: 'none', border: 'none',
        }}>
          תרמו
        </a>
      )}
    </nav>
  );
}

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

const SECTION_COMPONENTS: Record<string, React.ComponentType<{
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  org: LandingPageData['organization'];
  primaryColor: string;
  accentColor: string;
  slug: string;
}>> = {
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
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const isPreview = searchParams.get('preview') === '1';

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
    const url = `${apiUrl}/public/landing/${slug}${isPreview ? '?preview=1' : ''}`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setLanding(data.data);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [slug]);

  // Track view
  useEffect(() => {
    if (!landing || !landing.published) return;
    const viewedKey = `_lp_viewed_${slug}`;
    if (sessionStorage.getItem(viewedKey)) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
    fetch(`${apiUrl}/public/landing/${slug}/track`, { method: 'POST' }).catch(() => {});
    sessionStorage.setItem(viewedKey, '1');
  }, [landing, slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FBFAF7' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #DFD8C7', borderTopColor: '#2F5F5C', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      </div>
    );
  }

  if (error || !landing) {
    return (
      <div dir="rtl" lang="he" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#FBFAF7', fontFamily: 'Inter, Heebo, sans-serif', color: '#15130F' }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>העמוד לא נמצא</h1>
        <p style={{ color: '#6B645B' }}>ייתכן שהעמוד הוסר או שהכתובת שגויה</p>
      </div>
    );
  }

  const org = landing.organization;
  const primaryColor = org.primaryColor || '#2F5F5C';
  const accentColor = org.accentColor || '#C8732F';
  const themeName = (landing.theme || 'modern').toLowerCase();

  // Derive primary color scale as inline CSS vars
  const colorOverrides = derivePrimaryScale(primaryColor, accentColor);

  return (
    <MotionConfig reducedMotion="user">
      <div
        dir="rtl"
        lang="he"
        data-theme={themeName}
        data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
        style={{
          ...colorOverrides as React.CSSProperties,
          minHeight: '100vh',
          background: 'var(--bg)',
          fontFamily: 'var(--font-body)',
          color: 'var(--text)',
        }}
      >
        {/* Sticky nav */}
        <StickyNav orgName={org.name} logoUrl={org.logoUrl} paymentLink={org.paymentLink} />

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
    </MotionConfig>
  );
}
