'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  Star,
  Phone,
  Mail,
  ExternalLink,
  Lock,
  Play,
} from 'lucide-react';
import {
  entranceVariants,
  staggerVariants,
  viewportConfig,
  pressTap,
  hoverLift,
  EASE,
} from '../motion';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface SectionData { [key: string]: any; }

interface SectionProps {
  data: SectionData;
  org: {
    name: string;
    legalName?: string;
    registrationNumber?: string;
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

/* ── shared styles ────────────────────────────────────────────────── */

const sectionPadding: React.CSSProperties = {
  padding: 'var(--section-y) max(6vw, 32px)',
};

const innerMax: React.CSSProperties = {
  maxWidth: 1280,
  margin: '0 auto',
};

const eyebrowStyle: React.CSSProperties = {
  fontSize: 'var(--t-label)',
  textTransform: 'uppercase',
  letterSpacing: '1.8px',
  color: 'var(--text-muted)',
};

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: 'var(--t-display-lg)',
  lineHeight: 1.02,
  letterSpacing: '-1px',
  fontWeight: 400,
};

/* ── helper: count-up hook ────────────────────────────────────────── */

function useCountUp(target: number, duration: number = 1.2, inView: boolean) {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number>();

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = (now - start) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      setValue(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(step);
      }
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [inView, target, duration]);

  return value;
}

function StatNumber({ value, inView }: { value: string; inView: boolean }) {
  const numeric = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const prefix = value.match(/^[^0-9]*/)?.[0] || '';
  const suffix = value.match(/[^0-9]*$/)?.[0] || '';
  const count = useCountUp(isNaN(numeric) ? 0 : numeric, 1.2, inView);

  if (isNaN(numeric)) return <>{value}</>;
  return <>{prefix}{count.toLocaleString()}{suffix}</>;
}

/* ════════════════════════════════════════════════════════════════════
   1. HERO
   ════════════════════════════════════════════════════════════════════ */

