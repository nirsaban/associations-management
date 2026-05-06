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
  familyCount: number;
  onClose: () => void;
}

export function ShareAchievementModal({
  firstName,
  organizationName,
  organizationLogoUrl,
  landingSlug,
  referralCode,
  familyCount,
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

  const handleDownload = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `achievement-${firstName}.png`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleShare = async () => {
    const blob = await generateImage();
    if (!blob) return;
    const file = new File([blob], 'achievement.png', { type: 'image/png' });
    if (navigator.share && navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        files: [file],
        title: `${firstName} חילק/ה השבוע ב${organizationName}!`,
        text: shareUrl || undefined,
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
            className="rounded-2xl overflow-hidden"
            style={{
              background: 'linear-gradient(135deg, #C49A6C 0%, #D4AA7D 30%, #B8864F 70%, #C49A6C 100%)',
              padding: '32px 24px',
              textAlign: 'center',
              direction: 'rtl',
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            {/* Logo */}
            {organizationLogoUrl ? (
              <img
                src={organizationLogoUrl}
                alt=""
                crossOrigin="anonymous"
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  objectFit: 'cover',
                  margin: '0 auto 16px',
                  border: '3px solid rgba(255,255,255,0.4)',
                }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.2)',
                  margin: '0 auto 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: 'white',
                  fontWeight: 700,
                }}
              >
                {organizationName.charAt(0)}
              </div>
            )}

            {/* Org name */}
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginBottom: 12, fontWeight: 500 }}>
              {organizationName}
            </p>

            {/* Achievement text */}
            <p style={{ color: 'white', fontSize: 28, fontWeight: 800, lineHeight: 1.3, marginBottom: 8 }}>
              {firstName} חילק/ה
            </p>
            <p style={{ color: 'white', fontSize: 28, fontWeight: 800, lineHeight: 1.3, marginBottom: 4 }}>
              ל-{familyCount} משפחות השבוע!
            </p>

            {/* Emoji celebration */}
            <p style={{ fontSize: 36, margin: '16px 0' }}>
              🎉🤲
            </p>

            {/* CTA */}
            <div
              style={{
                background: 'rgba(255,255,255,0.2)',
                borderRadius: 999,
                padding: '10px 20px',
                display: 'inline-block',
                marginTop: 8,
              }}
            >
              <p style={{ color: 'white', fontSize: 14, fontWeight: 600 }}>
                גם אתם יכולים לעזור — הצטרפו!
              </p>
            </div>

            {/* Short URL */}
            {shareUrl && (
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 12 }}>
                {shareUrl.replace(/^https?:\/\//, '')}
              </p>
            )}
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
