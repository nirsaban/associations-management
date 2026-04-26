'use client';

import { useEffect, useRef, useState } from 'react';

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface SectionData {
  [key: string]: unknown;
}

interface OrgData {
  name: string;
  legalName?: string;
  paymentLink?: string;
  hasGrowWallet?: boolean;
  contactPhone?: string;
  contactEmail?: string;
  address?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  whatsappUrl?: string;
  websiteUrl?: string;
  logoUrl?: string;
  youtubeUrl?: string;
}

interface SectionProps {
  data: SectionData;
  org: OrgData;
  primaryColor: string;
  accentColor: string;
  slug: string;
}

/* ─── Star SVG ───────────────────────────────────────────────────────────── */
function StarIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    >
      <path d="M12 3l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 17l-5.6 3.2 1.5-6.3L3 9.6l6.4-.6L12 3z" />
    </svg>
  );
}

/* ─── Count-up hook ──────────────────────────────────────────────────────── */
function useCountUp(ref: React.RefObject<HTMLElement | null>, target: string) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const m = target.match(/^([\d,]+)(.*)$/);
    if (!m) return;

    const final = parseInt(m[1].replace(/,/g, ''), 10);
    const suffix = m[2];
    const dur = 1400;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          observer.unobserve(e.target);
          const start = performance.now();
          const tick = (t: number) => {
            const p = Math.min(1, (t - start) / dur);
            const eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(final * eased).toLocaleString() + suffix;
            if (p < 1) requestAnimationFrame(tick);
          };
          el.textContent = '0' + suffix;
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, target]);
}

