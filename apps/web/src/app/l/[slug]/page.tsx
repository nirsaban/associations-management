'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import './landing.css';

/* ─── Framer Motion helpers ────────────────────────────────────────────── */

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const easeOutExpo = [0.22, 1, 0.36, 1] as [number, number, number, number];
const defaultTransition = { duration: 0.6, ease: easeOutExpo };
const vp = { once: true, amount: 0 as const };

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface OrgData {
  name: string;
  slug: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  paymentLink?: string;
  hasGrowWallet?: boolean;
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

/* ── Grow Wallet SDK types ─────────────────────────────────────────────── */
declare global {
  interface Window {
    growPayment?: {
      init: (config: Record<string, unknown>) => void;
      renderPaymentOptions: (authCode: string) => void;
    };
  }
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

/* ─── Star SVG for reviews ─────────────────────────────────────────────── */
const StarSvg = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M12 3l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 17l-5.6 3.2 1.5-6.3L3 9.6l6.4-.6L12 3z" />
  </svg>
);

/* ─── Page ──────────────────────────────────────────────────────────────── */

export default function LandingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [landing, setLanding] = useState<LandingResponse['data'] | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  // Referral tracking
  const [referralCode, setReferralCode] = useState<string | null>(null);

  /* ── Fetch ── */
  useEffect(() => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
    const qs = new URLSearchParams(window.location.search);
    const preview = qs.get('preview') === '1' ? '?preview=1' : '';
    const ref = qs.get('ref');
    if (ref) setReferralCode(ref);

    fetch(`${apiBase}/public/landing/${slug}${preview}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json() as Promise<LandingResponse>; })
      .then((json) => {
        setLanding(json.data);
        setLoading(false);
        // Track referral click
        if (ref) {
          fetch(`${apiBase}/public/landing/${slug}/referral-click`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code: ref }),
          }).catch(() => {});
        }
      })
      .catch(() => { setError(true); setLoading(false); });
  }, [slug]);

  /* ── Nav scroll shadow ── */
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  /* ── Count-up observer for .hero-stat .n and .stats .stat-num elements ── */
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
      wrapper.querySelectorAll('.hero-stat .n, .stats .stat-num').forEach((el) => {
        const htmlEl = el as HTMLElement;
        if (!htmlEl.dataset.num) htmlEl.dataset.num = htmlEl.textContent || '';
        obs.observe(htmlEl);
      });
    });

    return () => obs.disconnect();
  }, [landing]);

  /* ── Entrance reveal — handled by Framer Motion whileInView ── */

  /* ── Loading ── */
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FDFCFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #F5F3EF', borderTopColor: '#C49A6C', animation: 'lp-spin .8s linear infinite' }} />
        <style>{`@keyframes lp-spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  /* ── Error ── */
  if (error || !landing) {
    return (
      <div dir="rtl" lang="he" style={{ minHeight: '100vh', background: '#FDFCFA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Heebo", sans-serif', color: '#2C2926' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>העמוד לא נמצא</h1>
        <p style={{ color: '#6B655C' }}>ייתכן שהעמוד הוסר או שהכתובת שגויה</p>
      </div>
    );
  }

  /* ── Derive rendering data ── */
  const org = landing.organization;
  const sections = landing.sections.filter((s) => s.visible).sort((a, b) => a.position - b.position);
  const sectionTypes = new Set(sections.map((s) => s.type));

  const navLinks = Object.entries(NAV_ANCHORS)
    .filter(([type]) => sectionTypes.has(type))
    .map(([, v]) => v);

  /* ── Render section by type ── */
  const renderSection = (section: SectionRow) => {
    switch (section.type) {
      case 'hero': return <HeroSection key={section.id} data={section.data} />;
      case 'marquee': return <MarqueeSection key={section.id} data={section.data} />;
      case 'video': return <VideoSection key={section.id} data={section.data} />;
      case 'about': return <AboutSection key={section.id} data={section.data} />;
      case 'activities': return <ActivitiesSection key={section.id} data={section.data} />;
      case 'gallery': return <GallerySection key={section.id} data={section.data} />;
      case 'reviews': return <ReviewsSection key={section.id} data={section.data} />;
      case 'stats': return <StatsSection key={section.id} data={section.data} />;
      case 'cta_payment': return <GrowDonateSection key={section.id} data={section.data} org={org} slug={slug} referralCode={referralCode} />;
      case 'join_us': return <JoinUsSection key={section.id} data={section.data} slug={slug} />;
      case 'faq': return <FaqSection key={section.id} data={section.data} />;
      case 'footer': return <FooterSection key={section.id} data={section.data} org={org} />;
      default: return null;
    }
  };

  return (
    <div className="lp-landing" dir="rtl" lang="he" ref={wrapperRef}>
      {/* ═══ NAV ═══ */}
      <motion.nav
        className={`nav${scrolled ? ' scrolled' : ''}`}
        id="nav"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: easeOutExpo }}
      >
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
              <motion.a
                key={l.href}
                href={l.href}
                whileHover={{ opacity: 0.7 }}
                transition={{ duration: 0.2 }}
              >
                {l.he}
              </motion.a>
            ))}
          </div>
        )}
        <div className="nav-actions">
          <div className="nav-socials">
            {org.facebookUrl && (
              <motion.a href={org.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook" whileHover={{ scale: 1.15 }} transition={{ duration: 0.2 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </motion.a>
            )}
            {org.instagramUrl && (
              <motion.a href={org.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" whileHover={{ scale: 1.15 }} transition={{ duration: 0.2 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </motion.a>
            )}
            {org.whatsappUrl && (
              <motion.a href={org.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" whileHover={{ scale: 1.15 }} transition={{ duration: 0.2 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              </motion.a>
            )}
            {org.websiteUrl && (
              <motion.a href={org.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label="Website" whileHover={{ scale: 1.15 }} transition={{ duration: 0.2 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
              </motion.a>
            )}
          </div>
          <motion.a
            href="#donate"
            className="btn btn-primary"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <span>תרמו</span>
          </motion.a>
        </div>
      </motion.nav>

      {/* ═══ SECTIONS — rendered in admin-set order ═══ */}
      {sections.map(renderSection)}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   HERO
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function HeroSection({ data }: { data: Record<string, any> }) {
  const headline = (data.headline as string) || '';
  if (!headline) return null;
  const words = headline.split(/\s+/).filter(Boolean);
  const accentIndex = typeof data.accent_word_index === 'number' ? data.accent_word_index : 2;
  const pillText = (data.pill_text as string) || '';
  const sinceText = (data.since_text as string) || '';
  const subheadline = (data.subheadline as string) || '';
  const ctaLabel = (data.cta_label as string) || '';
  const secondaryCtaLabel = (data.secondary_cta_label as string) || '';
  const stats = (data.stats as Array<{ value: string; label: string }>) || [];

  return (
    <header className="hero" id="top">
      <div className="hero-bg" aria-hidden="true">
        <motion.div className="blob blob-1" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, ease: 'easeOut' }} />
        <motion.div className="blob blob-2" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 0.2, ease: 'easeOut' }} />
        <motion.div className="blob blob-3" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }} />
      </div>
      <motion.div
        className="hero-inner"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {(pillText || sinceText) && (
          <motion.div className="hero-meta" variants={fadeUp} transition={defaultTransition}>
            {pillText && (
              <span className="hero-pill">
                <span className="dot" />
                <span>{pillText}</span>
              </span>
            )}
            {sinceText && <span className="since">{sinceText}</span>}
          </motion.div>
        )}
        <motion.h1 variants={fadeUp} transition={{ ...defaultTransition, duration: 0.8 }}>
          {words.map((word, i) => (
            <span key={i} className={`word${i === accentIndex ? ' accent' : ''}`}>
              {word}{'\u00A0'}
            </span>
          ))}
        </motion.h1>
        {subheadline && <motion.p className="hero-sub" variants={fadeUp} transition={defaultTransition}>{subheadline}</motion.p>}
        {stats.length > 0 && (
          <motion.div className="hero-stats" variants={fadeUp} transition={defaultTransition}>
            {stats.map((s, i) => (
              <div key={i} className="hero-stat">
                <div className="n" data-num={s.value}>{s.value}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </motion.div>
        )}
        {(ctaLabel || secondaryCtaLabel) && (
          <motion.div className="hero-cta" variants={fadeUp} transition={defaultTransition}>
            {ctaLabel && (
              <motion.a
                href="#donate"
                className="btn btn-primary btn-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <span>{ctaLabel}</span>
              </motion.a>
            )}
            {secondaryCtaLabel && (
              <motion.a
                href="#story"
                className="btn btn-ghost btn-lg"
                whileHover={{ x: -4 }}
                transition={{ duration: 0.2 }}
              >
                {secondaryCtaLabel} <span className="arrow">←</span>
              </motion.a>
            )}
          </motion.div>
        )}
      </motion.div>
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MARQUEE
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MarqueeSection({ data }: { data: Record<string, any> }) {
  const items = (data.items as string[]) || [];
  if (items.length === 0) return null;
  const doubled = [...items, ...items];

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((item, i) => (
          <span key={i}>{item}</span>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   VIDEO / STORY
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function VideoSection({ data }: { data: Record<string, any> }) {
  const eyebrow = (data.eyebrow as string) || '';
  const title = (data.title as string) || '';
  const source = (data.source as string) || '';

  return (
    <section className="section" id="story">
      <div className="container">
        {eyebrow && <motion.div className="eyebrow" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>{eyebrow}</motion.div>}
        {title && <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>{title}</motion.h2>}
        <motion.div className="video-wrap" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>
          {source ? (
            <div className="video-frame" tabIndex={0} role="button" aria-label="Play video">
              <iframe
                src={source}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div className="video-frame imgslot" tabIndex={0} role="button" aria-label="Play video">
              <span style={{ position: 'absolute', top: 20, right: 20, color: 'rgba(245,240,230,0.5)' }}>video &middot; 16:9</span>
              <div className="video-play">
                <div className="core">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ABOUT
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function AboutSection({ data }: { data: Record<string, any> }) {
  const eyebrow = (data.eyebrow as string) || '';
  const title = (data.title as string) || '';
  const bodyRichText = (data.body_rich_text as string) || '';
  const badgeText = (data.badge_text as string) || '';
  const imageUrl = (data.image_url as string) || '';

  return (
    <section className="section about" id="about">
      <div className="container about-grid">
        <motion.div className="about-text" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {title && <h2>{title}</h2>}
          {bodyRichText && <div dangerouslySetInnerHTML={{ __html: bodyRichText }} />}
        </motion.div>
        <motion.div className="about-visual" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: 0.1 }}>
          <div className="layer-color" />
          {imageUrl ? (
            <img src={imageUrl} alt="" className="layer-img" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="layer-img imgslot">about &middot; 4:5</div>
          )}
          {badgeText && <motion.div className="badge" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: 0.2 }}>{badgeText}</motion.div>}
        </motion.div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   ACTIVITIES
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ActivitiesSection({ data }: { data: Record<string, any> }) {
  const eyebrow = (data.eyebrow as string) || '';
  const title = (data.title as string) || '';
  const items = (data.items as Array<{ title: string; description: string; image_url?: string }>) || [];

  return (
    <section className="section activities" id="activities">
      <div className="container">
        <div className="section-head">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2>{title}</h2>}
          </motion.div>
        </div>
        <div className="activities-grid">
          {items.map((item, i) => (
            <motion.article
              key={i}
              className="activity"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={vp}
              transition={{ ...defaultTransition, delay: i * 0.1 }}
            >
              <div className="activity-img">
                {item.image_url ? (
                  <img src={item.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div className="imgslot">{`activity ${i + 1}`}</div>
                )}
                <div className="activity-num">{String(i + 1).padStart(2, '0')}</div>
              </div>
              <div className="activity-body">
                {item.title && <h3>{item.title}</h3>}
                {item.description && <p>{item.description}</p>}
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   GALLERY
   ═══════════════════════════════════════════════════════════════════════════ */

const GALLERY_HEIGHTS = [220, 300, 180, 260, 240, 320, 200, 280, 220, 260, 300, 190];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GallerySection({ data }: { data: Record<string, any> }) {
  const eyebrow = (data.eyebrow as string) || '';
  const title = (data.title as string) || '';
  const images = (data.images as Array<{ url: string; alt?: string }>) || [];

  return (
    <section className="section gallery" id="gallery">
      <div className="container">
        <div className="section-head">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2>{title}</h2>}
          </motion.div>
        </div>
        <div className="gallery-grid">
          {images.length > 0
            ? images.map((img, i) => (
                <motion.div
                  key={i}
                  style={{ height: GALLERY_HEIGHTS[i % GALLERY_HEIGHTS.length] }}
                  variants={fadeIn}
                  initial="hidden"
                  whileInView="visible"
                  viewport={vp}
                  transition={{ ...defaultTransition, delay: i * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                >
                  <img src={img.url} alt={img.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                </motion.div>
              ))
            : GALLERY_HEIGHTS.map((h, i) => (
                <motion.div key={i} style={{ height: h }} variants={fadeIn} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: i * 0.1 }} />
              ))
          }
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEWS
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ReviewsSection({ data }: { data: Record<string, any> }) {
  const eyebrow = (data.eyebrow as string) || '';
  const title = (data.title as string) || '';
  const ctaText = (data.cta_text as string) || '';
  const emptyText = (data.empty_text as string) || '';
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Fetch reviews from org's reviews (they come from the API through a different endpoint)
  // For now, use static placeholder reviews that match the prototype
  // The reviews data could also contain inline items
  const items = (data.items as Array<{ name: string; text: string; rating: number }>) || [];

  const count = items.length;

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (count <= 1) return;
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % count);
    }, 6000);
  }, [count]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (count <= 1) return;
      if (e.key === 'ArrowLeft') { setActiveIdx((p) => (p + 1) % count); startTimer(); }
      if (e.key === 'ArrowRight') { setActiveIdx((p) => (p - 1 + count) % count); startTimer(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [count, startTimer]);

  const handleMouseEnter = () => { if (timerRef.current) clearInterval(timerRef.current); };
  const handleMouseLeave = () => { startTimer(); };

  return (
    <section className="section reviews">
      <div className="container">
        {eyebrow && <motion.div className="eyebrow" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>{eyebrow}</motion.div>}
        {title && <motion.h2 variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>{title}</motion.h2>}
        {items.length === 0 && emptyText && <motion.p variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition} style={{ marginTop: 24, color: 'var(--text-muted)' }}>{emptyText}</motion.p>}
        {items.length > 0 && (
          <>
            {/* Desktop: grid of all reviews */}
            <div className="reviews-grid reviews-desktop" ref={trackRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              {items.map((item, i) => (
                <motion.article
                  key={i}
                  className="review"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={vp}
                  transition={{ ...defaultTransition, delay: i * 0.1 }}
                  whileHover={{ y: -4, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}
                >
                  <div className="stars" aria-label={`${item.rating || 5} of 5 stars`}>
                    {Array.from({ length: item.rating || 5 }).map((_, j) => <StarSvg key={j} />)}
                  </div>
                  <p>&ldquo;{item.text}&rdquo;</p>
                  <div className="review-name">— {item.name}</div>
                </motion.article>
              ))}
            </div>
            {/* Mobile: carousel */}
            <div className="reviews-carousel reviews-mobile" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              {items.map((item, i) => (
                <motion.article
                  key={i}
                  className={`review${i === activeIdx ? ' active' : ''}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: i === activeIdx ? 1 : 0, x: i === activeIdx ? 0 : 20 }}
                  transition={{ duration: 0.4, ease: easeOutExpo }}
                >
                  <div className="stars" aria-label={`${item.rating || 5} of 5 stars`}>
                    {Array.from({ length: item.rating || 5 }).map((_, j) => <StarSvg key={j} />)}
                  </div>
                  <p>&ldquo;{item.text}&rdquo;</p>
                  <div className="review-name">— {item.name}</div>
                </motion.article>
              ))}
              {count > 1 && (
                <div className="reviews-dots">
                  {items.map((_, i) => (
                    <button
                      key={i}
                      className={`reviews-dot${i === activeIdx ? ' active' : ''}`}
                      onClick={() => { setActiveIdx(i); startTimer(); }}
                      aria-label={`Review ${i + 1}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
        {ctaText && (
          <motion.div className="reviews-cta" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>
            <motion.button className="btn btn-secondary" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}><span>{ctaText} +</span></motion.button>
          </motion.div>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STATS
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function StatsSection({ data }: { data: Record<string, any> }) {
  const eyebrow = (data.eyebrow as string) || '';
  const items = (data.items as Array<{ value: string; label: string }>) || [];
  if (items.length === 0) return null;

  return (
    <section className="section stats">
      <div className="container">
        {eyebrow && <motion.div className="eyebrow" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition} style={{ color: 'var(--ink)' }}>{eyebrow}</motion.div>}
        <div className="stats-grid">
          {items.map((item, i) => (
            <motion.div key={i} className="stat" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: i * 0.1 }}>
              <div className="stat-num" data-num={item.value}>{item.value}</div>
              <div className="stat-lbl">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   JOIN US / CONTACT
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function JoinUsSection({ data, slug }: { data: Record<string, any>; slug: string }) {
  const eyebrow = (data.eyebrow as string) || '';
  const headline = (data.headline as string) || '';
  const body = (data.body as string) || '';
  const submitLabel = (data.submit_label as string) || 'שלחו →';
  const successTitle = (data.success_title as string) || 'קיבלנו. תודה רבה.';
  const successMessage = (data.success_message as string) || 'נחזור אליכם תוך מספר ימים.';

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: (formData.get('phone') as string) || undefined,
      message: (formData.get('message') as string) || undefined,
    };
    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
      await fetch(`${apiBase}/public/landing/${slug}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } catch {
      // silently accept — the form success is shown regardless
    }
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <section className="section join" id="contact">
      <div className="container join-grid">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {headline && <h2>{headline}</h2>}
          {body && <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.65, maxWidth: 480, color: 'var(--text)' }}>{body}</p>}
        </motion.div>
        <motion.form className="form-card" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: 0.1 }} onSubmit={handleSubmit}>
          {!submitted ? (
            <div>
              <div className="field"><label>שם</label><input required type="text" name="name" autoComplete="name" /></div>
              <div className="field"><label>אימייל</label><input required type="email" name="email" autoComplete="email" /></div>
              <div className="field"><label>טלפון (לא חובה)</label><input type="tel" name="phone" autoComplete="tel" /></div>
              <div className="field"><label>הודעה (לא חובה)</label><textarea rows={3} name="message" /></div>
              <motion.button
                type="submit"
                className="btn btn-lg btn-block"
                disabled={submitting}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <span>{submitting ? 'שולח...' : submitLabel}</span>
              </motion.button>
            </div>
          ) : (
            <motion.div className="form-success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: easeOutExpo }}>
              <div className="check-circle">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 10, color: 'var(--paper)' }}>{successTitle}</h3>
              <div style={{ color: 'rgba(245,240,230,0.7)', fontSize: 15 }}>{successMessage}</div>
            </motion.div>
          )}
        </motion.form>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FAQ
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FaqSection({ data }: { data: Record<string, any> }) {
  const eyebrow = (data.eyebrow as string) || '';
  const title = (data.title as string) || '';
  const items = (data.items as Array<{ question: string; answer: string }>) || [];
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  if (items.length === 0) return null;

  return (
    <section className="section faq">
      <div className="container faq-grid">
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {title && <h2>{title}</h2>}
        </motion.div>
        <div className="faq-list">
          {items.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <motion.div key={i} className="faq-item" data-open={isOpen ? 'true' : 'false'} variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: i * 0.1 }}>
                <button
                  className="faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                >
                  <span>{item.question}</span>
                  <span className="chev" />
                </button>
                <motion.div
                  className="faq-a"
                  initial={false}
                  animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                  transition={{ duration: 0.35, ease: easeOutExpo }}
                  style={{ overflow: 'hidden' }}
                >
                  <div><p>{item.answer}</p></div>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════════ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function FooterSection({ data, org }: { data: Record<string, any>; org: OrgData }) {
  const bigText = (data.big_text as string) || '';
  const bigAccent = (data.big_accent as string) || '';
  const about = (data.about as string) || '';
  const visitLabel = (data.visit_label as string) || 'ביקור';
  const contactLabel = (data.contact_label as string) || 'יצירת קשר';
  const followLabel = (data.follow_label as string) || 'עקבו';
  const hours = (data.hours as string) || '';
  const registrationNumber = (data.registration_number as string) || '';
  const section46 = data.section_46 as boolean;

  const socials: { label: string; url: string }[] = [];
  if (org.instagramUrl) socials.push({ label: 'Instagram', url: org.instagramUrl });
  if (org.facebookUrl) socials.push({ label: 'Facebook', url: org.facebookUrl });
  if (org.youtubeUrl) socials.push({ label: 'YouTube', url: org.youtubeUrl });
  if (org.whatsappUrl) socials.push({ label: 'WhatsApp', url: org.whatsappUrl });

  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      {(bigText || bigAccent) && (
        <motion.div className="footer-big" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>
          {bigText && <span>{bigText}</span>}
          {bigAccent && <>{' '}<span className="accent">{bigAccent}</span></>}
        </motion.div>
      )}
      <motion.div className="footer-grid" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: 0.1 }}>
        <div>
          <div className="footer-brand">
            {org.logoUrl
              ? <img src={org.logoUrl} alt="" style={{ width: 30, height: 30, borderRadius: 10, objectFit: 'cover' }} />
              : <div className="brand-mark" />
            }
            <div className="brand-name">{org.name}</div>
          </div>
          {about && <div className="footer-tag">{about}</div>}
        </div>
        {(org.address || hours) && (
          <div className="footer-col">
            <h4>{visitLabel}</h4>
            {org.address && <div>{org.address}</div>}
            {hours && <div>{hours}</div>}
          </div>
        )}
        {(org.contactEmail || org.contactPhone) && (
          <div className="footer-col">
            <h4>{contactLabel}</h4>
            {org.contactEmail && <a href={`mailto:${org.contactEmail}`}>{org.contactEmail}</a>}
            {org.contactPhone && <a href={`tel:${org.contactPhone}`}>{org.contactPhone}</a>}
          </div>
        )}
        {socials.length > 0 && (
          <div className="footer-col">
            <h4>{followLabel}</h4>
            {socials.map((s) => <a key={s.label} href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a>)}
          </div>
        )}
      </motion.div>
      <div className="footer-legal">
        <div>
          &copy; {year} {org.legalName || org.name}
          {registrationNumber && <> &middot; {registrationNumber}</>}
          {section46 && <> &middot; אישור סעיף 46</>}
        </div>
        <div>נבנה עם עמותות</div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Grow Wallet SDK — Donate Section
   ═══════════════════════════════════════════════════════════════════════════ */

function GrowDonateSection({
  data,
  org,
  slug,
  referralCode,
}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  org: OrgData;
  slug: string;
  referralCode?: string | null;
}) {
  const eyebrow = (data.eyebrow as string) || 'תרמו עכשיו';
  const headlineRaw = (data.headline as string) || 'כל שקל, *ישר לעבודה.*';
  const subheadlineText = (data.subheadline as string) || '';
  const amounts = (data.amounts as number[]) || [100, 250, 500, 1000];
  const defaultIdx = (data.default_amount_index as number) ?? 2;
  const defaultAmount = amounts[defaultIdx] ?? amounts[0] ?? 100;
  const ctaLabel = (data.cta_label as string) || 'תרמו';
  const secureLabel = (data.secure_label as string) || 'סליקה מאובטחת';
  const installmentsLabel = (data.installments_label as string) || 'עד 12 תשלומים';
  const receiptLabel = (data.receipt_label as string) || 'קבלה לפי סעיף 46';

  const [selected, setSelected] = useState<number | null>(defaultAmount);
  const [customAmount, setCustomAmount] = useState('');
  const [walletState, setWalletState] = useState<'idle' | 'loading' | 'open' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const sdkInitRef = useRef(false);
  const sdkLoadedRef = useRef(false);

  const hasGrowWallet = !!org.hasGrowWallet;

  // Load Grow SDK script
  useEffect(() => {
    if (!hasGrowWallet || sdkLoadedRef.current) return;
    if (window.growPayment) { sdkLoadedRef.current = true; return; }
    sdkLoadedRef.current = true;
    const s = document.createElement('script');
    s.async = true;
    s.src = 'https://cdn.meshulam.co.il/sdk/gs.min.js';
    s.onload = () => initSdk();
    document.head.appendChild(s);
  }, [hasGrowWallet]); // eslint-disable-line react-hooks/exhaustive-deps

  // Init SDK
  function initSdk() {
    if (sdkInitRef.current || !window.growPayment) return;
    sdkInitRef.current = true;

    const isProd = typeof window !== 'undefined' && window.location.hostname !== 'localhost';
    window.growPayment.init({
      environment: isProd ? 'PRODUCTION' : 'DEV',
      version: 1,
      events: {
        onSuccess: () => setWalletState('success'),
        onFailure: (r: { message?: string }) => {
          setWalletState('error');
          setErrorMsg(r?.message || 'התשלום נכשל');
        },
        onError: (r: { message?: string }) => {
          setWalletState('error');
          setErrorMsg(r?.message || 'שגיאה בתהליך התשלום');
        },
        onTimeout: () => {
          setWalletState('error');
          setErrorMsg('פג תוקף התשלום. נסו שנית.');
        },
        onWalletChange: (state: string) => {
          if (state === 'open') setWalletState('open');
          if (state === 'close' || state === 'Close') {
            setWalletState((prev) => (prev === 'success' ? 'success' : 'idle'));
          }
        },
        onPaymentStart: () => {},
        onPaymentCancel: () => setWalletState('idle'),
      },
    });
  }

  // Also init if SDK was already loaded before component mounted
  useEffect(() => {
    if (hasGrowWallet && window.growPayment && !sdkInitRef.current) initSdk();
  }, [hasGrowWallet]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDonate() {
    const amount = selected ?? (customAmount ? parseInt(customAmount, 10) : 0);
    if (!amount || amount < 1) return;

    // Grow Wallet SDK flow
    if (hasGrowWallet && window.growPayment) {
      setWalletState('loading');
      setErrorMsg('');
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
        const res = await fetch(`${apiBase}/public/landing/${slug}/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sum: amount, ...(referralCode ? { referralCode } : {}) }),
        });
        const json = await res.json();
        if (!res.ok || !json.data?.authCode) {
          throw new Error(json.message || 'שגיאה ביצירת תהליך תשלום');
        }
        window.growPayment.renderPaymentOptions(json.data.authCode);
      } catch (err) {
        setWalletState('error');
        setErrorMsg(err instanceof Error ? err.message : 'שגיאה בתהליך התשלום');
      }
      return;
    }

    // Fallback: open paymentLink in new tab
    const url = org.paymentLink || '#';
    window.open(amount ? `${url}?amount=${amount}` : url, '_blank');
  }

  // Parse headline: *text* → bold accent
  const headlineParts = headlineRaw.split(/\*(.*?)\*/);

  return (
    <section className="cta-section" id="donate">
      <div className="cta-inner">
        <motion.div className="cta-eyebrow" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={defaultTransition}>{eyebrow}</motion.div>

        <motion.h2 className="cta-headline" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: 0.1 }}>
          {headlineParts.map((part, i) =>
            i % 2 === 1
              ? <span key={i} className="accent">{part}</span>
              : <span key={i}>{part}</span>
          )}
        </motion.h2>

        {subheadlineText && <motion.p className="cta-sub" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: 0.2 }}>{subheadlineText}</motion.p>}

        {walletState === 'success' ? (
          <motion.div className="cta-success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: easeOutExpo }}>
            <div className="cta-success-icon">✓</div>
            <p className="cta-success-title">תודה רבה על תרומתכם!</p>
            <p className="cta-success-msg">התרומה התקבלה בהצלחה.</p>
            <motion.button className="btn btn-primary" onClick={() => setWalletState('idle')} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} transition={{ duration: 0.2 }}>
              <span>תרומה נוספת</span>
            </motion.button>
          </motion.div>
        ) : (
          <>
            {/* Amount chips */}
            <motion.div className="cta-chips" role="radiogroup" aria-label="סכום תרומה" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: 0.3 }}>
              {amounts.map((amt) => (
                <motion.button
                  key={amt}
                  className={`chip${selected === amt ? ' active' : ''}`}
                  role="radio"
                  aria-checked={selected === amt}
                  onClick={() => { setSelected(amt); setCustomAmount(''); }}
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  ₪{amt.toLocaleString()}
                </motion.button>
              ))}
              {data.allow_custom !== false && (
                <motion.button
                  className={`chip${selected === null ? ' active' : ''}`}
                  role="radio"
                  aria-checked={selected === null}
                  onClick={() => setSelected(null)}
                  whileHover={{ scale: 1.07 }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                >
                  אחר
                </motion.button>
              )}
            </motion.div>

            {/* Custom amount input */}
            {selected === null && (
              <motion.div className="cta-custom" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: 0.3, ease: easeOutExpo }}>
                <span className="cta-custom-prefix">₪</span>
                <input
                  type="number"
                  min="1"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="הזינו סכום"
                  className="cta-custom-input"
                  dir="ltr"
                  autoFocus
                />
              </motion.div>
            )}

            {/* Error message */}
            {walletState === 'error' && errorMsg && (
              <motion.div className="cta-error" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>{errorMsg}</motion.div>
            )}

            {/* Donate button */}
            <motion.div className="cta-go" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: 0.4 }}>
              <motion.button
                className="btn btn-primary btn-lg cta-donate-btn"
                onClick={handleDonate}
                disabled={walletState === 'loading' || walletState === 'open'}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                <span>
                  {walletState === 'loading'
                    ? 'טוען...'
                    : walletState === 'open'
                      ? 'מחכה לתשלום...'
                      : `${ctaLabel}${selected ? ` ₪${selected.toLocaleString()}` : customAmount ? ` ₪${customAmount}` : ''} →`}
                </span>
              </motion.button>
            </motion.div>

            {/* Trust badges */}
            <motion.div className="cta-trust" variants={fadeUp} initial="hidden" whileInView="visible" viewport={vp} transition={{ ...defaultTransition, delay: 0.5 }}>
              <span>🔒 {secureLabel}</span>
              <span className="trust-dot">·</span>
              {data.installments_hint !== false && <><span>{installmentsLabel}</span><span className="trust-dot">·</span></>}
              {data.receipt_hint !== false && <span>{receiptLabel}</span>}
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
}
