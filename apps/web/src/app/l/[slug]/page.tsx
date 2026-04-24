'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { MotionConfig, useReducedMotion } from 'framer-motion';
import { THEME_VARS } from './themes';
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
  data: Record<string, unknown>;
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
    facebookUrl?: string;
    instagramUrl?: string;
    whatsappUrl?: string;
    websiteUrl?: string;
    paymentLink?: string;
  };
}

const SECTION_COMPONENTS: Record<string, React.ComponentType<{
  data: Record<string, unknown>;
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
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !landing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">העמוד לא נמצא</h1>
        <p className="text-gray-500">ייתכן שהעמוד הוסר או שהכתובת שגויה</p>
      </div>
    );
  }

  const theme = THEME_VARS[landing.theme] || THEME_VARS.MODERN;
  const org = landing.organization;
  const primaryColor = org.primaryColor || '#2563eb';
  const accentColor = org.accentColor || '#f59e0b';
  const prefersReducedMotion = useReducedMotion();

  // Build CSS variables
  const cssVars: Record<string, string> = {
    ...theme,
    '--lp-primary': primaryColor,
    '--lp-accent': accentColor,
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        className="min-h-screen"
        dir="rtl"
        lang="he"
        data-reduced-motion={prefersReducedMotion ? 'true' : 'false'}
        style={{
          ...cssVars as React.CSSProperties,
          backgroundColor: 'var(--lp-bg)',
          fontFamily: 'var(--lp-font-body)',
          color: 'var(--lp-text)',
        }}
      >
        {/* SEO meta */}
        {landing.title && <title>{landing.title}</title>}

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