/* ─── CountUpNumber component ────────────────────────────────────────────── */
function CountUpNumber({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useCountUp(ref as React.RefObject<HTMLElement | null>, value);
  return (
    <div className={className} data-num={value} ref={ref}>
      {value}
    </div>
  );
}

/* ─── 1. HeroSection ────────────────────────────────────────────────────── */
export function HeroSection({ data, org }: SectionProps) {
  const headline = (data.headline as string) || org.name || '';
  const words = headline.split(' ');
  const accentIndex =
    typeof data.accent_word_index === 'number' ? data.accent_word_index : -1;
  const subtext = (data.subtext as string) || (data.subheadline as string) || '';
  const pill = (data.pill as string) || (data.pill_text as string) || 'פעיל · קמפיין פתוח';
  const since = (data.since as string) || (data.since_text as string) || '';
  const ctaPrimary = (data.cta_primary as string) || (data.cta_label as string) || 'תרמו עכשיו →';
  const ctaGhost = (data.cta_ghost as string) || (data.secondary_cta_label as string) || '';
  const ctaGhostTarget = (data.secondary_cta_target as string) || '#story';
  const stats = (data.stats as Array<{ value: string; label: string }>) || [];

  return (
    <header className="hero" id="top">
      <div className="hero-bg" aria-hidden="true">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <div className="hero-inner">
        <div className="hero-meta">
          <span className="hero-pill">
            <span className="dot" />
            <span>{pill}</span>
          </span>
          {since && <span className="since">{since}</span>}
        </div>

        <h1>
          {words.map((word, i) => (
            <span
              key={i}
              className={`word${i === accentIndex ? ' accent' : ''}`}
            >
              {word}{i < words.length - 1 ? '\u00A0' : ''}
            </span>
          ))}
        </h1>

        {subtext && <p className="hero-sub">{subtext}</p>}

        <div className="hero-cta">
          <a href="#donate" className="btn btn-primary btn-lg">
            <span>{ctaPrimary}</span>
          </a>
          {ctaGhost && (
            <a href={ctaGhostTarget} className="btn btn-ghost btn-lg">
              {ctaGhost}
            </a>
          )}
        </div>

        {stats.length > 0 && (
          <div className="hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="hero-stat">
                <CountUpNumber value={s.value} className="n" />
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

/* ─── 2. MarqueeSection ─────────────────────────────────────────────────── */
export function MarqueeSection({ data }: SectionProps) {
  const items = (data.items as string[]) || [
    'חונכות',
    'מזון',
    'חינוך',
    'קהילה',
    'תקווה',
  ];
  const doubled = [...items, ...items];

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {doubled.map((text, i) => (
          <span key={i}>{text}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── 3. VideoSection ───────────────────────────────────────────────────── */
export function VideoSection({ data }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'הסיפור שלנו';
  const heading = (data.heading as string) || (data.title as string) || '';
  const src = (data.src as string) || (data.source as string) || '';

  function getEmbedUrl(url: string): string | null {
    if (!url) return null;
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
    const vi = url.match(/vimeo\.com\/(\d+)/);
    if (vi) return `https://player.vimeo.com/video/${vi[1]}?autoplay=1`;
    return null;
  }

  const [playing, setPlaying] = useState(false);
  const embedUrl = getEmbedUrl(src);

  return (
    <section className="section" id="story">
      <div className="container">
        <div className="eyebrow reveal">{eyebrow}</div>
        {heading && <h2 className="reveal">{heading}</h2>}
        <div className="video-wrap reveal">
          {playing && embedUrl ? (
            <div className="video-frame">
              <iframe
                src={embedUrl}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
                allow="autoplay; fullscreen"
                allowFullScreen
                title="וידאו"
              />
            </div>
          ) : (
            <div
              className="video-frame imgslot"
              tabIndex={0}
              role="button"
              aria-label="הפעל וידאו"
              onClick={() => setPlaying(true)}
              onKeyDown={(e) => e.key === 'Enter' && setPlaying(true)}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 20,
                  right: 20,
                  color: 'rgba(245,240,230,0.5)',
                }}
              >
                video · 16:9
              </span>
              <div className="video-play">
                <div className="core">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7L8 5z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── 4. AboutSection ───────────────────────────────────────────────────── */
export function AboutSection({ data, org }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'אודות';
  const heading = (data.heading as string) || (data.title as string) || '';
  const bodyRichText = (data.body_rich_text as string) || '';
  const imageUrl = (data.image_url as string) || (data.side_image as string) || '';
  const badge = (data.badge as string) || (data.badge_text as string) || '';

  return (
    <section className="section about" id="about">
      <div className="container about-grid">
        <div className="about-text reveal">
          <div className="eyebrow">{eyebrow}</div>
          {heading && <h2>{heading}</h2>}
          {bodyRichText && (
            <div
              dangerouslySetInnerHTML={{ __html: bodyRichText }}
            />
          )}
        </div>
        <div className="about-visual reveal">
          <div className="layer-color" />
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={org.name}
              className="layer-img"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="layer-img imgslot">about · 4:5</div>
          )}
          {badge && <div className="badge">{badge}</div>}
        </div>
      </div>
    </section>
  );
}

/* ─── 5. ActivitiesSection ──────────────────────────────────────────────── */
export function ActivitiesSection({ data }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'מה אנחנו עושים';
  const heading = (data.heading as string) || (data.title as string) || '';
  const activities =
    (data.activities as Array<{ title: string; description: string; imageUrl?: string }>) ||
    (data.items as Array<{ title: string; description: string; imageUrl?: string }>) ||
    [];

  return (
    <section className="section activities" id="activities">
      <div className="container">
        <div className="section-head">
          <div className="reveal">
            <div className="eyebrow">{eyebrow}</div>
            {heading && <h2>{heading}</h2>}
          </div>
        </div>
        <div className="activities-grid">
          {activities.map((act, i) => {
            const num = String(i + 1).padStart(2, '0');
            return (
              <article key={i} className="activity reveal">
                <div className="activity-img">
                  {act.imageUrl ? (
                    <img
                      src={act.imageUrl}
                      alt={act.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="imgslot">activity {i + 1}</div>
                  )}
                  <div className="activity-num">{num}</div>
                </div>
                <div className="activity-body">
                  <h3>{act.title}</h3>
                  <p>{act.description}</p>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── 6. GallerySection ─────────────────────────────────────────────────── */
export function GallerySection({ data }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'בתוך הרגע';
  const heading = (data.heading as string) || (data.title as string) || '';
  const images = (data.images as Array<{ url: string; alt?: string }>) || [];
  const heights = [220, 300, 180, 260, 240, 320, 200, 280, 220, 260, 300, 190];

  const slots = images.length > 0 ? images : heights.map(() => null);

  return (
    <section className="section gallery" id="gallery">
      <div className="container">
        <div className="section-head">
          <div className="reveal">
            <div className="eyebrow">{eyebrow}</div>
            {heading && <h2>{heading}</h2>}
          </div>
        </div>
        <div className="gallery-grid">
          {slots.map((img, i) => (
            <div
              key={i}
              className="reveal"
              style={{ height: img ? undefined : heights[i % heights.length] }}
            >
              {img && (
                <img
                  src={(img as { url: string; alt?: string }).url}
                  alt={(img as { url: string; alt?: string }).alt || ''}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 14 }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 7. ReviewsSection ─────────────────────────────────────────────────── */
export function ReviewsSection({ data }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'במילים שלהם';
  const heading = (data.heading as string) || (data.title as string) || 'הקהילה, על הקהילה.';
  const reviews =
    (data.reviews as Array<{ name: string; stars: number; quote: string }>) || [];

  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', quote: '', stars: 5, hp: '' });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.hp) return; // honeypot
    setSubmitted(true);
  }

  return (
    <section className="section reviews">
      <div className="container">
        <div className="eyebrow reveal">{eyebrow}</div>
        <h2 className="reveal">{heading}</h2>
        <div className="reviews-grid">
          {reviews.map((r, i) => (
            <article key={i} className="review reveal">
              <div className="stars" aria-label={`${r.stars} מתוך 5 כוכבים`}>
                {[0, 1, 2, 3, 4].map((s) => (
                  <StarIcon key={s} filled={s < r.stars} />
                ))}
              </div>
              <p>&ldquo;{r.quote}&rdquo;</p>
              <div className="review-name">— {r.name}</div>
            </article>
          ))}
        </div>

        <div className="reviews-cta reveal">
          {!showForm ? (
            <button
              className="btn btn-secondary"
              onClick={() => setShowForm(true)}
            >
              <span>השאירו ביקורת שלכם +</span>
            </button>
          ) : submitted ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
              תודה על הביקורת שלכם!
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{
                background: 'var(--paper)',
                borderRadius: 20,
                padding: 28,
                boxShadow: 'var(--shadow-sm)',
                maxWidth: 480,
                width: '100%',
              }}
            >
              {/* Honeypot */}
              <input
                type="text"
                name="website"
                value={form.hp}
                onChange={(e) => setForm({ ...form, hp: e.target.value })}
                style={{ display: 'none' }}
                tabIndex={-1}
                autoComplete="off"
              />
              <div className="field">
                <label>שם</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ background: 'var(--paper-2)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--ink)' }}
                />
              </div>
              <div className="field">
                <label>ביקורת</label>
                <textarea
                  required
                  rows={3}
                  value={form.quote}
                  onChange={(e) => setForm({ ...form, quote: e.target.value })}
                  style={{ background: 'var(--paper-2)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--ink)', resize: 'vertical', minHeight: 80 }}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block">
                <span>שלחו →</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

/* ─── 8. StatsSection ───────────────────────────────────────────────────── */
export function StatsSection({ data }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'במספרים';
  const stats =
    (data.stats as Array<{ value: string; label: string }>) ||
    (data.items as Array<{ value: string; label: string }>) ||
    [];

  return (
    <section className="section stats">
      <div className="container">
        <div className="eyebrow reveal" style={{ color: 'var(--ink)' }}>
          {eyebrow}
        </div>
        <div className="stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="stat reveal">
              <CountUpNumber value={s.value} className="stat-num" />
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Grow Wallet SDK loader ───────────────────────────────────────────── */
declare global {
  interface Window {
    growPayment?: {
      init: (config: Record<string, unknown>) => void;
      renderPaymentOptions: (authCode: string) => void;
    };
  }
}

function useGrowSdk() {
  const [ready, setReady] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || window.growPayment) {
      setReady(true);
      return;
    }
    loadedRef.current = true;
    const s = document.createElement('script');
    s.type = 'text/javascript';
    s.async = true;
    s.src = 'https://cdn.meshulam.co.il/sdk/gs.min.js';
    s.onload = () => setReady(true);
    document.head.appendChild(s);
  }, []);

  return ready;
}

/* ─── 9. CtaPaymentSection ──────────────────────────────────────────────── */
export function CtaPaymentSection({ data, org, slug }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'תרמו עכשיו';
  const headlineRaw = (data.headline as string) || 'כל שקל, *ישר לעבודה.*';
  const subtext = (data.subtext as string) || (data.subheadline as string) || '';
  const amounts = (data.amounts as number[]) || [100, 250, 500, 1000];
  const defaultAmount = (data.default_amount as number) || amounts[2] || 500;
  const trustItems = (data.trust as string[]) || [
    '🔒 סליקה מאובטחת',
    'עד 12 תשלומים',
    'קבלה לפי סעיף 46',
  ];

  const headlineHtml = headlineRaw.replace(
    /\*(.*?)\*/g,
    '<span class="accent">$1</span>'
  );

  const [selected, setSelected] = useState<number | null>(defaultAmount);
  const [walletState, setWalletState] = useState<'idle' | 'loading' | 'open' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const sdkInitRef = useRef(false);

  const hasGrowWallet = !!org.hasGrowWallet;
  const sdkReady = useGrowSdk();

  // Initialize Grow SDK once loaded
  useEffect(() => {
    if (!hasGrowWallet || !sdkReady || sdkInitRef.current || !window.growPayment) return;
    sdkInitRef.current = true;

    const isProduction = window.location.hostname !== 'localhost';
    window.growPayment.init({
      environment: isProduction ? 'PRODUCTION' : 'DEV',
      version: 1,
      events: {
        onSuccess: () => {
          setWalletState('success');
        },
        onFailure: (response: { message?: string }) => {
          setWalletState('error');
          setErrorMsg(response?.message || 'התשלום נכשל');
        },
        onError: (response: { message?: string }) => {
          setWalletState('error');
          setErrorMsg(response?.message || 'שגיאה בתהליך התשלום');
        },
        onWalletChange: (state: string) => {
          if (state === 'open') setWalletState('open');
          if (state === 'close' || state === 'Close') {
            setWalletState((prev) => (prev === 'success' ? 'success' : 'idle'));
          }
        },
        onTimeout: () => {
          setWalletState('error');
          setErrorMsg('פג תוקף התשלום. נסו שנית.');
        },
        onPaymentStart: () => {},
        onPaymentCancel: () => {
          setWalletState('idle');
        },
      },
    });
  }, [hasGrowWallet, sdkReady]);

  async function handleDonate() {
    if (!selected && selected !== 0) return;

    if (hasGrowWallet && window.growPayment) {
      setWalletState('loading');
      setErrorMsg('');
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
        const res = await fetch(`${apiBase}/public/landing/${slug}/create-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sum: selected }),
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

    const url = org.paymentLink || '#';
    if (selected) {
      window.open(`${url}?amount=${selected}`, '_blank');
    } else {
      window.open(url, '_blank');
    }
  }

  return (
    <section className="section cta" id="donate">
      <div className="container">
        <div className="eyebrow reveal">{eyebrow}</div>
        <h2
          className="reveal"
          dangerouslySetInnerHTML={{ __html: headlineHtml }}
        />
        {subtext && <p className="cta-sub reveal">{subtext}</p>}

        {walletState === 'success' ? (
          <div className="reveal" style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>✓</div>
            <p style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--ink)' }}>תודה רבה על תרומתכם!</p>
            <p style={{ color: 'var(--text-muted)', marginTop: 8 }}>התרומה התקבלה בהצלחה.</p>
            <button
              className="btn"
              style={{ marginTop: 24 }}
              onClick={() => setWalletState('idle')}
            >
              תרומה נוספת
            </button>
          </div>
        ) : (
          <>
            <div className="chips reveal" role="radiogroup" aria-label="סכום תרומה">
              {amounts.map((amt) => (
                <button
                  key={amt}
                  className={`chip${selected === amt ? ' active' : ''}`}
                  role="radio"
                  aria-checked={selected === amt}
                  data-amount={amt}
                  onClick={() => setSelected(amt)}
                >
                  ₪{amt.toLocaleString()}
                </button>
              ))}
              <button
                className={`chip${selected === null ? ' active' : ''}`}
                role="radio"
                aria-checked={selected === null}
                onClick={() => setSelected(null)}
              >
                אחר
              </button>
            </div>

            {walletState === 'error' && errorMsg && (
              <div className="reveal" style={{ color: '#c53030', textAlign: 'center', padding: '0.75rem', fontSize: '0.9rem' }}>
                {errorMsg}
              </div>
            )}

            <div className="cta-go reveal">
              <button
                className="btn btn-lg"
                onClick={handleDonate}
                disabled={walletState === 'loading' || walletState === 'open'}
                style={walletState === 'loading' || walletState === 'open' ? { opacity: 0.7, cursor: 'wait' } : undefined}
              >
                <span>
                  {walletState === 'loading'
                    ? 'טוען...'
                    : walletState === 'open'
                      ? 'מחכה לתשלום...'
                      : `תרמו${selected ? ` ₪${selected.toLocaleString()}` : ''} →`}
                </span>
              </button>
            </div>
          </>
        )}

        <div className="cta-trust reveal">
          {trustItems.map((item, i) => (
            <span key={i}>{item}{i < trustItems.length - 1 ? <> &nbsp;·&nbsp;</> : null}</span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 10. JoinUsSection ─────────────────────────────────────────────────── */
export function JoinUsSection({ data }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'הצטרפו אלינו';
  const heading = (data.heading as string) || (data.headline as string) || 'מקום ליד השולחן תמיד פתוח.';
  const bodyText = (data.body as string) || '';

  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    hp: '',
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.hp) return;
    setSubmitted(true);
  }

  return (
    <section className="section join" id="contact">
      <div className="container join-grid">
        <div className="reveal">
          <div className="eyebrow">{eyebrow}</div>
          <h2>{heading}</h2>
          {bodyText && (
            <p
              style={{
                marginTop: 24,
                fontSize: 17,
                lineHeight: 1.65,
                maxWidth: 480,
                color: 'var(--text)',
              }}
            >
              {bodyText}
            </p>
          )}
        </div>

        <form className="form-card reveal" onSubmit={handleSubmit}>
          {/* Honeypot */}
          <input
            type="text"
            name="website"
            value={form.hp}
            onChange={(e) => setForm({ ...form, hp: e.target.value })}
            style={{ display: 'none' }}
            tabIndex={-1}
            autoComplete="off"
          />

          {!submitted ? (
            <div>
              <div className="field">
                <label>שם</label>
                <input
                  required
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>אימייל</label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="field">
                <label>טלפון (לא חובה)</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label>הודעה (לא חובה)</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="btn btn-lg btn-block">
                <span>שלחו →</span>
              </button>
            </div>
          ) : (
            <div className="form-success">
              <div className="check-circle">
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12l5 5 9-11" />
                </svg>
              </div>
              <h3
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 32,
                  marginBottom: 10,
                  color: 'var(--paper)',
                }}
              >
                קיבלנו. תודה רבה.
              </h3>
              <div style={{ color: 'rgba(245,240,230,0.7)', fontSize: 15 }}>
                נחזור אליכם תוך מספר ימים.
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

/* ─── 11. FaqSection ────────────────────────────────────────────────────── */
export function FaqSection({ data }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'שאלות';
  const heading = (data.heading as string) || (data.title as string) || 'הנפוצות ביותר.';
  const faqs =
    (data.faqs as Array<{ question: string; answer: string }>) ||
    (data.items as Array<{ question: string; answer: string }>) ||
    [];

  const [openIndex, setOpenIndex] = useState<number | null>(1);

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <section className="section faq">
      <div className="container faq-grid">
        <div className="reveal">
          <div className="eyebrow">{eyebrow}</div>
          <h2>{heading}</h2>
        </div>
        <div className="faq-list">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="faq-item reveal"
                data-open={isOpen ? 'true' : 'false'}
              >
                <button
                  className="faq-q"
                  aria-expanded={isOpen}
                  onClick={() => toggle(i)}
                >
                  <span>{faq.question}</span>
                  <span className="chev" />
                </button>
                <div className="faq-a">
                  <div>
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── 12. FooterSection ─────────────────────────────────────────────────── */
export function FooterSection({ data, org }: SectionProps) {
  const bigText = (data.big_text as string) || (data.big_line_1 as string) || 'לבנות קהילה.';
  const bigAccent = (data.big_accent as string) || (data.big_line_2 as string) || 'ביחד.';
  const tagline = (data.tagline as string) || (data.about as string) || '';
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-big">
        <span>{bigText}</span>
        <span className="accent"> {bigAccent}</span>
      </div>

      <div className="footer-grid">
        {/* Brand column */}
        <div>
          <div className="footer-brand">
            <div className="brand-mark" />
            <div className="brand-name">{org.name}</div>
          </div>
          <div className="footer-tag">
            {tagline || `עמותה קהילתית המשרתת את משפחות הקהילה.`}
          </div>
        </div>

        {/* Visit */}
        {org.address && (
          <div className="footer-col">
            <h4>ביקור</h4>
            <div>{org.address}</div>
          </div>
        )}

        {/* Contact */}
        {(org.contactEmail || org.contactPhone) && (
          <div className="footer-col">
            <h4>יצירת קשר</h4>
            {org.contactEmail && (
              <a href={`mailto:${org.contactEmail}`}>{org.contactEmail}</a>
            )}
            {org.contactPhone && (
              <a href={`tel:${org.contactPhone}`}>{org.contactPhone}</a>
            )}
          </div>
        )}

        {/* Follow */}
        {(org.instagramUrl || org.facebookUrl || org.youtubeUrl) && (
          <div className="footer-col">
            <h4>עקבו</h4>
            {org.instagramUrl && (
              <a href={org.instagramUrl} target="_blank" rel="noopener noreferrer">
                Instagram
              </a>
            )}
            {org.facebookUrl && (
              <a href={org.facebookUrl} target="_blank" rel="noopener noreferrer">
                Facebook
              </a>
            )}
            {org.youtubeUrl && (
              <a href={org.youtubeUrl} target="_blank" rel="noopener noreferrer">
                YouTube
              </a>
            )}
          </div>
        )}
      </div>

      <div className="footer-legal">
        <div>
          © {year} {org.legalName || org.name} · נבנה עם עמותות
        </div>
        <div>נבנה עם עמותות</div>
      </div>
    </footer>
  );
}
