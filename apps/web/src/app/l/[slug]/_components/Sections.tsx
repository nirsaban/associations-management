'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, ChevronDown, Phone, Mail, ExternalLink } from 'lucide-react';
import {
  fadeInUp, fadeIn, scaleIn, staggerContainer,
  cardHover, ctaTap, viewportOnce,
} from '../motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SectionData { [key: string]: any; }

interface SectionProps {
  data: SectionData;
  org: {
    name: string;
    paymentLink?: string;
    contactPhone?: string;
    contactEmail?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    whatsappUrl?: string;
    websiteUrl?: string;
  };
  primaryColor: string;
  accentColor: string;
  slug: string;
}

// ═══════════════════════════════════════════════════════════════════
// HERO — full-width, gradient background, CTA with press state
// ═══════════════════════════════════════════════════════════════════

export function HeroSection({ data, primaryColor, accentColor, org }: SectionProps) {
  const handleCta = () => {
    if (data.cta_action === 'payment' && org.paymentLink) {
      window.open(org.paymentLink, '_blank', 'noopener');
    } else if (data.cta_action === 'external' && data.cta_target) {
      window.open(data.cta_target as string, '_blank', 'noopener');
    } else if (data.cta_action === 'scroll') {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{
        padding: 'var(--lp-section-py) 1.5rem',
        background: `linear-gradient(135deg, ${primaryColor}12, ${accentColor}08, var(--lp-bg))`,
      }}
    >
      <motion.div
        className="mx-auto text-center relative z-10"
        style={{ maxWidth: 'var(--lp-hero-max-w)' }}
        initial="hidden"
        whileInView="visible"
        viewport={viewportOnce}
        variants={staggerContainer}
      >
        {data.eyebrow && (
          <motion.p
            variants={fadeInUp}
            className="uppercase tracking-widest mb-6"
            style={{
              fontSize: 'var(--lp-eyebrow-size)',
              letterSpacing: '0.12em',
              color: primaryColor,
            }}
          >
            {data.eyebrow}
          </motion.p>
        )}

        <motion.h1
          variants={fadeInUp}
          style={{
            fontSize: 'var(--lp-hero-size)',
            fontWeight: 'var(--lp-heading-weight)',
            letterSpacing: 'var(--lp-heading-tracking)',
            lineHeight: 'var(--lp-hero-lh)',
            fontFamily: 'var(--lp-font-heading)',
            color: 'var(--lp-text)',
          }}
          className="mb-6"
        >
          {data.headline || 'ברוכים הבאים'}
        </motion.h1>

        {data.subheadline && (
          <motion.p
            variants={fadeInUp}
            className="mb-10 mx-auto"
            style={{
              fontSize: 'clamp(1.1rem, 2vw, 1.35rem)',
              lineHeight: 'var(--lp-body-lh)',
              color: 'var(--lp-text-secondary)',
              maxWidth: '42rem',
            }}
          >
            {data.subheadline}
          </motion.p>
        )}

        {data.cta_label && (
          <motion.button
            variants={fadeInUp}
            whileTap={ctaTap}
            onClick={handleCta}
            className="px-8 py-4 text-lg font-semibold text-white cursor-pointer"
            style={{
              backgroundColor: primaryColor,
              borderRadius: 'var(--lp-radius-button)',
              boxShadow: `0 4px 14px ${primaryColor}33`,
            }}
          >
            {data.cta_label}
          </motion.button>
        )}
      </motion.div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// VIDEO — privacy-enhanced embed with entrance animation
// ═══════════════════════════════════════════════════════════════════

export function VideoSection({ data }: SectionProps) {
  const getEmbedUrl = () => {
    const url = data.url_or_asset_id as string;
    if (!url) return null;
    if (data.source === 'youtube') {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      const videoId = match?.[1];
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0${data.autoplay ? '&autoplay=1' : ''}${data.muted ? '&mute=1' : ''}`;
    }
    if (data.source === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/);
      const videoId = match?.[1];
      if (videoId) return `https://player.vimeo.com/video/${videoId}?${data.autoplay ? 'autoplay=1&' : ''}${data.muted ? 'muted=1&' : ''}dnt=1`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl();

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportOnce}
      variants={staggerContainer}
      style={{ padding: 'var(--lp-section-py) 1.5rem' }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--lp-max-w)' }}>
        {data.title && (
          <motion.h2 variants={fadeInUp} className="text-center mb-4" style={{
            fontSize: 'var(--lp-section-size)', fontWeight: 'var(--lp-heading-weight)',
            fontFamily: 'var(--lp-font-heading)', color: 'var(--lp-text)',
            letterSpacing: 'var(--lp-heading-tracking)',
          }}>
            {data.title}
          </motion.h2>
        )}
        {data.description && (
          <motion.p variants={fadeInUp} className="text-center mb-10" style={{
            fontSize: 'var(--lp-body-size)', lineHeight: 'var(--lp-body-lh)',
            color: 'var(--lp-text-secondary)', maxWidth: '36rem', margin: '0 auto 2.5rem',
          }}>
            {data.description}
          </motion.p>
        )}
        {embedUrl && (
          <motion.div
            variants={scaleIn}
            className="relative w-full aspect-video overflow-hidden"
            style={{ borderRadius: 'var(--lp-radius-hero)', boxShadow: 'var(--lp-shadow-lg)' }}
          >
            <iframe src={embedUrl} className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture" allowFullScreen loading="lazy"
              title={data.title || 'Video'} />
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ABOUT — text with optional image
// ═══════════════════════════════════════════════════════════════════

export function AboutSection({ data }: SectionProps) {
  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}
      style={{ padding: 'var(--lp-section-py) 1.5rem' }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--lp-max-w)' }}>
        {data.title && (
          <motion.h2 variants={fadeInUp} className="mb-8" style={{
            fontSize: 'var(--lp-section-size)', fontWeight: 'var(--lp-heading-weight)',
            fontFamily: 'var(--lp-font-heading)', color: 'var(--lp-text)',
            letterSpacing: 'var(--lp-heading-tracking)',
          }}>
            {data.title}
          </motion.h2>
        )}
        {data.body_rich_text && (
          <motion.div variants={fadeInUp}
            className="prose prose-lg max-w-none"
            style={{ color: 'var(--lp-text-secondary)', fontSize: 'var(--lp-body-size)', lineHeight: 'var(--lp-body-lh)' }}
            dangerouslySetInnerHTML={{ __html: data.body_rich_text }}
          />
        )}
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ACTIVITIES — staggered card grid with hover lift
// ═══════════════════════════════════════════════════════════════════

export function ActivitiesSection({ data, primaryColor }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}
      style={{ padding: 'var(--lp-section-py) 1.5rem', backgroundColor: 'var(--lp-surface)' }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--lp-max-w)' }}>
        {data.title && (
          <motion.h2 variants={fadeInUp} className="text-center mb-4" style={{
            fontSize: 'var(--lp-section-size)', fontWeight: 'var(--lp-heading-weight)',
            fontFamily: 'var(--lp-font-heading)', color: 'var(--lp-text)',
          }}>
            {data.title}
          </motion.h2>
        )}
        {data.intro && (
          <motion.p variants={fadeInUp} className="text-center mb-12" style={{
            fontSize: 'var(--lp-body-size)', color: 'var(--lp-text-secondary)',
            maxWidth: '36rem', margin: '0 auto 3rem',
          }}>
            {data.intro}
          </motion.p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <motion.div
              key={i} variants={fadeInUp} whileHover={cardHover}
              className="p-6 border"
              style={{
                borderColor: 'var(--lp-border)', borderRadius: 'var(--lp-radius-card)',
                boxShadow: 'var(--lp-shadow-sm)', backgroundColor: 'var(--lp-bg)',
              }}
            >
              <div
                className="w-12 h-12 flex items-center justify-center mb-4 text-2xl"
                style={{ backgroundColor: `${primaryColor}12`, borderRadius: 'var(--lp-radius-button)' }}
              >
                {item.icon || '✦'}
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--lp-text)', fontFamily: 'var(--lp-font-heading)' }}>{item.title}</h3>
              <p style={{ color: 'var(--lp-text-secondary)', fontSize: 'var(--lp-body-size)', lineHeight: 'var(--lp-body-lh)' }}>{item.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// GALLERY — placeholder with animation
// ═══════════════════════════════════════════════════════════════════

export function GallerySection({ data }: SectionProps) {
  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}
      style={{ padding: 'var(--lp-section-py) 1.5rem' }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--lp-max-w)' }}>
        {data.title && (
          <motion.h2 variants={fadeInUp} className="text-center mb-10" style={{
            fontSize: 'var(--lp-section-size)', fontWeight: 'var(--lp-heading-weight)',
            fontFamily: 'var(--lp-font-heading)', color: 'var(--lp-text)',
          }}>
            {data.title}
          </motion.h2>
        )}
        <motion.p variants={fadeIn} className="text-center" style={{ color: 'var(--lp-text-muted)' }}>
          הגלריה תיטען כשתועלנה תמונות
        </motion.p>
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// REVIEWS — testimonial cards with stagger
// ═══════════════════════════════════════════════════════════════════

export function ReviewsSection({ data, primaryColor, accentColor, slug }: SectionProps) {
  const [reviews] = useState<Array<{ id: string; authorName: string; rating: number; body: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ authorName: '', rating: 5, body: '', authorEmail: '', website: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.website) return; // Honeypot
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
      await fetch(`${apiUrl}/public/landing/${slug}/reviews`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
    } catch { /* silently handle */ }
  };

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}
      style={{ padding: 'var(--lp-section-py) 1.5rem', backgroundColor: 'var(--lp-surface)' }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--lp-max-w)' }}>
        <motion.h2 variants={fadeInUp} className="text-center mb-12" style={{
          fontSize: 'var(--lp-section-size)', fontWeight: 'var(--lp-heading-weight)',
          fontFamily: 'var(--lp-font-heading)', color: 'var(--lp-text)',
        }}>
          {data.title || 'מה אומרים עלינו'}
        </motion.h2>

        {reviews.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 mb-12">
            {reviews.map((review) => (
              <motion.div key={review.id} variants={fadeInUp} whileHover={cardHover}
                className="p-6 border" style={{
                  borderColor: 'var(--lp-border)', borderRadius: 'var(--lp-radius-card)',
                  boxShadow: 'var(--lp-shadow-sm)', backgroundColor: 'var(--lp-bg)',
                }}
              >
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} className="h-4 w-4" fill={s <= review.rating ? accentColor : 'none'} stroke={accentColor} />
                  ))}
                </div>
                <p className="mb-3" style={{ color: 'var(--lp-text-secondary)', fontSize: 'var(--lp-body-size)', lineHeight: 'var(--lp-body-lh)' }}>{review.body}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--lp-text)' }}>{review.authorName}</p>
              </motion.div>
            ))}
          </div>
        )}

        {data.show_submit_cta && !submitted && (
          <motion.div variants={fadeInUp} className="text-center">
            {!showForm ? (
              <motion.button whileTap={ctaTap} onClick={() => setShowForm(true)}
                className="px-6 py-3 font-medium cursor-pointer"
                style={{ backgroundColor: `${primaryColor}10`, color: primaryColor, borderRadius: 'var(--lp-radius-button)' }}
              >
                שתפו את חוויתכם
              </motion.button>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto text-start space-y-4">
                <input value={formData.authorName} onChange={e => setFormData(p => ({ ...p, authorName: e.target.value }))}
                  placeholder="שם" required dir="auto"
                  className="w-full px-4 py-3 border outline-none focus:ring-2"
                  style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text)', borderRadius: 'var(--lp-radius-button)', '--tw-ring-color': `${primaryColor}40` } as React.CSSProperties}
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(s => (
                    <button key={s} type="button" onClick={() => setFormData(p => ({ ...p, rating: s }))} className="cursor-pointer">
                      <Star className="h-6 w-6" fill={s <= formData.rating ? accentColor : 'none'} stroke={accentColor} />
                    </button>
                  ))}
                </div>
                <textarea value={formData.body} onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
                  placeholder="שתפו את חוויתכם..." required rows={3} dir="auto"
                  className="w-full px-4 py-3 border resize-y outline-none focus:ring-2"
                  style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text)', borderRadius: 'var(--lp-radius-button)' }}
                />
                <input value={formData.website} onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                  className="absolute opacity-0 h-0 w-0 -z-10" tabIndex={-1} autoComplete="off" aria-hidden="true" />
                <motion.button whileTap={ctaTap} type="submit"
                  className="w-full py-3 font-medium text-white cursor-pointer"
                  style={{ backgroundColor: primaryColor, borderRadius: 'var(--lp-radius-button)' }}
                >שליחה</motion.button>
              </form>
            )}
          </motion.div>
        )}

        {submitted && (
          <motion.p variants={fadeIn} className="text-center text-lg" style={{ color: primaryColor }}>
            תודה! ההמלצה שלכם נשלחה לאישור.
          </motion.p>
        )}
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// STATS — animated numbers band
// ═══════════════════════════════════════════════════════════════════

