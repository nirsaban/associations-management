'use client';

import React, { useState } from 'react';
import { Star, ChevronDown, ChevronUp, Phone, Mail, ExternalLink } from 'lucide-react';

interface SectionData {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

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

// ─── HERO ────────────────────────────────────────────────────────

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
    <section className="relative py-24 md:py-32 px-6 text-center overflow-hidden" style={{ background: `linear-gradient(135deg, ${primaryColor}15, ${accentColor}10)` }}>
      <div className="max-w-3xl mx-auto relative z-10">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight" style={{ color: 'var(--lp-text)' }}>
          {(data.headline as string) || 'ברוכים הבאים'}
        </h1>
        {data.subheadline && (
          <p className="text-lg md:text-xl mb-10 leading-relaxed" style={{ color: 'var(--lp-text-secondary)' }}>
            {data.subheadline as string}
          </p>
        )}
        {data.cta_label && (
          <button
            onClick={handleCta}
            className="px-8 py-4 rounded-xl text-lg font-semibold text-white shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
            style={{ backgroundColor: primaryColor }}
          >
            {data.cta_label as string}
          </button>
        )}
      </div>
    </section>
  );
}

// ─── VIDEO ───────────────────────────────────────────────────────

export function VideoSection({ data }: SectionProps) {
  const getEmbedUrl = () => {
    const url = data.url_or_asset_id as string;
    if (!url) return null;

    if (data.source === 'youtube') {
      // Extract video ID from various YouTube URL formats
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
    <section className="py-16 md:py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {data.title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: 'var(--lp-text)' }}>
            {data.title as string}
          </h2>
        )}
        {data.description && (
          <p className="text-center mb-10 text-lg" style={{ color: 'var(--lp-text-secondary)' }}>
            {data.description as string}
          </p>
        )}
        {embedUrl && (
          <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl" style={{ borderRadius: 'var(--lp-radius)' }}>
            <iframe
              src={embedUrl}
              className="absolute inset-0 w-full h-full"
              allow="autoplay; fullscreen; picture-in-picture"
              allowFullScreen
              loading="lazy"
              title={data.title as string || 'Video'}
            />
          </div>
        )}
      </div>
    </section>
  );
}

// ─── ABOUT ───────────────────────────────────────────────────────

export function AboutSection({ data }: SectionProps) {
  return (
    <section className="py-16 md:py-24 px-6">
      <div className="max-w-4xl mx-auto">
        {data.title && (
          <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ color: 'var(--lp-text)' }}>
            {data.title as string}
          </h2>
        )}
        {data.body_rich_text && (
          <div
            className="prose prose-lg max-w-none leading-relaxed"
            style={{ color: 'var(--lp-text-secondary)' }}
            dangerouslySetInnerHTML={{ __html: data.body_rich_text as string }}
          />
        )}
      </div>
    </section>
  );
}

// ─── ACTIVITIES ──────────────────────────────────────────────────

