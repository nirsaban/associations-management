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
  const subtext = (data.subtext as string) || '';
  const pill = (data.pill as string) || 'פעיל · קמפיין פתוח';
  const since = (data.since as string) || '';
  const ctaPrimary = (data.cta_primary as string) || 'תרמו עכשיו →';
  const ctaGhost = (data.cta_ghost as string) || '';
  const stats = (data.stats as Array<{ value: string; label: string }>) || [];

  return (
    <header className="lp-hero" id="top">
      <div className="lp-hero-bg" aria-hidden="true">
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
      </div>
      <div className="lp-hero-inner">
        <div className="lp-hero-meta">
          <span className="lp-hero-pill">
            <span className="lp-dot" />
            <span>{pill}</span>
          </span>
          {since && <span className="lp-since">{since}</span>}
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

        {subtext && <p className="lp-hero-sub">{subtext}</p>}

        <div className="lp-hero-cta">
          <a href="#donate" className="lp-btn lp-btn-primary lp-btn-lg">
            <span>{ctaPrimary}</span>
          </a>
          {ctaGhost && (
            <a href="#story" className="lp-btn lp-btn-ghost lp-btn-lg">
              {ctaGhost}
            </a>
          )}
        </div>

        {stats.length > 0 && (
          <div className="lp-hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="lp-hero-stat">
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
    <div className="lp-marquee" aria-hidden="true">
      <div className="lp-marquee-track">
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
  const heading = (data.heading as string) || '';
  const src = (data.src as string) || '';

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
    <section className="lp-section" id="story">
      <div className="lp-container">
        <div className="lp-eyebrow lp-reveal">{eyebrow}</div>
        {heading && <h2 className="lp-reveal">{heading}</h2>}
        <div className="lp-video-wrap lp-reveal">
          {playing && embedUrl ? (
            <div className="lp-video-frame">
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
              className="lp-video-frame lp-imgslot"
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
              <div className="lp-video-play">
                <div className="lp-core">
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
  const heading = (data.heading as string) || '';
  const bodyRichText = (data.body_rich_text as string) || '';
  const imageUrl = (data.image_url as string) || '';
  const badge = (data.badge as string) || '';

  return (
    <section className="lp-section lp-about" id="about">
      <div className="lp-container lp-about-grid">
        <div className="lp-about-text lp-reveal">
          <div className="lp-eyebrow">{eyebrow}</div>
          {heading && <h2>{heading}</h2>}
          {bodyRichText && (
            <div
              dangerouslySetInnerHTML={{ __html: bodyRichText }}
            />
          )}
        </div>
        <div className="lp-about-visual lp-reveal">
          <div className="layer-color" />
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={org.name}
              className="layer-img"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div className="layer-img lp-imgslot">about · 4:5</div>
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
  const heading = (data.heading as string) || '';
  const activities =
    (data.activities as Array<{ title: string; description: string; imageUrl?: string }>) || [];

  return (
    <section className="lp-section lp-activities" id="activities">
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-reveal">
            <div className="lp-eyebrow">{eyebrow}</div>
            {heading && <h2>{heading}</h2>}
          </div>
        </div>
        <div className="lp-activities-grid">
          {activities.map((act, i) => {
            const num = String(i + 1).padStart(2, '0');
            return (
              <article key={i} className="lp-activity lp-reveal">
                <div className="lp-activity-img">
                  {act.imageUrl ? (
                    <img
                      src={act.imageUrl}
                      alt={act.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div className="lp-imgslot">activity {i + 1}</div>
                  )}
                  <div className="lp-activity-num">{num}</div>
                </div>
                <div className="lp-activity-body">
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
  const heading = (data.heading as string) || '';
  const images = (data.images as Array<{ url: string; alt?: string }>) || [];
  const heights = [220, 300, 180, 260, 240, 320, 200, 280, 220, 260, 300, 190];

  const slots = images.length > 0 ? images : heights.map(() => null);

  return (
    <section className="lp-section lp-gallery" id="gallery">
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-reveal">
            <div className="lp-eyebrow">{eyebrow}</div>
            {heading && <h2>{heading}</h2>}
          </div>
        </div>
        <div className="lp-gallery-grid">
          {slots.map((img, i) => (
            <div
              key={i}
              className="lp-reveal"
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
  const heading = (data.heading as string) || 'הקהילה, על הקהילה.';
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
    <section className="lp-section lp-reviews">
      <div className="lp-container">
        <div className="lp-eyebrow lp-reveal">{eyebrow}</div>
        <h2 className="lp-reveal">{heading}</h2>
        <div className="lp-reviews-grid">
          {reviews.map((r, i) => (
            <article key={i} className="lp-review lp-reveal">
              <div className="lp-stars" aria-label={`${r.stars} מתוך 5 כוכבים`}>
                {[0, 1, 2, 3, 4].map((s) => (
                  <StarIcon key={s} filled={s < r.stars} />
                ))}
              </div>
              <p>&ldquo;{r.quote}&rdquo;</p>
              <div className="lp-review-name">— {r.name}</div>
            </article>
          ))}
        </div>

        <div className="lp-reviews-cta lp-reveal">
          {!showForm ? (
            <button
              className="lp-btn lp-btn-secondary"
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
              <div className="lp-field">
                <label>שם</label>
                <input
                  required
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={{ background: 'var(--paper-2)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--ink)' }}
                />
              </div>
              <div className="lp-field">
                <label>ביקורת</label>
                <textarea
                  required
                  rows={3}
                  value={form.quote}
                  onChange={(e) => setForm({ ...form, quote: e.target.value })}
                  style={{ background: 'var(--paper-2)', border: '1px solid var(--border-strong)', borderRadius: 12, padding: '12px 14px', fontSize: 15, color: 'var(--ink)', resize: 'vertical', minHeight: 80 }}
                />
              </div>
              <button type="submit" className="lp-btn lp-btn-primary lp-btn-block">
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
    (data.stats as Array<{ value: string; label: string }>) || [];

  return (
    <section className="lp-section lp-stats">
      <div className="lp-container">
        <div className="lp-eyebrow lp-reveal" style={{ color: 'var(--ink)' }}>
          {eyebrow}
        </div>
        <div className="lp-stats-grid" id="lp-stats-grid">
          {stats.map((s, i) => (
            <div key={i} className="lp-stat lp-reveal">
              <CountUpNumber value={s.value} className="lp-stat-num" />
              <div className="lp-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── 9. CtaPaymentSection ──────────────────────────────────────────────── */
export function CtaPaymentSection({ data, org }: SectionProps) {
  const eyebrow = (data.eyebrow as string) || 'תרמו עכשיו';
  const headlineRaw = (data.headline as string) || 'כל שקל, *ישר לעבודה.*';
  const subtext = (data.subtext as string) || '';
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

  function handleDonate() {
    const url = org.paymentLink || '#';
    if (selected) {
      window.open(`${url}?amount=${selected}`, '_blank');
    } else {
      window.open(url, '_blank');
    }
  }

  return (
    <section className="lp-section lp-cta" id="donate">
      <div className="lp-container">
        <div className="lp-eyebrow lp-reveal">{eyebrow}</div>
        <h2
          className="lp-reveal"
          dangerouslySetInnerHTML={{ __html: headlineHtml }}
        />
        {subtext && <p className="lp-cta-sub lp-reveal">{subtext}</p>}

        <div className="lp-chips lp-reveal" role="radiogroup" aria-label="סכום תרומה">
          {amounts.map((amt) => (
            <button
              key={amt}
              className={`lp-chip${selected === amt ? ' lp-chip-active' : ''}`}
              role="radio"
              aria-checked={selected === amt}
              data-amount={amt}
              onClick={() => setSelected(amt)}
            >
              ₪{amt.toLocaleString()}
            </button>
          ))}
          <button
            className={`lp-chip${selected === null ? ' lp-chip-active' : ''}`}
            role="radio"
            aria-checked={selected === null}
            onClick={() => setSelected(null)}
          >
            אחר
          </button>
        </div>

        <div className="lp-cta-go lp-reveal">
          <button className="lp-btn lp-btn-lg" onClick={handleDonate}>
            <span>
              תרמו{selected ? ` ₪${selected.toLocaleString()}` : ''} →
            </span>
          </button>
        </div>

        <div className="lp-cta-trust lp-reveal">
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
  const heading = (data.heading as string) || 'מקום ליד השולחן תמיד פתוח.';
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
    <section className="lp-section lp-join" id="contact">
      <div className="lp-container lp-join-grid">
        <div className="lp-reveal">
          <div className="lp-eyebrow">{eyebrow}</div>
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

        <form className="lp-form-card lp-reveal" onSubmit={handleSubmit}>
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
              <div className="lp-field">
                <label>שם</label>
                <input
                  required
                  type="text"
                  autoComplete="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div className="lp-field">
                <label>אימייל</label>
                <input
                  required
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div className="lp-field">
                <label>טלפון (לא חובה)</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="lp-field">
                <label>הודעה (לא חובה)</label>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={(e) =>
                    setForm({ ...form, message: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="lp-btn lp-btn-lg lp-btn-block">
                <span>שלחו →</span>
              </button>
            </div>
          ) : (
            <div className="lp-form-success">
              <div className="lp-check-circle">
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
  const heading = (data.heading as string) || 'הנפוצות ביותר.';
  const faqs =
    (data.faqs as Array<{ question: string; answer: string }>) || [];

  const [openIndex, setOpenIndex] = useState<number | null>(1);

  function toggle(i: number) {
    setOpenIndex(openIndex === i ? null : i);
  }

  return (
    <section className="lp-section lp-faq">
      <div className="lp-container lp-faq-grid">
        <div className="lp-reveal">
          <div className="lp-eyebrow">{eyebrow}</div>
          <h2>{heading}</h2>
        </div>
        <div className="lp-faq-list">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={i}
                className="lp-faq-item lp-reveal"
                data-open={isOpen ? 'true' : 'false'}
              >
                <button
                  className="lp-faq-q"
                  aria-expanded={isOpen}
                  onClick={() => toggle(i)}
                >
                  <span>{faq.question}</span>
                  <span className="chev" />
                </button>
                <div className="lp-faq-a">
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
  const bigLine1 = (data.big_line_1 as string) || 'לבנות קהילה.';
  const bigLine2 = (data.big_line_2 as string) || 'ביחד.';
  const tagline = (data.tagline as string) || '';
  const year = new Date().getFullYear();

  return (
    <footer className="lp-footer">
      <div className="lp-footer-big">
        <span>{bigLine1}</span>
        <span className="accent"> {bigLine2}</span>
      </div>

      <div className="lp-footer-grid">
        {/* Brand column */}
        <div>
          <div className="lp-footer-brand">
            <div className="lp-brand-mark" />
            <div className="lp-brand-name">{org.name}</div>
          </div>
          <div className="lp-footer-tag">
            {tagline || `עמותה קהילתית המשרתת את משפחות הקהילה.`}
          </div>
        </div>

        {/* Visit */}
        {org.address && (
          <div className="lp-footer-col">
            <h4>ביקור</h4>
            <div>{org.address}</div>
          </div>
        )}

        {/* Contact */}
        {(org.contactEmail || org.contactPhone) && (
          <div className="lp-footer-col">
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
          <div className="lp-footer-col">
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

      <div className="lp-footer-legal">
        <div>
          © {year} {org.legalName || org.name} · נבנה עם עמותות
        </div>
        <div>נבנה עם עמותות</div>
      </div>
    </footer>
  );
}
