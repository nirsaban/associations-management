'use client';

import { useEffect, useState } from 'react';
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
  data: Record<string, unknown>;
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

/* ─── Nav link map — only show links for sections present on the page ──── */

const NAV_ANCHORS: Record<string, { href: string; he: string; en: string }> = {
  about:      { href: '#about',      he: 'אודות',    en: 'About' },
  activities: { href: '#activities', he: 'פעילויות', en: 'Activities' },
  gallery:    { href: '#gallery',    he: 'גלריה',    en: 'Gallery' },
  join_us:    { href: '#contact',    he: 'צרו קשר',  en: 'Contact' },
};

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const params = useParams();
  const slug = params.slug as string;

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

  const org = landing.organization;
  const sections = landing.sections.filter((s) => s.visible).sort((a, b) => a.position - b.position);
  const sectionTypes = new Set(sections.map((s) => s.type));

  /* Nav links from visible sections */
  const navLinks = Object.entries(NAV_ANCHORS)
    .filter(([type]) => sectionTypes.has(type))
    .map(([, v]) => v);

  return (
    <div className="lp-landing" dir="rtl" lang="he">
      {/* ── Sticky nav — prototype lines 328-340 ── */}
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
            {navLinks.map((l) => (
              <a key={l.href} href={l.href}>{l.he}</a>
            ))}
          </div>
        )}

        <a href="#donate" className="btn btn-primary"><span>תרמו</span></a>
      </nav>

      {/* Placeholder content so page is scrollable (tests scroll shadow) */}
      <div style={{ minHeight: '200vh', padding: '120px 64px 64px' }}>
        <p style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-display)', fontSize: 18 }}>
          דף הנחיתה בבנייה — גלול למטה כדי לבדוק את אפקט ה-scroll shadow
        </p>
      </div>
    </div>
  );
}