export function HeroSection({ data, primaryColor, accentColor, org }: SectionProps) {
  const handleCta = () => {
    if (data.cta_action === 'payment' && org.paymentLink) {
      window.open(org.paymentLink, '_blank', 'noopener');
    } else if (data.cta_action === 'link' && data.cta_target) {
      window.open(data.cta_target as string, '_blank', 'noopener');
    } else if (data.cta_action === 'scroll') {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  const handleSecondaryCta = () => {
    if (data.secondary_cta_action === 'payment' && org.paymentLink) {
      window.open(org.paymentLink, '_blank', 'noopener');
    } else if (data.secondary_cta_action === 'link' && data.secondary_cta_target) {
      window.open(data.secondary_cta_target as string, '_blank', 'noopener');
    } else if (data.secondary_cta_action === 'scroll') {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={viewportConfig}
      variants={staggerVariants}
      style={{
        ...sectionPadding,
        position: 'relative',
        overflow: 'hidden',
        minHeight: '85vh',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Gradient mesh background */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', filter: 'blur(10px)',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%', width: '60%', height: '80%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${primaryColor}18, transparent 70%)`,
        }} />
        <div style={{
          position: 'absolute', bottom: '-10%', left: '-5%', width: '50%', height: '70%',
          borderRadius: '50%',
          background: `radial-gradient(ellipse at center, ${accentColor}12, transparent 70%)`,
        }} />
      </div>

      <div style={{ ...innerMax, position: 'relative', zIndex: 1, width: '100%' }}>
        {/* Eyebrow */}
        <motion.div
          variants={entranceVariants}
          style={eyebrowStyle}
        >
          {data.eyebrow || ''}
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={entranceVariants}
          transition={{ duration: 0.48, ease: EASE.emphasized }}
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'var(--t-display-xl)',
            lineHeight: 0.98,
            letterSpacing: '-0.02em',
            fontWeight: 400,
            textWrap: 'balance' as React.CSSProperties['textWrap'],
            marginTop: 20,
          }}
        >
          {data.headline || ''}
        </motion.h1>

        {/* Subheadline */}
        {data.subheadline && (
          <motion.p
            variants={entranceVariants}
            transition={{ duration: 0.28, delay: 0.08, ease: EASE.emphasized }}
            style={{
              fontFamily: 'var(--font-body)',
              fontSize: 'var(--t-body-lg)',
              color: 'var(--text-muted)',
              maxWidth: 560,
              marginTop: 24,
              lineHeight: 1.6,
            }}
          >
            {data.subheadline}
          </motion.p>
        )}

        {/* CTAs */}
        <motion.div
          variants={entranceVariants}
          transition={{ duration: 0.28, delay: 0.16, ease: EASE.emphasized }}
          style={{ display: 'flex', gap: 16, marginTop: 40, flexWrap: 'wrap' }}
        >
          {data.cta_label && (
            <motion.button
              whileHover={hoverLift}
              whileTap={pressTap}
              onClick={handleCta}
              style={{
                background: 'var(--primary)',
                color: '#fff',
                borderRadius: 'var(--r-btn)',
                boxShadow: 'var(--e-cta)',
                padding: '14px 36px',
                fontSize: 'var(--t-body)',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              {data.cta_label}
              <ArrowRight style={{ width: 18, height: 18 }} />
            </motion.button>
          )}

          {data.secondary_cta_label && (
            <motion.button
              whileHover={hoverLift}
              whileTap={pressTap}
              onClick={handleSecondaryCta}
              style={{
                background: 'transparent',
                color: 'var(--text)',
                borderRadius: 'var(--r-btn)',
                padding: '14px 36px',
                fontSize: 'var(--t-body)',
                fontWeight: 500,
                border: 'none',
                cursor: 'pointer',
              }}
            >
              {data.secondary_cta_label}
            </motion.button>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   2. VIDEO
   ════════════════════════════════════════════════════════════════════ */

export function VideoSection({ data }: SectionProps) {
  const [playing, setPlaying] = useState(false);

  const getEmbedUrl = () => {
    const url = data.url_or_asset_id as string;
    if (!url) return null;
    if (data.source === 'youtube') {
      const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
      const videoId = match?.[1];
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&autoplay=1`;
    }
    if (data.source === 'vimeo') {
      const match = url.match(/vimeo\.com\/(\d+)/);
      const videoId = match?.[1];
      if (videoId) return `https://player.vimeo.com/video/${videoId}?autoplay=1&dnt=1`;
    }
    return url;
  };

  const embedUrl = getEmbedUrl();

  const aspectMap: Record<string, string> = { '16:9': '56.25%', '9:16': '177.78%', '1:1': '100%' };
  const aspect = aspectMap[data.aspect_ratio as string] || '56.25%';

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportConfig}
      variants={staggerVariants}
      style={sectionPadding}
    >
      <div style={innerMax}>
        <motion.div variants={entranceVariants} style={eyebrowStyle}>
          {data.eyebrow || ''}
        </motion.div>

        {data.title && (
          <motion.h2 variants={entranceVariants} style={{ ...headingStyle, marginTop: 16, marginBottom: 16 }}>
            {data.title}
          </motion.h2>
        )}

        {data.description && (
          <motion.p variants={entranceVariants} style={{
            fontSize: 'var(--t-body)', color: 'var(--text-muted)', maxWidth: 560, marginBottom: 40, lineHeight: 1.6,
          }}>
            {data.description}
          </motion.p>
        )}

        {embedUrl && (
          <motion.div
            variants={entranceVariants}
            style={{
              position: 'relative',
              width: '100%',
              maxWidth: 960,
              margin: '0 auto',
              paddingBottom: aspect,
              borderRadius: 'var(--r-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--e-4)',
            }}
          >
            {playing ? (
              <iframe
                src={embedUrl}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                loading="lazy"
                title={data.title || 'Video'}
              />
            ) : (
              <button
                onClick={() => setPlaying(true)}
                style={{
                  position: 'absolute', inset: 0, width: '100%', height: '100%',
                  background: 'var(--surface-raised)', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {data.thumbnail_url && (
                  <img
                    src={data.thumbnail_url as string}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
                <div style={{
                  width: 72, height: 72, borderRadius: '50%', background: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--e-3)', position: 'relative', zIndex: 1,
                }}>
                  <Play style={{ width: 28, height: 28, color: 'var(--text)', marginInlineStart: 4 }} />
                </div>
              </button>
            )}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   3. ABOUT
   ════════════════════════════════════════════════════════════════════ */

export function AboutSection({ data }: SectionProps) {
  const hasImage = Boolean(data.image_url);

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportConfig} variants={staggerVariants}
      style={sectionPadding}
    >
      <div style={{
        ...innerMax,
        display: hasImage ? 'grid' : 'block',
        gridTemplateColumns: hasImage ? '1.1fr 1fr' : undefined,
        gap: hasImage ? 48 : undefined,
        alignItems: 'center',
      }}>
        <div style={!hasImage ? { maxWidth: '62ch', margin: '0 auto' } : undefined}>
          <motion.div variants={entranceVariants} style={eyebrowStyle}>
            {data.eyebrow || ''}
          </motion.div>

          {data.title && (
            <motion.h2 variants={entranceVariants} style={{ ...headingStyle, marginTop: 16, marginBottom: 24 }}>
              {data.title}
            </motion.h2>
          )}

          {data.body_rich_text && (
            <motion.div
              variants={entranceVariants}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 'var(--t-body)',
                lineHeight: 1.7,
                color: 'var(--text-muted)',
              }}
              dangerouslySetInnerHTML={{ __html: data.body_rich_text }}
            />
          )}
        </div>

        {hasImage && (
          <motion.div variants={entranceVariants}>
            <img
              src={data.image_url as string}
              alt={data.image_alt as string || ''}
              style={{
                width: '100%',
                aspectRatio: '4/5',
                objectFit: 'cover',
                borderRadius: 'var(--r-card)',
              }}
            />
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   4. ACTIVITIES
   ════════════════════════════════════════════════════════════════════ */

export function ActivitiesSection({ data }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];
  const colCount = items.length >= 7 ? 4 : 3;

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportConfig} variants={staggerVariants}
      style={{ ...sectionPadding, backgroundColor: 'var(--surface-raised)' }}
    >
      <div style={innerMax}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40 }}>
          <div>
            <motion.div variants={entranceVariants} style={eyebrowStyle}>
              {data.eyebrow || ''}
            </motion.div>
            {data.title && (
              <motion.h2 variants={entranceVariants} style={{ ...headingStyle, marginTop: 16 }}>
                {data.title}
              </motion.h2>
            )}
          </div>
          {data.see_all_link && (
            <motion.a
              variants={entranceVariants}
              whileHover={hoverLift}
              whileTap={pressTap}
              href={data.see_all_link as string}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                color: 'var(--text)',
                borderRadius: 'var(--r-btn)',
                padding: '10px 24px',
                fontSize: 'var(--t-body-sm)',
                fontWeight: 500,
                textDecoration: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {data.see_all_label || 'ראה הכל'}
            </motion.a>
          )}
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${colCount}, 1fr)`,
          gap: 20,
        }}>
          {items.slice(0, 12).map((item, i) => (
            <motion.div
              key={i}
              variants={entranceVariants}
              whileHover={{ ...hoverLift, boxShadow: 'var(--e-3)' }}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-card)',
                padding: 22,
                boxShadow: 'var(--e-2)',
                cursor: 'default',
                transition: 'box-shadow 0.16s',
              }}
            >
              {item.image_url && (
                <img
                  src={item.image_url}
                  alt={item.title || ''}
                  style={{
                    width: '100%',
                    aspectRatio: '4/3',
                    objectFit: 'cover',
                    borderRadius: 'var(--r-md)',
                    marginBottom: 16,
                  }}
                />
              )}
              <h3 style={{
                fontSize: 18, fontWeight: 500,
                fontFamily: 'var(--font-body)',
                marginBottom: 8,
              }}>
                {item.title}
              </h3>
              <p style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
              }}>
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   5. GALLERY
   ════════════════════════════════════════════════════════════════════ */

export function GallerySection({ data }: SectionProps) {
  const images = (data.images as Array<{ url: string; alt?: string }>) || [];

  const isInlineRow = images.length >= 1 && images.length <= 3;

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportConfig} variants={staggerVariants}
      style={sectionPadding}
    >
      <div style={innerMax}>
        <motion.div variants={entranceVariants} style={eyebrowStyle}>
          {data.eyebrow || ''}
        </motion.div>

        {data.title && (
          <motion.h2 variants={entranceVariants} style={{ ...headingStyle, marginTop: 16, marginBottom: 40 }}>
            {data.title}
          </motion.h2>
        )}

        {images.length === 0 && (
          <motion.p variants={entranceVariants} style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
            הגלריה תיטען כשתועלנה תמונות
          </motion.p>
        )}

        {isInlineRow && images.length > 0 && (
          <motion.div
            variants={entranceVariants}
            style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.alt || ''}
                style={{
                  borderRadius: 'var(--r-md)',
                  maxHeight: 400,
                  objectFit: 'cover',
                  flex: '1 1 auto',
                  maxWidth: images.length === 1 ? '100%' : `${90 / images.length}%`,
                }}
              />
            ))}
          </motion.div>
        )}

        {!isInlineRow && images.length > 0 && (
          <motion.div
            variants={entranceVariants}
            style={{
              columns: 4,
              columnGap: 12,
            }}
            className="gallery-masonry"
          >
            <style>{`
              .gallery-masonry { columns: 4; }
              @media (max-width: 1024px) { .gallery-masonry { columns: 3; } }
              @media (max-width: 640px) { .gallery-masonry { columns: 2; } }
            `}</style>
            {images.map((img, i) => (
              <img
                key={i}
                src={img.url}
                alt={img.alt || ''}
                style={{
                  borderRadius: 'var(--r-md)',
                  width: '100%',
                  marginBottom: 12,
                  display: 'block',
                }}
              />
            ))}
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   6. REVIEWS
   ════════════════════════════════════════════════════════════════════ */

export function ReviewsSection({ data, slug }: SectionProps) {
  const reviews = (data.reviews as Array<{ id?: string; authorName: string; rating: number; body: string }>) || [];
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ authorName: '', rating: 5, body: '', authorEmail: '', website: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.website) return; // honeypot
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
      await fetch(`${apiUrl}/public/landing/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: formData.authorName, rating: formData.rating, body: formData.body }),
      });
      setSubmitted(true);
    } catch { /* silently handle */ }
  };

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportConfig} variants={staggerVariants}
      style={sectionPadding}
    >
      <div style={innerMax}>
        <motion.div variants={entranceVariants} style={eyebrowStyle}>
          {data.eyebrow || ''}
        </motion.div>

        <motion.h2 variants={entranceVariants} style={{ ...headingStyle, marginTop: 16, marginBottom: 48 }}>
          {data.title || 'מה אומרים עלינו'}
        </motion.h2>

        {reviews.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {reviews.map((review, i) => (
              <motion.div
                key={review.id || i}
                variants={entranceVariants}
                whileHover={hoverLift}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-card)',
                  padding: 26,
                }}
              >
                <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star
                      key={s}
                      style={{ width: 16, height: 16, color: 'var(--primary)' }}
                      fill={s <= review.rating ? 'var(--primary)' : 'none'}
                      stroke="var(--primary)"
                    />
                  ))}
                </div>
                <p style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 22,
                  lineHeight: 1.45,
                  marginBottom: 16,
                  fontWeight: 400,
                }}>
                  &ldquo;{review.body}&rdquo;
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  &mdash; {review.authorName}
                </p>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            variants={entranceVariants}
            style={{
              border: '2px dashed var(--border)',
              borderRadius: 'var(--r-card)',
              padding: 40,
              textAlign: 'center',
              color: 'var(--text-muted)',
            }}
          >
            היו הראשונים להשאיר ביקורת
          </motion.div>
        )}

        {/* Inline review form */}
        {data.show_submit_cta && !submitted && (
          <motion.div variants={entranceVariants} style={{ marginTop: 40, textAlign: 'center' }}>
            {!showForm ? (
              <motion.button
                whileHover={hoverLift}
                whileTap={pressTap}
                onClick={() => setShowForm(true)}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-btn)',
                  padding: '12px 32px',
                  color: 'var(--text)',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                שתפו את חוויתכם
              </motion.button>
            ) : (
              <form onSubmit={handleSubmit} style={{ maxWidth: 480, margin: '0 auto', textAlign: 'start' }}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 'var(--t-body-sm)', marginBottom: 6, fontWeight: 500 }}>שם</label>
                  <input
                    value={formData.authorName}
                    onChange={e => setFormData(p => ({ ...p, authorName: e.target.value }))}
                    required
                    dir="auto"
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)', color: 'var(--text)',
                      fontSize: 'var(--t-body)',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 'var(--t-body-sm)', marginBottom: 6, fontWeight: 500 }}>דירוג</label>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, rating: s }))}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
                      >
                        <Star
                          style={{ width: 24, height: 24, color: 'var(--primary)' }}
                          fill={s <= formData.rating ? 'var(--primary)' : 'none'}
                          stroke="var(--primary)"
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 'var(--t-body-sm)', marginBottom: 6, fontWeight: 500 }}>תוכן</label>
                  <textarea
                    value={formData.body}
                    onChange={e => setFormData(p => ({ ...p, body: e.target.value }))}
                    required
                    rows={3}
                    dir="auto"
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)', color: 'var(--text)',
                      fontSize: 'var(--t-body)', resize: 'vertical',
                    }}
                  />
                </div>

                {/* Honeypot */}
                <input
                  value={formData.website}
                  onChange={e => setFormData(p => ({ ...p, website: e.target.value }))}
                  style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -10 }}
                  tabIndex={-1} autoComplete="off" aria-hidden="true"
                />

                <motion.button
                  whileTap={pressTap}
                  type="submit"
                  style={{
                    width: '100%', padding: '14px 0',
                    background: 'var(--primary)', color: '#fff',
                    borderRadius: 'var(--r-btn)', border: 'none',
                    fontWeight: 500, cursor: 'pointer',
                    boxShadow: 'var(--e-cta)',
                  }}
                >
                  שליחה
                </motion.button>
              </form>
            )}
          </motion.div>
        )}

        {submitted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ textAlign: 'center', marginTop: 40 }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--primary-50)', margin: '0 auto 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--primary)', fontSize: 24,
            }}>
              ✓
            </div>
            <p style={{ fontSize: 'var(--t-body-lg)', fontWeight: 500 }}>
              קיבלנו. תודה!
            </p>
          </motion.div>
        )}
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   7. STATS — dark band with count-up numbers
   ════════════════════════════════════════════════════════════════════ */

