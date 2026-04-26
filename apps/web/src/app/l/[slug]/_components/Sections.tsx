'use client';

import React, { useState, useEffect, useRef } from 'react';

/* ── Types ── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SectionData { [key: string]: any; }

interface SectionProps {
  data: SectionData;
  org: {
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
  };
  primaryColor: string;
  accentColor: string;
  slug: string;
}

/* ── SVG icons ── */
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M12 3l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 17l-5.6 3.2 1.5-6.3L3 9.6l6.4-.6L12 3z" />
  </svg>
);
const PlayIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
);
const CheckIcon = () => (
  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
);

/* ═══ 1. HERO ═══ */
export function HeroSection({ data, org }: SectionProps) {
  const handleCta = () => {
    if (data.cta_action === 'payment' && org.paymentLink) window.open(org.paymentLink, '_blank', 'noopener');
    else if (data.cta_action === 'link' && data.cta_target) window.open(data.cta_target, '_blank', 'noopener');
    else {
      const donateSection = document.getElementById('donate');
      if (donateSection) donateSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (!data.headline) return null;

  // Split headline into animated words
  const words = (data.headline as string).split(/\s+/);
  const stats = (data.stats as Array<Record<string, string>>) || [];

  return (
    <header className="lp-hero" id="top">
      <div className="lp-hero-bg" aria-hidden="true">
        <div className="lp-blob lp-blob-1" />
        <div className="lp-blob lp-blob-2" />
        <div className="lp-blob lp-blob-3" />
      </div>
      <div className="lp-hero-inner">
        {/* Meta row: pill + since */}
        <div className="lp-hero-meta">
          {data.pill_text && (
            <span className="lp-hero-pill">
              <span className="dot" />
              <span>{data.pill_text}</span>
            </span>
          )}
          {data.since_text && <span className="since">{data.since_text}</span>}
        </div>

        {/* Headline with per-word animation */}
        <h1>
          {words.map((word, i) => (
            <span
              key={i}
              className={`word${data.accent_word_index !== undefined && i === Number(data.accent_word_index) ? ' accent' : ''}`}
            >
              {word}{' '}
            </span>
          ))}
        </h1>

        {data.subheadline && <p className="lp-hero-sub">{data.subheadline}</p>}

        <div className="lp-hero-cta">
          {data.cta_label && (
            <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={handleCta}>
              <span>{data.cta_label}</span>
            </button>
          )}
          {data.secondary_cta_label && (
            <a href={data.secondary_cta_target || '#story'} className="lp-btn lp-btn-ghost lp-btn-lg">
              {data.secondary_cta_label}
            </a>
          )}
        </div>

        {/* Hero stats grid */}
        {stats.length > 0 && (
          <div className="lp-hero-stats">
            {stats.map((s, i) => (
              <div key={i} className="lp-hero-stat">
                <div className="n" data-num={s.value}>{s.value}</div>
                <div className="l">{s.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

/* ═══ MARQUEE ═══ */
export function MarqueeSection({ data }: SectionProps) {
  const items = (data.items as string[]) || [];
  if (items.length === 0) return null;
  // Double for seamless infinite scroll
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

/* ═══ 2. VIDEO ═══ */
export function VideoSection({ data }: SectionProps) {
  const getEmbedUrl = () => {
    const url = data.source as string;
    if (!url) return null;
    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    if (ytMatch?.[1]) return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?rel=0`;
    const viMatch = url.match(/vimeo\.com\/(\d+)/);
    if (viMatch?.[1]) return `https://player.vimeo.com/video/${viMatch[1]}?dnt=1`;
    return url;
  };
  const embedUrl = getEmbedUrl();
  if (!data.title) return null;

  return (
    <section className="lp-section" id="story">
      <div className="lp-container">
        {data.eyebrow && <div className="lp-eyebrow lp-reveal">{data.eyebrow}</div>}
        <h2 className="lp-reveal">{data.title}</h2>
        {data.description && (
          <p className="lp-reveal" style={{ marginTop: 18, color: 'var(--text-muted)', maxWidth: 560, fontSize: 17, lineHeight: 1.55 }}>
            {data.description}
          </p>
        )}
        <div className="lp-video-wrap lp-reveal">
          <div
            className={`lp-video-frame${embedUrl ? '' : ' lp-imgslot'}`}
            tabIndex={embedUrl ? undefined : 0}
            role={embedUrl ? undefined : 'button'}
            aria-label={embedUrl ? undefined : 'Play video'}
          >
            {embedUrl ? (
              <iframe
                src={embedUrl}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none', zIndex: 1 }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                title={data.title || 'Video'}
              />
            ) : (
              <>
                <span style={{ position: 'absolute', top: 20, right: 20, color: 'rgba(245,240,230,0.5)', zIndex: 2 }}>video · 16:9</span>
                <div className="lp-video-play">
                  <div className="core"><PlayIcon /></div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══ 3. ABOUT ═══ */
export function AboutSection({ data }: SectionProps) {
  if (!data.title && !data.body_rich_text) return null;

  return (
    <section className="lp-section lp-about" id="about">
      <div className="lp-container lp-about-grid">
        <div className="lp-about-text lp-reveal">
          {data.eyebrow && <div className="lp-eyebrow">{data.eyebrow}</div>}
          {data.title && <h2>{data.title}</h2>}
          {data.body_rich_text && <div dangerouslySetInnerHTML={{ __html: data.body_rich_text }} />}
        </div>
        <div className="lp-about-visual lp-reveal">
          <div className="layer-color" />
          {data.side_image ? (
            <div className="layer-img">
              <img src={data.side_image} alt={data.side_image_alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
            </div>
          ) : (
            <div className="layer-img lp-imgslot">about · 4:5</div>
          )}
          {data.badge_text && <div className="badge">{data.badge_text}</div>}
        </div>
      </div>
    </section>
  );
}

/* ═══ 4. ACTIVITIES ═══ */
export function ActivitiesSection({ data }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];
  if (items.length === 0) return null;

  return (
    <section className="lp-section lp-activities" id="activities">
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-reveal">
            {data.eyebrow && <div className="lp-eyebrow">{data.eyebrow}</div>}
            {data.title && <h2>{data.title}</h2>}
          </div>
        </div>
        <div className="lp-activities-grid">
          {items.map((item, i) => (
            <article key={i} className="lp-activity lp-reveal">
              <div className="lp-activity-img">
                {item.image ? (
                  <img src={item.image} alt={item.image_alt || item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" />
                ) : (
                  <div className="lp-imgslot" style={{ height: '100%' }}>activity {i + 1}</div>
                )}
                <div className="lp-activity-num">{String(i + 1).padStart(2, '0')}</div>
              </div>
              <div className="lp-activity-body">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ 5. GALLERY ═══ */
export function GallerySection({ data }: SectionProps) {
  const images = (data.images as Array<Record<string, string>>) || [];
  // Placeholder heights matching the prototype exactly
  const placeholderHeights = [220, 300, 180, 260, 240, 320, 200, 280, 220, 260, 300, 190];

  return (
    <section className="lp-section lp-gallery" id="gallery">
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-reveal">
            {data.eyebrow && <div className="lp-eyebrow">{data.eyebrow}</div>}
            {data.title && <h2>{data.title}</h2>}
          </div>
        </div>
        <div className="lp-gallery-grid">
          {images.length > 0
            ? images.map((img, i) => (
                <div key={i} className="lp-reveal">
                  <img
                    src={img.url || img.src}
                    alt={img.alt || `תמונה ${i + 1}`}
                    style={{ width: '100%', display: 'block', borderRadius: 14 }}
                    loading="lazy"
                  />
                </div>
              ))
            : placeholderHeights.map((h, i) => (
                <div key={i} className="lp-reveal" style={{ height: h }} />
              ))
          }
        </div>
      </div>
    </section>
  );
}

/* ═══ 6. REVIEWS ═══ */
export function ReviewsSection({ data, slug }: SectionProps) {
  const reviews = (data.reviews as Array<Record<string, string | number>>) || [];
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ authorName: '', rating: 5, body: '', website: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.website) return; // honeypot
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
      await fetch(`${apiUrl}/public/landing/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
    } catch { /* silent */ }
  };

  return (
    <section className="lp-section lp-reviews">
      <div className="lp-container">
        {data.eyebrow && <div className="lp-eyebrow lp-reveal">{data.eyebrow}</div>}
        {data.title && <h2 className="lp-reveal">{data.title}</h2>}

        {reviews.length > 0 && (
          <div className="lp-reviews-grid">
            {reviews.map((r, i) => (
              <article key={i} className="lp-review lp-reveal">
                <div className="lp-stars" aria-label={`${r.rating} מתוך 5 כוכבים`}>
                  {[0, 1, 2, 3, 4].map(j => <StarIcon key={j} filled={j < Number(r.rating)} />)}
                </div>
                <p>&ldquo;{r.body}&rdquo;</p>
                <div className="lp-review-name">— {r.authorName || r.name}</div>
              </article>
            ))}
          </div>
        )}

        {reviews.length === 0 && !showForm && (
          <div className="lp-reveal" style={{ padding: 60, background: 'var(--paper)', border: '1px dashed var(--border-strong)', borderRadius: 24, textAlign: 'center', color: 'var(--text-muted)', marginTop: 48 }}>
            {data.empty_text || 'היו הראשונים להשאיר ביקורת.'}
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <button className="lp-btn lp-btn-primary" onClick={() => setShowForm(true)}>
                <span>השאירו ביקורת</span>
              </button>
            </div>
          </div>
        )}

        {!submitted && reviews.length > 0 && !showForm && (
          <div className="lp-reviews-cta lp-reveal">
            <button className="lp-btn lp-btn-secondary" onClick={() => setShowForm(true)}>
              <span>{data.cta_text || 'השאירו ביקורת שלכם'} +</span>
            </button>
          </div>
        )}

        {showForm && !submitted && (
          <form onSubmit={handleSubmit} className="lp-form-card lp-reveal" style={{ maxWidth: 620, marginTop: 32 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 18, fontWeight: 700 }}>השאירו ביקורת</h3>
            <div className="lp-field">
              <label>שם</label>
              <input required value={formData.authorName} onChange={e => setFormData(p => ({ ...p, authorName: e.target.value }))} />
            </div>
            <div className="lp-field">
              <label>דירוג</label>
              <div className="lp-stars" style={{ marginTop: 6 }}>
                {[0, 1, 2, 3, 4].map(j => (
                  <button key={j} type="button" onClick={() => setFormData(p => ({ ...p, rating: j + 1 }))} style={{ cursor: 'pointer', padding: 2 }}>
                    <StarIcon filled={j < formData.rating} />
                  </button>
                ))}
              </div>
            </div>
            <div className="lp-field">
              <label>הביקורת שלכם</label>
              <textarea required rows={4} value={formData.body} onChange={e => setFormData(p => ({ ...p, body: e.target.value }))} />
            </div>
            {/* honeypot */}
            <input
              value={formData.website}
              onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
              style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />
            <button type="submit" className="lp-btn lp-btn-primary" style={{ marginTop: 6 }}>
              <span>שליחה</span>
            </button>
            <div style={{ fontSize: 12, color: 'rgba(245,240,230,0.6)', marginTop: 8 }}>הביקורות מופיעות לאחר אישור העמותה.</div>
          </form>
        )}

        {submitted && (
          <p className="lp-reveal" style={{ textAlign: 'center', marginTop: 32, color: 'var(--coral)', fontSize: 18, fontWeight: 600 }}>
            תודה — הביקורת שלכם ממתינה לאישור.
          </p>
        )}
      </div>
    </section>
  );
}

/* ═══ 7. STATS ═══ */
function StatNum({ value }: { value: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!ref.current || typeof window === 'undefined') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const m = value.match(/^([\d,]+)(.*)$/);
    if (!m) return;
    const final = parseInt(m[1].replace(/,/g, ''), 10);
    const suffix = m[2];

    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        const start = performance.now();
        const dur = 1400;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(final * eased).toLocaleString() + suffix);
          if (p < 1) requestAnimationFrame(tick);
        };
        setDisplay('0' + suffix);
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });

    obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);

  return <div className="lp-stat-num" ref={ref}>{display}</div>;
}

export function StatsSection({ data }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];
  if (items.length === 0) return null;

  return (
    <section className="lp-section lp-stats">
      <div className="lp-container">
        {data.eyebrow && <div className="lp-eyebrow lp-reveal">{data.eyebrow}</div>}
        <div className="lp-stats-grid">
          {items.map((s, i) => (
            <div key={i} className="lp-stat lp-reveal">
              <StatNum value={s.value || s.number || '0'} />
              <div className="lp-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ 8. CTA PAYMENT ═══ */
export function CtaPaymentSection({ data, org }: SectionProps) {
  const amounts = (data.amounts as number[]) || [100, 250, 500, 1000];
  const [selected, setSelected] = useState<number>(data.default_amount_index ?? 2);

  const handleDonate = () => {
    if (org.paymentLink) {
      const amt = selected < amounts.length ? amounts[selected] : null;
      const url = amt
        ? `${org.paymentLink}${org.paymentLink.includes('?') ? '&' : '?'}amount=${amt}`
        : org.paymentLink;
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <section className="lp-section lp-cta" id="donate">
      <div className="lp-container">
        {data.eyebrow && <div className="lp-eyebrow lp-reveal">{data.eyebrow}</div>}
        {data.headline && (
          <h2
            className="lp-reveal"
            dangerouslySetInnerHTML={{
              __html: (data.headline as string).replace(/\*(.+?)\*/g, '<span class="accent">$1</span>'),
            }}
          />
        )}
        {data.subheadline && <p className="lp-cta-sub lp-reveal">{data.subheadline}</p>}

        <div className="lp-chips lp-reveal" role="radiogroup" aria-label="סכום תרומה">
          {amounts.map((amt, i) => (
            <button
              key={amt}
              className={`lp-chip${selected === i ? ' active' : ''}`}
              role="radio"
              aria-checked={selected === i}
              onClick={() => setSelected(i)}
            >
              ₪{amt.toLocaleString()}
            </button>
          ))}
          {data.allow_custom && (
            <button
              className={`lp-chip${selected === amounts.length ? ' active' : ''}`}
              role="radio"
              aria-checked={selected === amounts.length}
              onClick={() => setSelected(amounts.length)}
            >
              אחר
            </button>
          )}
        </div>

        <div className="lp-cta-go lp-reveal">
          <button className="lp-btn lp-btn-lg" onClick={handleDonate}>
            <span>
              {data.cta_label || 'תרמו'}
              &nbsp;
              {selected < amounts.length ? `₪${amounts[selected].toLocaleString()}` : ''}
              &nbsp;→
            </span>
          </button>
        </div>

        <div className="lp-cta-trust lp-reveal">
          <span>🔒 {data.secure_label || 'סליקה מאובטחת'}</span>
          <span>·</span>
          {data.installments_hint !== false && (
            <><span>{data.installments_label || 'עד 12 תשלומים'}</span><span>·</span></>
          )}
          {data.receipt_hint !== false && (
            <span>{data.receipt_label || 'קבלה לפי סעיף 46'}</span>
          )}
        </div>
      </div>
    </section>
  );
}

/* ═══ 9. JOIN US ═══ */
export function JoinUsSection({ data, slug }: SectionProps) {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const fd = new FormData(form);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
      await fetch(`${apiUrl}/public/landing/${slug}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fd.get('name'),
          email: fd.get('email'),
          phone: fd.get('phone'),
          message: fd.get('message'),
        }),
      });
      setSubmitted(true);
    } catch { /* silent */ }
  };

  return (
    <section className="lp-section lp-join" id="contact">
      <div className="lp-container lp-join-grid">
        <div className="lp-reveal">
          {data.eyebrow && <div className="lp-eyebrow">{data.eyebrow}</div>}
          {data.headline && <h2>{data.headline}</h2>}
          {data.body && (
            <p style={{ marginTop: 24, fontSize: 17, lineHeight: 1.65, maxWidth: 480, color: 'var(--text)' }}>
              {data.body}
            </p>
          )}
        </div>
        <form className="lp-form-card lp-reveal" onSubmit={handleSubmit}>
          {!submitted ? (
            <>
              <div className="lp-field">
                <label>שם</label>
                <input required name="name" type="text" autoComplete="name" />
              </div>
              <div className="lp-field">
                <label>אימייל</label>
                <input required name="email" type="email" autoComplete="email" />
              </div>
              <div className="lp-field">
                <label>טלפון (לא חובה)</label>
                <input name="phone" type="tel" autoComplete="tel" />
              </div>
              <div className="lp-field">
                <label>הודעה (לא חובה)</label>
                <textarea name="message" rows={3} />
              </div>
              <button type="submit" className="lp-btn lp-btn-lg lp-btn-block">
                <span>{data.submit_label || 'שלחו →'}</span>
              </button>
            </>
          ) : (
            <div className="lp-form-success">
              <div className="lp-check-circle"><CheckIcon /></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 32, marginBottom: 10, color: 'var(--paper)', fontWeight: 800 }}>
                {data.success_title || 'קיבלנו. תודה רבה.'}
              </h3>
              <div style={{ color: 'rgba(245,240,230,0.7)', fontSize: 15 }}>
                {data.success_message || 'נחזור אליכם תוך מספר ימים.'}
              </div>
            </div>
          )}
        </form>
      </div>
    </section>
  );
}

/* ═══ 10. FAQ ═══ */
export function FaqSection({ data }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  if (items.length === 0) return null;

  return (
    <section className="lp-section lp-faq">
      <div className="lp-container lp-faq-grid">
        <div className="lp-reveal">
          {data.eyebrow && <div className="lp-eyebrow">{data.eyebrow}</div>}
          {data.title && <h2>{data.title}</h2>}
        </div>
        <div className="lp-faq-list">
          {items.map((faq, i) => (
            <div
              key={i}
              className="lp-faq-item lp-reveal"
              data-open={openIndex === i ? 'true' : 'false'}
            >
              <button
                className="lp-faq-q"
                aria-expanded={openIndex === i}
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
              >
                <span>{faq.question || faq.q}</span>
                {/* chev content is rendered via CSS ::before { content:"+" } */}
                <span className="chev" />
              </button>
              <div className="lp-faq-a">
                <div>
                  <p>{faq.answer || faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══ 11. FOOTER ═══ */
export function FooterSection({ data, org }: SectionProps) {
  return (
    <footer className="lp-footer">
      {/* Big headline */}
      <div className="lp-footer-big">
        <span>{data.big_text || 'לבנות קהילה.'}</span>{' '}
        <span className="accent">{data.big_accent || 'ביחד.'}</span>
      </div>

      <div className="lp-footer-grid">
        {/* Brand column */}
        <div>
          <div className="lp-footer-brand">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="" className="lp-brand-mark" style={{ objectFit: 'contain' }} />
            ) : (
              <div className="lp-brand-mark" />
            )}
            <div className="lp-brand-name">{org.name}</div>
          </div>
          <div className="lp-footer-tag">
            {data.about || 'עמותה קהילתית המשרתת את משפחות השכונה שלנו.'}
          </div>
        </div>

        {/* Visit column */}
        {(org.address || data.hours) && (
          <div className="lp-footer-col">
            <h4>{data.visit_label || 'ביקור'}</h4>
            {org.address && <div>{org.address}</div>}
            {data.hours && <div>{data.hours}</div>}
          </div>
        )}

        {/* Contact column */}
        <div className="lp-footer-col">
          <h4>{data.contact_label || 'יצירת קשר'}</h4>
          {org.contactEmail && <a href={`mailto:${org.contactEmail}`}>{org.contactEmail}</a>}
          {org.contactPhone && <a href={`tel:${org.contactPhone}`}>{org.contactPhone}</a>}
        </div>

        {/* Follow column */}
        <div className="lp-footer-col">
          <h4>{data.follow_label || 'עקבו'}</h4>
          {org.instagramUrl && (
            <a href={org.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              Instagram
            </a>
          )}
          {org.facebookUrl && (
            <a href={org.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              Facebook
            </a>
          )}
          {org.youtubeUrl && (
            <a href={org.youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label="YouTube">
              YouTube
            </a>
          )}
          {org.whatsappUrl && (
            <a href={org.whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
              WhatsApp
            </a>
          )}
        </div>
      </div>

      <div className="lp-footer-legal">
        <div>
          {org.legalName && <>{org.legalName} · </>}
          {data.registration_number && <>מס׳ {data.registration_number} · </>}
          {data.section_46 && <>אישור סעיף 46</>}
        </div>
        <div>נבנה עם עמותות</div>
      </div>
    </footer>
  );
}
