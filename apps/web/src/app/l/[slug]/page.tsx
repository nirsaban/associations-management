'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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

  /* ── Entrance reveal observer ── */
  useEffect(() => {
    if (!landing) return;
    if (typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.remove('pending');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    requestAnimationFrame(() => {
      const wrapper = wrapperRef.current;
      if (!wrapper) return;
      wrapper.querySelectorAll('.reveal').forEach((el) => {
        el.classList.add('pending');
        obs.observe(el);
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
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <div className="hero-inner">
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
        <h1>
          {words.map((word, i) => (
            <span key={i} className={`word${i === accentIndex ? ' accent' : ''}`}>
              {word}{'\u00A0'}
            </span>
          ))}
        </h1>
        {subheadline && <p className="hero-sub">{subheadline}</p>}
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
      </div>
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
        {eyebrow && <div className="eyebrow reveal">{eyebrow}</div>}
        {title && <h2 className="reveal">{title}</h2>}
        <div className="video-wrap reveal">
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
        </div>
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
        <div className="about-text reveal">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {title && <h2>{title}</h2>}
          {bodyRichText && <div dangerouslySetInnerHTML={{ __html: bodyRichText }} />}
        </div>
        <div className="about-visual reveal">
          <div className="layer-color" />
          {imageUrl ? (
            <img src={imageUrl} alt="" className="layer-img" style={{ objectFit: 'cover' }} />
          ) : (
            <div className="layer-img imgslot">about &middot; 4:5</div>
          )}
          {badgeText && <div className="badge">{badgeText}</div>}
        </div>
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
          <div className="reveal">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2>{title}</h2>}
          </div>
        </div>
        <div className="activities-grid">
          {items.map((item, i) => (
            <article key={i} className="activity reveal">
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
            </article>
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
          <div className="reveal">
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            {title && <h2>{title}</h2>}
          </div>
        </div>
        <div className="gallery-grid">
          {images.length > 0
            ? images.map((img, i) => (
                <div key={i} className="reveal" style={{ height: GALLERY_HEIGHTS[i % GALLERY_HEIGHTS.length] }}>
                  <img src={img.url} alt={img.alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }} />
                </div>
              ))
            : GALLERY_HEIGHTS.map((h, i) => (
                <div key={i} className="reveal" style={{ height: h }} />
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
        {eyebrow && <div className="eyebrow reveal">{eyebrow}</div>}
        {title && <h2 className="reveal">{title}</h2>}
        {items.length === 0 && emptyText && <p className="reveal" style={{ marginTop: 24, color: 'var(--text-muted)' }}>{emptyText}</p>}
        {items.length > 0 && (
          <>
            {/* Desktop: grid of all reviews */}
            <div className="reviews-grid reviews-desktop" ref={trackRef} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              {items.map((item, i) => (
                <article key={i} className="review reveal">
                  <div className="stars" aria-label={`${item.rating || 5} of 5 stars`}>
                    {Array.from({ length: item.rating || 5 }).map((_, j) => <StarSvg key={j} />)}
                  </div>
                  <p>&ldquo;{item.text}&rdquo;</p>
                  <div className="review-name">— {item.name}</div>
                </article>
              ))}
            </div>
            {/* Mobile: carousel */}
            <div className="reviews-carousel reviews-mobile" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
              {items.map((item, i) => (
                <article key={i} className={`review reveal${i === activeIdx ? ' active' : ''}`}>
                  <div className="stars" aria-label={`${item.rating || 5} of 5 stars`}>
                    {Array.from({ length: item.rating || 5 }).map((_, j) => <StarSvg key={j} />)}
                  </div>
                  <p>&ldquo;{item.text}&rdquo;</p>
                  <div className="review-name">— {item.name}</div>
                </article>
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
          <div className="reviews-cta reveal">
            <button className="btn btn-secondary"><span>{ctaText} +</span></button>
          </div>
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
        {eyebrow && <div className="eyebrow reveal" style={{ color: 'var(--ink)' }}>{eyebrow}</div>}
        <div className="stats-grid">
          {items.map((item, i) => (
            <div key={i} className="stat reveal">
              <div className="stat-num" data-num={item.value}>{item.value}</div>
              <div className="stat-lbl">{item.label}</div>
            </div>
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
        <div className="reveal">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {headline && <h2>{headline}</h2>}
          {body && <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.65, maxWidth: 480, color: 'var(--text)' }}>{body}</p>}
        </div>
        <form className="form-card reveal" onSubmit={handleSubmit}>
          {!submitted ? (
            <div>
              <div className="field"><label>שם</label><input required type="text" name="name" autoComplete="name" /></div>
              <div className="field"><label>אימייל</label><input required type="email" name="email" autoComplete="email" /></div>
              <div className="field"><label>טלפון (לא חובה)</label><input type="tel" name="phone" autoComplete="tel" /></div>
              <div className="field"><label>הודעה (לא חובה)</label><textarea rows={3} name="message" /></div>
              <button type="submit" className="btn btn-lg btn-block" disabled={submitting}>
                <span>{submitting ? 'שולח...' : submitLabel}</span>
              </button>
            </div>
          ) : (
            <div className="form-success">
              <div className="check-circle">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
              </div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 10, color: 'var(--paper)' }}>{successTitle}</h3>
              <div style={{ color: 'rgba(245,240,230,0.7)', fontSize: 15 }}>{successMessage}</div>
            </div>
          )}
        </form>
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
        <div className="reveal">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          {title && <h2>{title}</h2>}
        </div>
        <div className="faq-list">
          {items.map((item, i) => {
            const isOpen = openIdx === i;
            return (
              <div key={i} className="faq-item reveal" data-open={isOpen ? 'true' : 'false'}>
                <button
                  className="faq-q"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIdx(isOpen ? null : i)}
                >
                  <span>{item.question}</span>
                  <span className="chev" />
                </button>
                <div className="faq-a">
                  <div><p>{item.answer}</p></div>
                </div>
              </div>
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
        <div className="footer-big">
          {bigText && <span>{bigText}</span>}
          {bigAccent && <>{' '}<span className="accent">{bigAccent}</span></>}
        </div>
      )}
      <div className="footer-grid">
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
      </div>
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
        <div className="cta-eyebrow">{eyebrow}</div>

        <h2 className="cta-headline">
          {headlineParts.map((part, i) =>
            i % 2 === 1
              ? <span key={i} className="accent">{part}</span>
              : <span key={i}>{part}</span>
          )}
        </h2>

        {subheadlineText && <p className="cta-sub">{subheadlineText}</p>}

        {walletState === 'success' ? (
          <div className="cta-success">
            <div className="cta-success-icon">✓</div>
            <p className="cta-success-title">תודה רבה על תרומתכם!</p>
            <p className="cta-success-msg">התרומה התקבלה בהצלחה.</p>
            <button className="btn btn-primary" onClick={() => setWalletState('idle')}>
              <span>תרומה נוספת</span>
            </button>
          </div>
        ) : (
          <>
            {/* Amount chips */}
            <div className="cta-chips" role="radiogroup" aria-label="סכום תרומה">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  className={`chip${selected === amt ? ' active' : ''}`}
                  role="radio"
                  aria-checked={selected === amt}
                  onClick={() => { setSelected(amt); setCustomAmount(''); }}
                >
                  ₪{amt.toLocaleString()}
                </button>
              ))}
              {data.allow_custom !== false && (
                <button
                  className={`chip${selected === null ? ' active' : ''}`}
                  role="radio"
                  aria-checked={selected === null}
                  onClick={() => setSelected(null)}
                >
                  אחר
                </button>
              )}
            </div>

            {/* Custom amount input */}
            {selected === null && (
              <div className="cta-custom">
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
              </div>
            )}

            {/* Error message */}
            {walletState === 'error' && errorMsg && (
              <div className="cta-error">{errorMsg}</div>
            )}

            {/* Donate button */}
            <div className="cta-go">
              <button
                className="btn btn-primary btn-lg cta-donate-btn"
                onClick={handleDonate}
                disabled={walletState === 'loading' || walletState === 'open'}
              >
                <span>
                  {walletState === 'loading'
                    ? 'טוען...'
                    : walletState === 'open'
                      ? 'מחכה לתשלום...'
                      : `${ctaLabel}${selected ? ` ₪${selected.toLocaleString()}` : customAmount ? ` ₪${customAmount}` : ''} →`}
                </span>
              </button>
            </div>

            {/* Trust badges */}
            <div className="cta-trust">
              <span>🔒 {secureLabel}</span>
              <span className="trust-dot">·</span>
              {data.installments_hint !== false && <><span>{installmentsLabel}</span><span className="trust-dot">·</span></>}
              {data.receipt_hint !== false && <span>{receiptLabel}</span>}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