export function StatsSection({ data }: SectionProps) {
  const items = (data.items as Array<{ number: string; label: string }>) || [];
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.25 });

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportConfig} variants={staggerVariants}
      style={{
        ...sectionPadding,
        backgroundColor: 'var(--text)',
        color: '#F5F3EE',
      }}
    >
      <div ref={ref} style={innerMax}>
        <motion.div variants={entranceVariants} style={{ ...eyebrowStyle, color: 'rgba(245,243,238,0.55)' }}>
          {data.eyebrow || ''}
        </motion.div>

        {data.title && (
          <motion.h2 variants={entranceVariants} style={{
            ...headingStyle,
            color: '#F5F3EE',
            marginTop: 16,
            marginBottom: 48,
          }}>
            {data.title}
          </motion.h2>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(Math.max(items.length, 1), 5)}, 1fr)`,
          gap: 32,
        }}>
          {items.map((item, i) => (
            <motion.div
              key={i}
              variants={entranceVariants}
              style={{
                borderTop: '1px solid rgba(245,243,238,0.15)',
                paddingTop: 22,
              }}
            >
              <p style={{
                fontFamily: 'var(--font-display)',
                fontSize: 84,
                fontWeight: 400,
                letterSpacing: '-2px',
                lineHeight: 1,
                marginBottom: 8,
              }}>
                <StatNumber value={item.number} inView={inView} />
              </p>
              <p style={{ opacity: 0.65, fontSize: 15 }}>
                {item.label}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   8. CTA PAYMENT
   ════════════════════════════════════════════════════════════════════ */

export function CtaPaymentSection({ data, org }: SectionProps) {
  const amounts = (data.amount_options as Array<{ value: number; label: string }>) || [];
  const [selectedAmount, setSelectedAmount] = useState<number | null>(
    amounts.length > 0 ? amounts[0].value : null
  );

  const handleDonate = () => {
    if (org.paymentLink) {
      const url = selectedAmount
        ? `${org.paymentLink}${org.paymentLink.includes('?') ? '&' : '?'}amount=${selectedAmount}`
        : org.paymentLink;
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportConfig} variants={staggerVariants}
      style={{
        ...sectionPadding,
        backgroundColor: 'var(--primary-50)',
        textAlign: 'center',
      }}
    >
      <div style={{ ...innerMax, maxWidth: 960 }}>
        <motion.div variants={entranceVariants} style={{ ...eyebrowStyle, color: 'var(--primary)' }}>
          {data.eyebrow || ''}
        </motion.div>

        <motion.h2 variants={entranceVariants} style={{
          fontFamily: 'var(--font-display)',
          fontSize: 'clamp(2.5rem, 4vw + 1rem, 4.5rem)',
          lineHeight: 1.02,
          letterSpacing: '-1px',
          fontWeight: 400,
          marginTop: 16,
          marginBottom: 32,
        }}>
          {data.headline || 'תרמו עכשיו'}
        </motion.h2>

        {data.subheadline && (
          <motion.p variants={entranceVariants} style={{
            fontSize: 'var(--t-body-lg)',
            color: 'var(--text-muted)',
            maxWidth: 560,
            margin: '0 auto 40px',
            lineHeight: 1.6,
          }}>
            {data.subheadline}
          </motion.p>
        )}

        {/* Amount chips */}
        {amounts.length > 0 && (
          <motion.div variants={entranceVariants} style={{
            display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 32,
          }}>
            {amounts.map((a) => {
              const isSelected = selectedAmount === a.value;
              return (
                <motion.button
                  key={a.value}
                  whileHover={hoverLift}
                  whileTap={pressTap}
                  onClick={() => setSelectedAmount(a.value)}
                  style={{
                    background: isSelected ? 'var(--primary)' : 'var(--surface)',
                    color: isSelected ? '#fff' : 'var(--text)',
                    border: isSelected ? 'none' : '1px solid var(--border)',
                    borderRadius: 'var(--r-btn)',
                    padding: '12px 28px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    boxShadow: isSelected ? 'var(--e-cta)' : 'none',
                    fontSize: 'var(--t-body)',
                  }}
                >
                  {a.label}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        <motion.button
          variants={entranceVariants}
          whileHover={hoverLift}
          whileTap={pressTap}
          onClick={handleDonate}
          style={{
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: 'var(--r-btn)',
            padding: '16px 48px',
            fontSize: 'var(--t-body-lg)',
            fontWeight: 500,
            border: 'none',
            cursor: 'pointer',
            boxShadow: 'var(--e-cta)',
          }}
        >
          {data.button_label || 'לתרומה'}
        </motion.button>

        {/* Trust row */}
        <motion.div variants={entranceVariants} style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 24, marginTop: 28, flexWrap: 'wrap',
          fontSize: 'var(--t-body-sm)', color: 'var(--text-muted)',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Lock style={{ width: 14, height: 14 }} />
            תשלום מאובטח
          </span>
          {data.show_installments !== false && (
            <span>עד 12 תשלומים</span>
          )}
          {data.show_tax_receipt !== false && (
            <span>קבלה לפי סעיף 46</span>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   9. JOIN US — two-column with form card
   ════════════════════════════════════════════════════════════════════ */

export function JoinUsSection({ data, slug }: SectionProps) {
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
      await fetch(`${apiUrl}/public/landing/${slug}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
    } catch {
      setError('שגיאה בשליחה, נסו שוב');
    }
  };

  const inputContainerStyle: React.CSSProperties = { marginBottom: 16 };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 'var(--t-body-sm)',
    marginBottom: 6, fontWeight: 500,
  };
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '12px 14px',
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 'var(--r-md)', color: 'var(--text)',
    fontSize: 'var(--t-body)',
  };

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportConfig} variants={staggerVariants}
      style={sectionPadding}
    >
      <div style={{
        ...innerMax,
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 48,
        alignItems: 'center',
      }}>
        {/* Copy */}
        <div>
          <motion.div variants={entranceVariants} style={eyebrowStyle}>
            {data.eyebrow || ''}
          </motion.div>
          {data.headline && (
            <motion.h2 variants={entranceVariants} style={{ ...headingStyle, marginTop: 16, marginBottom: 20 }}>
              {data.headline}
            </motion.h2>
          )}
          {data.body && (
            <motion.p variants={entranceVariants} style={{
              fontSize: 'var(--t-body)', color: 'var(--text-muted)', lineHeight: 1.7,
            }}>
              {data.body}
            </motion.p>
          )}
        </div>

        {/* Form card */}
        <motion.div
          variants={entranceVariants}
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-xl)',
            padding: 32,
          }}
        >
          {submitted ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%',
                background: 'var(--primary-50)', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--primary)', fontSize: 28,
              }}>
                ✓
              </div>
              <p style={{ fontSize: 'var(--t-body-lg)', fontWeight: 500 }}>
                {data.success_message || 'קיבלנו. תודה!'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>שם מלא</label>
                <input
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  required dir="auto" style={inputStyle}
                />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>אימייל</label>
                <input
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  type="email" dir="ltr" style={inputStyle}
                />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>טלפון</label>
                <input
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  type="tel" dir="ltr" style={inputStyle}
                />
              </div>
              <div style={inputContainerStyle}>
                <label style={labelStyle}>הודעה</label>
                <textarea
                  value={formData.message}
                  onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  rows={3} dir="auto" style={{ ...inputStyle, resize: 'vertical' }}
                />
              </div>

              {error && <p style={{ color: '#c33', fontSize: 'var(--t-body-sm)', marginBottom: 12 }}>{error}</p>}

              <motion.button
                whileTap={pressTap}
                type="submit"
                style={{
                  width: '100%', padding: '14px 0',
                  background: 'var(--primary)', color: '#fff',
                  borderRadius: 'var(--r-btn)', border: 'none',
                  fontWeight: 500, cursor: 'pointer',
                  boxShadow: 'var(--e-cta)',
                }}
              >
                {data.button_label || 'שליחה'}
              </motion.button>
            </form>
          )}
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   10. FAQ — two-column with accordion
   ════════════════════════════════════════════════════════════════════ */

