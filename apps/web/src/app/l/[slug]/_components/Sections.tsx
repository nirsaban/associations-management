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
  };
  primaryColor: string;
  accentColor: string;
  slug: string;
}

/* ── SVG icons (matching prototype exactly) ── */
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="M12 3l2.6 6 6.4.6-4.9 4.3 1.5 6.3L12 17l-5.6 3.2 1.5-6.3L3 9.6l6.4-.6L12 3z" />
  </svg>
);
const PlayIcon = () => (
  <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7L8 5z" /></svg>
);
const ChevIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
);
const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-11" /></svg>
);
const ArrowIcon = () => <span>→</span>;

/* ═══ 1. HERO ═══ */
export function HeroSection({ data, org }: SectionProps) {
  const handleCta = () => {
    if (data.cta_action === 'payment' && org.paymentLink) window.open(org.paymentLink, '_blank', 'noopener');
    else if (data.cta_action === 'link' && data.cta_target) window.open(data.cta_target, '_blank', 'noopener');
  };

  if (!data.headline) return null;

  return (
    <header className="lp-hero" id="top">
      <div className="lp-hero-mesh" aria-hidden="true" />
      <div className="lp-hero-inner">
        {data.eyebrow && <div className="lp-eyebrow lp-reveal">{data.eyebrow}</div>}
        <h1 className="lp-reveal">{data.headline}</h1>
        {data.subheadline && <p className="lp-hero-sub lp-reveal">{data.subheadline}</p>}
        <div className="lp-hero-cta lp-reveal">
          {data.cta_label && (
            <button className="lp-btn lp-btn-primary lp-btn-lg" onClick={handleCta}>
              {data.cta_label} <ArrowIcon />
            </button>
          )}
          {data.secondary_cta_label && (
            <button className="lp-btn lp-btn-ghost lp-btn-lg" onClick={() => {
              if (data.secondary_cta_action === 'scroll') window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
            }}>
              {data.secondary_cta_label}
            </button>
          )}
        </div>
        {data.background_image && (
          <div className="lp-hero-image">
            <img src={data.background_image} alt={data.background_image_alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="eager" />
          </div>
        )}
      </div>
    </header>
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
        {data.description && <p className="lp-reveal" style={{ marginTop: 18, color: 'var(--text-muted)', maxWidth: 560, fontSize: 16, lineHeight: 1.55 }}>{data.description}</p>}
        {embedUrl && (
          <div className="lp-video-wrap lp-reveal">
            <div className="lp-video-frame" style={{ background: '#EDE7DB' }}>
              <iframe src={embedUrl} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy" title={data.title || 'Video'} />
            </div>
          </div>
        )}
        {!embedUrl && (
          <div className="lp-video-wrap lp-reveal">
            <div className="lp-video-frame lp-imgslot" style={{ minHeight: 300 }}>
              <div className="lp-video-play"><div><PlayIcon /></div></div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══ 3. ABOUT ═══ */
export function AboutSection({ data }: SectionProps) {
  if (!data.title && !data.body_rich_text) return null;
  return (
    <section className="lp-section" id="about">
      <div className={`lp-container ${data.side_image ? 'lp-about-grid' : ''}`}>
        <div className="lp-reveal">
          {data.eyebrow && <div className="lp-eyebrow">{data.eyebrow}</div>}
          {data.title && <h2>{data.title}</h2>}
          {data.body_rich_text && <div style={{ marginTop: 32 }} dangerouslySetInnerHTML={{ __html: data.body_rich_text }} />}
        </div>
        {data.side_image && (
          <div className="lp-about-image lp-reveal">
            <img src={data.side_image} alt={data.side_image_alt || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 18 }} loading="lazy" />
          </div>
        )}
      </div>
    </section>
  );
}

/* ═══ 4. ACTIVITIES ═══ */
export function ActivitiesSection({ data }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];
  if (items.length === 0) return null;
  const cols = items.length > 6 ? 4 : 3;

  return (
    <section className="lp-section lp-activities" id="activities">
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-reveal">
            {data.eyebrow && <div className="lp-eyebrow">{data.eyebrow}</div>}
            {data.title && <h2>{data.title}</h2>}
          </div>
        </div>
        <div className="lp-activities-grid" style={cols === 4 ? { gridTemplateColumns: 'repeat(4, 1fr)' } : undefined}>
          {items.map((item, i) => (
            <article key={i} className="lp-activity lp-reveal">
              {item.image ? (
                <div className="lp-activity-img"><img src={item.image} alt={item.image_alt || item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} loading="lazy" /></div>
              ) : (
                <div className="lp-activity-img lp-imgslot">{item.icon || `activity ${i + 1}`}</div>
              )}
              <h3>{item.title}</h3>
              <p>{item.description}</p>
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
  if (images.length === 0) return null;

  return (
    <section className="lp-section" id="gallery">
      <div className="lp-container">
        <div className="lp-section-head">
          <div className="lp-reveal">
            {data.eyebrow && <div className="lp-eyebrow">{data.eyebrow}</div>}
            {data.title && <h2>{data.title}</h2>}
          </div>
        </div>
        <div className="lp-gallery-grid">
          {images.map((img, i) => (
            <div key={i} className="lp-reveal">
              <img src={img.url || img.src} alt={img.alt || `Photo ${i + 1}`} style={{ width: '100%', display: 'block', borderRadius: 10 }} loading="lazy" />
            </div>
          ))}
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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
                <div className="lp-stars" aria-label={`${r.rating} of 5 stars`}>
                  {[0, 1, 2, 3, 4].map(j => <StarIcon key={j} filled={j < Number(r.rating)} />)}
                </div>
                <p>&ldquo;{r.body}&rdquo;</p>
                <div className="lp-review-name">— {r.authorName || r.name}</div>
              </article>
            ))}
          </div>
        )}

        {reviews.length === 0 && !showForm && (
          <div className="lp-reveal" style={{ padding: 60, background: 'var(--surface)', border: '1px dashed var(--border-strong)', borderRadius: 'var(--r-card)', textAlign: 'center', color: 'var(--text-muted)', marginTop: 40 }}>
            {data.empty_text || 'Be the first to leave a note.'}
            <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
              <button className="lp-btn lp-btn-primary" onClick={() => setShowForm(true)}>Leave a review <ArrowIcon /></button>
            </div>
          </div>
        )}

        {!submitted && reviews.length > 0 && !showForm && (
          <div className="lp-reviews-cta lp-reveal">
            <button className="lp-btn lp-btn-secondary" onClick={() => setShowForm(true)}>
              {data.cta_text || 'Leave your own review'} +
            </button>
          </div>
        )}

        {showForm && !submitted && (
          <form onSubmit={handleSubmit} className="lp-form-card lp-reveal" style={{ maxWidth: 620, marginTop: 32 }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 18 }}>Leave a review</h3>
            <div className="lp-field"><label>Your name</label><input required value={formData.authorName} onChange={e => setFormData(p => ({ ...p, authorName: e.target.value }))} /></div>
            <div className="lp-field"><label>Rating</label>
              <div className="lp-stars" style={{ marginTop: 6 }}>
                {[0, 1, 2, 3, 4].map(j => (
                  <button key={j} type="button" onClick={() => setFormData(p => ({ ...p, rating: j + 1 }))} style={{ cursor: 'pointer', padding: 2 }}>
                    <StarIcon filled={j < formData.rating} />
                  </button>
                ))}
              </div>
            </div>
            <div className="lp-field"><label>Your review</label><textarea required rows={4} value={formData.body} onChange={e => setFormData(p => ({ ...p, body: e.target.value }))} /></div>
            {/* honeypot */}
            <input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))} style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1 }} tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <button type="submit" className="lp-btn lp-btn-primary" style={{ marginTop: 6 }}>Submit for review</button>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Reviews appear after the organization approves them.</div>
          </form>
        )}

        {submitted && <p className="lp-reveal" style={{ textAlign: 'center', marginTop: 32, color: 'var(--primary)', fontSize: 18 }}>Thanks — your review is pending approval.</p>}
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
        const dur = 1200;
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          setDisplay(Math.round(final * eased).toLocaleString() + suffix);
          if (p < 1) requestAnimationFrame(tick);
        };
        setDisplay('0' + suffix);
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.6 });

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
        {data.eyebrow && <div className="lp-eyebrow lp-reveal" style={{ color: 'rgba(245,243,238,0.55)', marginBottom: 24 }}>{data.eyebrow}</div>}
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
  const [selected, setSelected] = useState(data.default_amount_index ?? 2);

  return (
    <section className="lp-section lp-cta" id="donate">
      <div className="lp-container">
        {data.eyebrow && <div className="lp-eyebrow lp-cta-eyebrow lp-reveal">{data.eyebrow}</div>}
        <h2 className="lp-reveal">{data.headline || ''}</h2>
        {data.subheadline && <p className="lp-cta-sub lp-reveal">{data.subheadline}</p>}

        <div className="lp-chips lp-reveal" role="radiogroup" aria-label="Donation amount">
          {amounts.map((amt, i) => (
            <button key={amt} className={`lp-chip${selected === i ? ' active' : ''}`} role="radio" aria-checked={selected === i}
              onClick={() => setSelected(i)}>
              ₪{amt.toLocaleString()}
            </button>
          ))}
          {data.allow_custom && (
            <button className={`lp-chip${selected === amounts.length ? ' active' : ''}`} role="radio" aria-checked={selected === amounts.length}
              onClick={() => setSelected(amounts.length)}>
              Other
            </button>
          )}
        </div>

        <div className="lp-cta-go lp-reveal">
          <a href={org.paymentLink || '#'} target="_blank" rel="noopener noreferrer" className="lp-btn lp-btn-primary lp-btn-lg">
            {data.cta_label || 'Donate'} ₪{(amounts[selected] || '').toLocaleString()} <ArrowIcon />
          </a>
        </div>

        <div className="lp-cta-trust lp-reveal">
          <span>🔒 {data.secure_label || 'Secure checkout'}</span>
          <span>·</span>
          {data.installments_hint !== false && <><span>{data.installments_label || 'Up to 12 installments'}</span><span>·</span></>}
          {data.receipt_hint !== false && <span>{data.receipt_label || '§46 tax receipt issued'}</span>}
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fd.get('name'), email: fd.get('email'), phone: fd.get('phone'), message: fd.get('message') }),
      });
      setSubmitted(true);
    } catch { /* silent */ }
  };

  return (
    <section className="lp-section" id="contact">
      <div className="lp-container lp-join-grid">
        <div className="lp-reveal">
          {data.eyebrow && <div className="lp-eyebrow">{data.eyebrow}</div>}
          {data.headline && <h2>{data.headline}</h2>}
          {data.body && <p style={{ marginTop: 22, color: 'var(--text-muted)', fontSize: '16.5px', lineHeight: 1.6, maxWidth: 480 }}>{data.body}</p>}
        </div>
        <form className="lp-form-card lp-reveal" onSubmit={handleSubmit}>
          {!submitted ? (
            <>
              <div className="lp-field"><label>Name</label><input required name="name" type="text" autoComplete="name" /></div>
              <div className="lp-field"><label>Email</label><input required name="email" type="email" autoComplete="email" /></div>
              <div className="lp-field"><label>Phone (optional)</label><input name="phone" type="tel" autoComplete="tel" /></div>
              <div className="lp-field"><label>A note (optional)</label><textarea name="message" rows={3} /></div>
              <button type="submit" className="lp-btn lp-btn-primary lp-btn-lg">{data.submit_label || 'Send'} <ArrowIcon /></button>
            </>
          ) : (
            <div className="lp-form-success">
              <div className="lp-check-circle"><CheckIcon /></div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 28, marginBottom: 8 }}>{data.success_title || 'Got it. Thank you.'}</h3>
              <div style={{ color: 'var(--text-muted)', fontSize: 15 }}>{data.success_message || "We'll reach out to you within a few days."}</div>
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
            <div key={i} className="lp-faq-item lp-reveal" data-open={openIndex === i ? 'true' : 'false'}>
              <button className="lp-faq-q" aria-expanded={openIndex === i} onClick={() => setOpenIndex(openIndex === i ? null : i)}>
                <span>{faq.question || faq.q}</span>
                <span className="chev"><ChevIcon /></span>
              </button>
              <div className="lp-faq-a"><div><p>{faq.answer || faq.a}</p></div></div>
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
      <div className="lp-footer-grid">
        <div>
          <div className="lp-footer-brand">
            {org.logoUrl ? (
              <img src={org.logoUrl} alt="" className="lp-brand-mark" style={{ objectFit: 'contain' }} />
            ) : (
              <div className="lp-brand-mark" />
            )}
            <div className="lp-brand-name">{org.name}</div>
          </div>
          <div className="lp-footer-tag">{data.about || org.name}</div>
        </div>
        {org.address && (
          <div className="lp-footer-col">
            <h4>{data.visit_label || 'Visit'}</h4>
            <div>{org.address}</div>
            {data.hours && <div>{data.hours}</div>}
          </div>
        )}
        <div className="lp-footer-col">
          <h4>{data.contact_label || 'Contact'}</h4>
          {org.contactEmail && <a href={`mailto:${org.contactEmail}`}>{org.contactEmail}</a>}
          {org.contactPhone && <a href={`tel:${org.contactPhone}`}>{org.contactPhone}</a>}
        </div>
        <div className="lp-footer-col">
          <h4>{data.follow_label || 'Follow'}</h4>
          {org.instagramUrl && <a href={org.instagramUrl} target="_blank" rel="noopener noreferrer">Instagram</a>}
          {org.facebookUrl && <a href={org.facebookUrl} target="_blank" rel="noopener noreferrer">Facebook</a>}
          {org.whatsappUrl && <a href={org.whatsappUrl} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
        </div>
      </div>
      <div className="lp-footer-legal">
        <div>
          {org.legalName && <>{org.legalName} · </>}
          {data.registration_number && <>Reg. No. {data.registration_number} · </>}
          {data.section_46 && <>Authorized under §46</>}
        </div>
        <div>Built with Amutot</div>
      </div>
    </footer>
  );
}
