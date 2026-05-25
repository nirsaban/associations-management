'use client';

import React, { useRef, useState, useCallback } from 'react';
import { X, Download, Link2, Share2, Check } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ShareAchievementModalProps {
  firstName: string;
  organizationName: string;
  organizationLogoUrl?: string | null;
  landingSlug?: string | null;
  referralCode?: string | null;
  /** Kept for API compatibility — the new image uses a generic message, not a number. */
  familyCount?: number;
  onClose: () => void;
}

export function ShareAchievementModal({
  firstName,
  organizationName,
  organizationLogoUrl,
  landingSlug,
  referralCode,
  onClose,
}: ShareAchievementModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareUrl = landingSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/l/${landingSlug}${referralCode ? `?ref=${referralCode}` : ''}`
    : null;

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    setGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      });
    } catch (err) {
      console.error('Failed to generate image:', err);
      return null;
    } finally {
      setGenerating(false);
    }
  }, []);

  const shareCaption = [
    'השבוע זכיתי לחלק חבילות מזון למשפחות נזקקות 🤲',
    'לתרומות — לחצו על הלינק',
    'לפרטים נוספים שלחו הודעה ל-052-205-8629',
    shareUrl || '',
  ]
    .filter(Boolean)
    .join('\n');

  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nachalat-david-${firstName || 'share'}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const file = new File([blob], 'nachalat-david.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `חלוקת מזון · ${organizationName}`,
        text: shareCaption,
      });
    } else {
      handleDownload();
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface rounded-2xl w-full max-w-sm overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
          <h2 className="text-title-md font-medium">שתפו את ההישג</h2>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-surface-variant transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Shareable card (rendered to image) */}
        <div className="p-5">
          <div
            ref={cardRef}
            className="rounded-2xl overflow-hidden relative"
            style={{
              width: '100%',
              aspectRatio: '4 / 5',
              direction: 'rtl',
              fontFamily: 'system-ui, -apple-system, sans-serif',
              position: 'relative',
              backgroundColor: '#1a1a1a',
            }}
          >
            {/* Background photo */}
            <img
              src="/mehalek.jpeg"
              alt=""
              crossOrigin="anonymous"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />

            {/* Dark gradient overlay for text legibility */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)',
              }}
            />

            {/* Top: organization */}
            <div
              style={{
                position: 'absolute',
                top: 20,
                insetInlineStart: 20,
                insetInlineEnd: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              {organizationLogoUrl ? (
                <img
                  src={organizationLogoUrl}
                  alt=""
                  crossOrigin="anonymous"
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid rgba(255,255,255,0.7)',
                  }}
                />
              ) : null}
              <p
                style={{
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 700,
                  margin: 0,
                  textShadow: '0 1px 3px rgba(0,0,0,0.6)',
                }}
              >
                {organizationName}
              </p>
            </div>

            {/* Bottom block: text content */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                insetInlineStart: 0,
                insetInlineEnd: 0,
                padding: '20px 22px 22px',
                color: 'white',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  lineHeight: 1.35,
                  margin: 0,
                  marginBottom: 10,
                  textShadow: '0 2px 6px rgba(0,0,0,0.7)',
                }}
              >
                השבוע זכיתי לחלק חבילות מזון למשפחות נזקקות
              </p>

              <p
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  lineHeight: 1.5,
                  margin: 0,
                  marginBottom: 14,
                  color: 'rgba(255,255,255,0.92)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.7)',
                }}
              >
                לתרומות — לחצו על הלינק לפרטים נוספים{'\n'}
                או שלחו הודעה ל-052-205-8629
              </p>

              {/* CTA pill */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.95)',
                  borderRadius: 999,
                  padding: '9px 18px',
                  display: 'inline-block',
                  marginBottom: shareUrl ? 8 : 0,
                }}
              >
                <p
                  style={{
                    color: '#A74C66',
                    fontSize: 13,
                    fontWeight: 800,
                    margin: 0,
                    letterSpacing: '-0.01em',
                  }}
                >
                  לכל פרט נוסף — לחצו על הלינק
                </p>
              </div>

              {shareUrl && (
                <p
                  style={{
                    color: 'rgba(255,255,255,0.85)',
                    fontSize: 11,
                    fontWeight: 600,
                    margin: 0,
                    marginTop: 6,
                    direction: 'ltr',
                    textShadow: '0 1px 3px rgba(0,0,0,0.7)',
                  }}
                >
                  {shareUrl.replace(/^https?:\/\//, '')}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-5 flex flex-col gap-2">
          <button
            onClick={handleShare}
            disabled={generating}
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-primary text-on-primary text-label-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Share2 className="h-5 w-5" />
            {generating ? 'מכין תמונה...' : 'שתפו'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleDownload}
              disabled={generating}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-outline-variant text-label-md text-on-surface hover:bg-surface-variant transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              הורדה
            </button>

            {shareUrl && (
              <button
                onClick={handleCopyLink}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-outline-variant text-label-md text-on-surface hover:bg-surface-variant transition-colors"
              >
                {copied ? <Check className="h-4 w-4 text-success" /> : <Link2 className="h-4 w-4" />}
                {copied ? 'הועתק!' : 'העתק קישור'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