export function FaqSection({ data }: SectionProps) {
  const items = (data.items as Array<{ q: string; a: string }>) || [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <motion.section
      initial="hidden" whileInView="visible" viewport={viewportConfig} variants={staggerVariants}
      style={sectionPadding}
    >
      <div style={{ ...innerMax, display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48, alignItems: 'start' }}>
        {/* Title column */}
        <div>
          <motion.div variants={entranceVariants} style={eyebrowStyle}>
            {data.eyebrow || ''}
          </motion.div>
          <motion.h2 variants={entranceVariants} style={{ ...headingStyle, marginTop: 16 }}>
            {data.title || 'שאלות ותשובות'}
          </motion.h2>
        </div>

        {/* Accordion column */}
        <motion.div
          variants={entranceVariants}
          style={{ borderTop: '1px solid var(--border)' }}
        >
          {items.map((item, i) => (
            <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', padding: '20px 0',
                  background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'start',
                }}
              >
                <span style={{ fontSize: 19, fontWeight: 500, color: 'var(--text)' }}>
                  {item.q}
                </span>
                <motion.span
                  animate={{ rotate: openIndex === i ? 180 : 0 }}
                  transition={{ duration: 0.25, ease: EASE.emphasized }}
                  style={{ flexShrink: 0, marginInlineStart: 16 }}
                >
                  <ChevronDown style={{ width: 20, height: 20, color: 'var(--text-muted)' }} />
                </motion.span>
              </button>
              <AnimatePresence>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: EASE.emphasized }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{
                      paddingBottom: 20,
                      fontSize: 15.5,
                      lineHeight: 1.65,
                      color: 'var(--text-muted)',
                    }}>
                      {item.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.section>
  );
}