export function StatsSection({ data, primaryColor }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}
      style={{
        padding: 'var(--lp-section-py) 1.5rem',
        background: `linear-gradient(135deg, ${primaryColor}06, ${primaryColor}02)`,
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--lp-max-w)' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <motion.div key={i} variants={fadeInUp} className="text-center">
              <p className="font-bold mb-2" style={{
                fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: primaryColor,
                fontFamily: 'var(--lp-font-heading)',
              }}>
                {item.number}
              </p>
              <p style={{ color: 'var(--lp-text-secondary)', fontSize: 'var(--lp-body-size)' }}>
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// CTA PAYMENT — full-bleed primary color with color-tinted shadow
// ═══════════════════════════════════════════════════════════════════

export function CtaPaymentSection({ data, primaryColor, org }: SectionProps) {
  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}
      className="text-center"
      style={{ padding: 'clamp(5rem, 12vw, 10rem) 1.5rem', backgroundColor: primaryColor }}
    >
      <div className="mx-auto" style={{ maxWidth: '40rem' }}>
        <motion.h2 variants={fadeInUp} className="text-white mb-4" style={{
          fontSize: 'var(--lp-section-size)', fontWeight: 'var(--lp-heading-weight)',
          fontFamily: 'var(--lp-font-heading)',
        }}>
          {data.headline || 'תרמו עכשיו'}
        </motion.h2>

        {data.subheadline && (
          <motion.p variants={fadeInUp} className="text-white/80 mb-10" style={{
            fontSize: 'clamp(1rem, 2vw, 1.25rem)', lineHeight: 'var(--lp-body-lh)',
          }}>
            {data.subheadline}
          </motion.p>
        )}

        <motion.a
          variants={fadeInUp}
          whileTap={ctaTap}
          href={org.paymentLink || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-10 py-4 text-lg font-semibold cursor-pointer"
          style={{
            backgroundColor: '#ffffff',
            color: primaryColor,
            borderRadius: 'var(--lp-radius-button)',
            boxShadow: `0 4px 14px ${primaryColor}55`,
          }}
        >
          {data.button_label || 'לתרומה'}
        </motion.a>

        {data.installments_hint && (
          <motion.p variants={fadeIn} className="text-sm text-white/60 mt-4">
            ניתן לפרוס לתשלומים
          </motion.p>
        )}
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// JOIN US — lead capture form
// ═══════════════════════════════════════════════════════════════════

export function JoinUsSection({ data, primaryColor, slug }: SectionProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
      await fetch(`${apiUrl}/public/landing/${slug}/leads`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
    } catch { setError('שגיאה בשליחה, נסו שוב'); }
  };

  if (submitted) {
    return (
      <motion.section initial="hidden" animate="visible" variants={fadeIn}
        className="text-center" style={{ padding: 'var(--lp-section-py) 1.5rem', backgroundColor: 'var(--lp-surface)' }}>
        <p className="text-2xl font-semibold" style={{ color: primaryColor, fontFamily: 'var(--lp-font-heading)' }}>
          {data.success_message || 'תודה! נחזור אליכם בהקדם.'}
        </p>
      </motion.section>
    );
  }

  const inputStyle: React.CSSProperties = {
    borderColor: 'var(--lp-border)', color: 'var(--lp-text)',
    borderRadius: 'var(--lp-radius-button)', backgroundColor: 'var(--lp-bg)',
  };

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}
      style={{ padding: 'var(--lp-section-py) 1.5rem', backgroundColor: 'var(--lp-surface)' }}
    >
      <div className="mx-auto" style={{ maxWidth: '32rem' }}>
        {data.headline && (
          <motion.h2 variants={fadeInUp} className="text-center mb-4" style={{
            fontSize: 'var(--lp-section-size)', fontWeight: 'var(--lp-heading-weight)',
            fontFamily: 'var(--lp-font-heading)', color: 'var(--lp-text)',
          }}>
            {data.headline}
          </motion.h2>
        )}
        {data.body && (
          <motion.p variants={fadeInUp} className="text-center mb-8" style={{
            color: 'var(--lp-text-secondary)', fontSize: 'var(--lp-body-size)',
          }}>
            {data.body}
          </motion.p>
        )}
        <motion.form variants={fadeInUp} onSubmit={handleSubmit} className="space-y-4">
          <input value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
            placeholder="שם מלא" required dir="auto" className="w-full px-4 py-3 border outline-none focus:ring-2" style={inputStyle} />
          <input value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
            placeholder="אימייל" type="email" dir="ltr" className="w-full px-4 py-3 border outline-none focus:ring-2" style={inputStyle} />
          <input value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
            placeholder="טלפון" type="tel" dir="ltr" className="w-full px-4 py-3 border outline-none focus:ring-2" style={inputStyle} />
          <textarea value={formData.message} onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
            placeholder="הודעה (אופציונלי)" rows={3} dir="auto" className="w-full px-4 py-3 border resize-y outline-none focus:ring-2" style={inputStyle} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <motion.button whileTap={ctaTap} type="submit"
            className="w-full py-3 font-medium text-white cursor-pointer"
            style={{ backgroundColor: primaryColor, borderRadius: 'var(--lp-radius-button)', boxShadow: `0 4px 14px ${primaryColor}33` }}
          >שליחה</motion.button>
        </motion.form>
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FAQ — animated accordion
// ═══════════════════════════════════════════════════════════════════

export function FaqSection({ data }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportOnce} variants={staggerContainer}
      style={{ padding: 'var(--lp-section-py) 1.5rem' }}
    >
      <div className="mx-auto" style={{ maxWidth: '48rem' }}>
        <motion.h2 variants={fadeInUp} className="text-center mb-12" style={{
          fontSize: 'var(--lp-section-size)', fontWeight: 'var(--lp-heading-weight)',
          fontFamily: 'var(--lp-font-heading)', color: 'var(--lp-text)',
        }}>
          שאלות ותשובות
        </motion.h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div key={i} variants={fadeInUp}
              className="border overflow-hidden"
              style={{ borderColor: 'var(--lp-border)', borderRadius: 'var(--lp-radius-card)' }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-start cursor-pointer"
              >
                <span className="font-medium" style={{
                  color: 'var(--lp-text)', fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
                  fontFamily: 'var(--lp-font-heading)',
                }}>{item.q}</span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex-shrink-0 ms-4"
                >
                  <ChevronDown className="h-5 w-5" style={{ color: 'var(--lp-text-muted)' }} />
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5" style={{
                      color: 'var(--lp-text-secondary)', fontSize: 'var(--lp-body-size)',
                      lineHeight: 'var(--lp-body-lh)',
                    }}>
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FOOTER — subtle entrance
// ═══════════════════════════════════════════════════════════════════