export function ActivitiesSection({ data, primaryColor }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];

  return (
    <section className="py-16 md:py-24 px-6" style={{ backgroundColor: 'var(--lp-surface)' }}>
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: 'var(--lp-text)' }}>
            {data.title as string}
          </h2>
        )}
        {data.intro && (
          <p className="text-center text-lg mb-12" style={{ color: 'var(--lp-text-secondary)' }}>
            {data.intro as string}
          </p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {items.map((item, i) => (
            <div
              key={i}
              className="p-6 rounded-2xl border transition-shadow hover:shadow-md"
              style={{ borderColor: 'var(--lp-border)', borderRadius: 'var(--lp-radius)' }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 text-2xl"
                style={{ backgroundColor: `${primaryColor}15` }}
              >
                {item.icon || '✦'}
              </div>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--lp-text)' }}>{item.title}</h3>
              <p style={{ color: 'var(--lp-text-secondary)' }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── GALLERY ─────────────────────────────────────────────────────

export function GallerySection({ data }: SectionProps) {
  return (
    <section className="py-16 md:py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {data.title && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" style={{ color: 'var(--lp-text)' }}>
            {data.title as string}
          </h2>
        )}
        <p className="text-center" style={{ color: 'var(--lp-text-secondary)' }}>
          הגלריה תיטען כשתועלנה תמונות
        </p>
      </div>
    </section>
  );
}

// ─── REVIEWS ─────────────────────────────────────────────────────

export function ReviewsSection({ data, primaryColor, accentColor, slug }: SectionProps) {
  const [reviews] = useState<Array<{ id: string; authorName: string; rating: number; body: string }>>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ authorName: '', rating: 5, body: '', authorEmail: '', website: '' });
  const [submitted, setSubmitted] = useState(false);

  // Fetch approved reviews
  React.useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
    fetch(`${apiUrl}/public/landing/${slug}`)
      .then(r => r.json())
      .then(() => {
        // Reviews would come from a separate endpoint in production
        // For now, they're embedded in the landing page data
      })
      .catch(() => {});
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.website) return; // Honeypot
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003/api/v1';
      await fetch(`${apiUrl}/public/landing/${slug}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
    } catch {
      // Silently handle
    }
  };

  return (
    <section className="py-16 md:py-24 px-6" style={{ backgroundColor: 'var(--lp-surface)' }}>
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" style={{ color: 'var(--lp-text)' }}>
          {(data.title as string) || 'מה אומרים עלינו'}
        </h2>

        {reviews.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 mb-10">
            {reviews.map(review => (
              <div key={review.id} className="p-6 rounded-2xl border" style={{ borderColor: 'var(--lp-border)', borderRadius: 'var(--lp-radius)' }}>
                <div className="flex gap-1 mb-3">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star key={star} className="h-4 w-4" fill={star <= review.rating ? accentColor : 'none'} stroke={accentColor} />
                  ))}
                </div>
                <p className="mb-3" style={{ color: 'var(--lp-text-secondary)' }}>{review.body}</p>
                <p className="text-sm font-medium" style={{ color: 'var(--lp-text)' }}>{review.authorName}</p>
              </div>
            ))}
          </div>
        )}

        {data.show_submit_cta && !submitted && (
          <div className="text-center">
            {!showForm ? (
              <button
                onClick={() => setShowForm(true)}
                className="px-6 py-3 rounded-xl font-medium transition-colors"
                style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
              >
                שתפו את חוויתכם
              </button>
            ) : (
              <form onSubmit={handleSubmit} className="max-w-md mx-auto text-start space-y-4">
                <input
                  value={formData.authorName}
                  onChange={e => setFormData(prev => ({ ...prev, authorName: e.target.value }))}
                  placeholder="שם"
                  required
                  className="w-full px-4 py-3 rounded-xl border"
                  style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text)' }}
                  dir="auto"
                />
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button key={star} type="button" onClick={() => setFormData(prev => ({ ...prev, rating: star }))}>
                      <Star className="h-6 w-6" fill={star <= formData.rating ? accentColor : 'none'} stroke={accentColor} />
                    </button>
                  ))}
                </div>
                <textarea
                  value={formData.body}
                  onChange={e => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="שתפו את חוויתכם..."
                  required
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border resize-y"
                  style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text)' }}
                  dir="auto"
                />
                {/* Honeypot */}
                <input
                  value={formData.website}
                  onChange={e => setFormData(prev => ({ ...prev, website: e.target.value }))}
                  className="absolute opacity-0 h-0 w-0 -z-10"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                />
                <button type="submit" className="w-full py-3 rounded-xl font-medium text-white" style={{ backgroundColor: primaryColor }}>
                  שליחה
                </button>
              </form>
            )}
          </div>
        )}

        {submitted && (
          <p className="text-center text-lg" style={{ color: primaryColor }}>
            תודה! ההמלצה שלכם נשלחה לאישור.
          </p>
        )}
      </div>
    </section>
  );
}

// ─── STATS ───────────────────────────────────────────────────────

export function StatsSection({ data, primaryColor }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];

  return (
    <section className="py-16 md:py-24 px-6" style={{ background: `linear-gradient(135deg, ${primaryColor}08, ${primaryColor}03)` }}>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {items.map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-4xl md:text-5xl font-bold mb-2" style={{ color: primaryColor }}>
                {item.number}
              </p>
              <p className="text-sm md:text-base" style={{ color: 'var(--lp-text-secondary)' }}>
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── CTA PAYMENT ─────────────────────────────────────────────────

export function CtaPaymentSection({ data, primaryColor, org }: SectionProps) {
  return (
    <section className="py-20 md:py-28 px-6 text-center" style={{ backgroundColor: primaryColor }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          {(data.headline as string) || 'תרמו עכשיו'}
        </h2>
        {data.subheadline && (
          <p className="text-lg text-white/80 mb-8">{data.subheadline as string}</p>
        )}
        <a
          href={org.paymentLink || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-10 py-4 rounded-xl text-lg font-semibold transition-transform hover:scale-105 shadow-lg"
          style={{ backgroundColor: '#ffffff', color: primaryColor }}
        >
          {(data.button_label as string) || 'לתרומה'}
        </a>
        {data.installments_hint && (
          <p className="text-sm text-white/70 mt-4">ניתן לפרוס לתשלומים</p>
        )}
      </div>
    </section>
  );
}

// ─── JOIN US ─────────────────────────────────────────────────────

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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      setSubmitted(true);
    } catch {
      setError('שגיאה בשליחה, נסו שוב');
    }
  };

  if (submitted) {
    return (
      <section className="py-16 md:py-24 px-6 text-center" style={{ backgroundColor: 'var(--lp-surface)' }}>
        <p className="text-2xl font-semibold" style={{ color: primaryColor }}>
          {(data.success_message as string) || 'תודה! נחזור אליכם בהקדם.'}
        </p>
      </section>
    );
  }

  return (
    <section className="py-16 md:py-24 px-6" style={{ backgroundColor: 'var(--lp-surface)' }}>
      <div className="max-w-lg mx-auto">
        {data.headline && (
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4" style={{ color: 'var(--lp-text)' }}>
            {data.headline as string}
          </h2>
        )}
        {data.body && (
          <p className="text-center mb-8" style={{ color: 'var(--lp-text-secondary)' }}>
            {data.body as string}
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            value={formData.name}
            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="שם מלא"
            required
            className="w-full px-4 py-3 rounded-xl border"
            style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text)' }}
            dir="auto"
          />
          <input
            value={formData.email}
            onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
            placeholder="אימייל"
            type="email"
            className="w-full px-4 py-3 rounded-xl border"
            style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text)' }}
            dir="ltr"
          />
          <input
            value={formData.phone}
            onChange={e => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            placeholder="טלפון"
            type="tel"
            className="w-full px-4 py-3 rounded-xl border"
            style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text)' }}
            dir="ltr"
          />
          <textarea
            value={formData.message}
            onChange={e => setFormData(prev => ({ ...prev, message: e.target.value }))}
            placeholder="הודעה (אופציונלי)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl border resize-y"
            style={{ borderColor: 'var(--lp-border)', color: 'var(--lp-text)' }}
            dir="auto"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button type="submit" className="w-full py-3 rounded-xl font-medium text-white" style={{ backgroundColor: primaryColor }}>
            שליחה
          </button>
        </form>
      </div>
    </section>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────

export function FaqSection({ data }: SectionProps) {
  const items = (data.items as Array<Record<string, string>>) || [];
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 md:py-24 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-10" style={{ color: 'var(--lp-text)' }}>
          שאלות ותשובות
        </h2>
        <div className="space-y-3">
          {items.map((item, i) => (
            <div key={i} className="border rounded-2xl overflow-hidden" style={{ borderColor: 'var(--lp-border)', borderRadius: 'var(--lp-radius)' }}>
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-4 text-start"
              >
                <span className="font-medium text-lg" style={{ color: 'var(--lp-text)' }}>{item.q}</span>
                {openIndex === i ? (
                  <ChevronUp className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--lp-text-secondary)' }} />
                ) : (
                  <ChevronDown className="h-5 w-5 flex-shrink-0" style={{ color: 'var(--lp-text-secondary)' }} />
                )}
              </button>
              {openIndex === i && (
                <div className="px-6 pb-4" style={{ color: 'var(--lp-text-secondary)' }}>
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FOOTER ──────────────────────────────────────────────────────

export function FooterSection({ data, org }: SectionProps) {
  return (
    <footer className="py-12 px-6 border-t" style={{ borderColor: 'var(--lp-border)', backgroundColor: 'var(--lp-surface)' }}>
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {data.show_contact !== false && (
            <div>
              <h3 className="font-semibold mb-4" style={{ color: 'var(--lp-text)' }}>צרו קשר</h3>
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
              <h3 className="font-semibold mb-4" style={{ color: 'var(--lp-text)' }}>עקבו אחרינו</h3>
              <div className="flex gap-3">
                {org.facebookUrl && (
                  <a href={org.facebookUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                    <ExternalLink className="h-5 w-5" style={{ color: 'var(--lp-text-secondary)' }} />
                  </a>
                )}
                {org.instagramUrl && (
                  <a href={org.instagramUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                    <ExternalLink className="h-5 w-5" style={{ color: 'var(--lp-text-secondary)' }} />
                  </a>
                )}
                {org.whatsappUrl && (
                  <a href={org.whatsappUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-black/5 transition-colors">
                    <ExternalLink className="h-5 w-5" style={{ color: 'var(--lp-text-secondary)' }} />
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {data.custom_text && (
          <p className="mt-8 text-sm text-center" style={{ color: 'var(--lp-text-secondary)' }}>
            {data.custom_text as string}
          </p>
        )}

        <p className="mt-8 text-xs text-center" style={{ color: 'var(--lp-text-secondary)' }}>
          &copy; {new Date().getFullYear()} {org.name}
        </p>
      </div>
    </footer>
  );
}