/* ════════════════════════════════════════════════════════════════════
   11. FOOTER — dark band
   ════════════════════════════════════════════════════════════════════ */

export function FooterSection({ data, org }: SectionProps) {
  const columnHeaderStyle: React.CSSProperties = {
    fontSize: 11, textTransform: 'uppercase', letterSpacing: '1.5px',
    opacity: 0.45, marginBottom: 20,
  };
  const linkStyle: React.CSSProperties = {
    opacity: 0.8, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8,
    textDecoration: 'none', color: 'inherit', marginBottom: 12,
  };

  return (
    <motion.footer
      initial="hidden" whileInView="visible" viewport={viewportConfig} variants={staggerVariants}
      style={{
        ...sectionPadding,
        backgroundColor: 'var(--text)',
        color: '#F5F3EE',
      }}
    >
      <div style={innerMax}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 32 }}>
          {/* Logo + about */}
          <motion.div variants={entranceVariants}>
            {org.logoUrl && (
              <img
                src={org.logoUrl}
                alt={org.name}
                style={{ height: 40, marginBottom: 20, filter: 'brightness(10)' }}
              />
            )}
            <p style={{ fontSize: 14, opacity: 0.7, lineHeight: 1.6, maxWidth: 320 }}>
              {data.about_text || org.name}
            </p>
          </motion.div>

          {/* Visit */}
          <motion.div variants={entranceVariants}>
            <p style={columnHeaderStyle}>ביקור</p>
            {org.address && (
              <p style={linkStyle}>{org.address}</p>
            )}
            {org.websiteUrl && (
              <a href={org.websiteUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                <ExternalLink style={{ width: 14, height: 14 }} />
                אתר
              </a>
            )}
          </motion.div>

          {/* Contact */}
          <motion.div variants={entranceVariants}>
            <p style={columnHeaderStyle}>יצירת קשר</p>
            {org.contactPhone && (
              <a href={`tel:${org.contactPhone}`} style={linkStyle}>
                <Phone style={{ width: 14, height: 14 }} />
                {org.contactPhone}
              </a>
            )}
            {org.contactEmail && (
              <a href={`mailto:${org.contactEmail}`} style={linkStyle}>
                <Mail style={{ width: 14, height: 14 }} />
                {org.contactEmail}
              </a>
            )}
          </motion.div>

          {/* Follow */}
          <motion.div variants={entranceVariants}>
            <p style={columnHeaderStyle}>עקבו אחרינו</p>
            {org.facebookUrl && (
              <a href={org.facebookUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                <ExternalLink style={{ width: 14, height: 14 }} />
                Facebook
              </a>
            )}
            {org.instagramUrl && (
              <a href={org.instagramUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                <ExternalLink style={{ width: 14, height: 14 }} />
                Instagram
              </a>
            )}
            {org.whatsappUrl && (
              <a href={org.whatsappUrl} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                <ExternalLink style={{ width: 14, height: 14 }} />
                WhatsApp
              </a>
            )}
          </motion.div>
        </div>

        {/* Bottom legal line */}
        <div style={{
          borderTop: '1px solid rgba(245,243,238,0.15)',
          marginTop: 48,
          paddingTop: 24,
          fontSize: 12,
          opacity: 0.55,
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <span>&copy; {new Date().getFullYear()} {org.legalName || org.name}</span>
          {org.registrationNumber && <span>ע.ר. {org.registrationNumber}</span>}
          {data.show_tax_receipt && <span>מוכר לפי סעיף 46</span>}
          {data.custom_text && <span>{data.custom_text}</span>}
        </div>
      </div>
    </motion.footer>
  );
}