export function FooterSection({ data, org }: SectionProps) {
  return (
    <motion.footer
      initial="hidden" whileInView="visible" viewport={viewportOnce} variants={fadeIn}
      className="border-t"
      style={{
        borderColor: 'var(--lp-border)', backgroundColor: 'var(--lp-surface)',
        padding: 'clamp(3rem, 6vw, 5rem) 1.5rem',
      }}
    >
      <div className="mx-auto" style={{ maxWidth: 'var(--lp-max-w)' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.show_contact !== false && (
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--lp-text)', fontFamily: 'var(--lp-font-heading)' }}>צרו קשר</h3>
              <div className="space-y-2">
                {org.contactPhone && (
                  <a href={`tel:${org.contactPhone}`} className="flex items-center gap-2 hover:underline" style={{ color: 'var(--lp-text-secondary)' }}>
                    <Phone className="h-4 w-4" /> {org.contactPhone}
                  </a>
                )}
                {org.contactEmail && (
                  <a href={`mailto:${org.contactEmail}`} className="flex items-center gap-2 hover:underline" style={{ color: 'var(--lp-text-secondary)' }}>
                    <Mail className="h-4 w-4" /> {org.contactEmail}
                  </a>
                )}
              </div>
            </div>
          )}
          {data.show_social !== false && (
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--lp-text)', fontFamily: 'var(--lp-font-heading)' }}>עקבו אחרינו</h3>
              <div className="flex gap-3">
                {org.facebookUrl && <a href={org.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:opacity-70 transition-opacity"><ExternalLink className="h-5 w-5" style={{ color: 'var(--lp-text-secondary)' }} /></a>}
                {org.instagramUrl && <a href={org.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:opacity-70 transition-opacity"><ExternalLink className="h-5 w-5" style={{ color: 'var(--lp-text-secondary)' }} /></a>}
                {org.whatsappUrl && <a href={org.whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:opacity-70 transition-opacity"><ExternalLink className="h-5 w-5" style={{ color: 'var(--lp-text-secondary)' }} /></a>}
              </div>
            </div>
          )}
        </div>
        {data.custom_text && <p className="mt-8 text-sm text-center" style={{ color: 'var(--lp-text-muted)' }}>{data.custom_text}</p>}
        <p className="mt-8 text-xs text-center" style={{ color: 'var(--lp-text-muted)' }}>&copy; {new Date().getFullYear()} {org.name}</p>
      </div>
    </motion.footer>
  );
}
