'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useTheme } from './ThemeProvider';

const POS_KEY = 'amutot.theme.toggle.pos';
const TOGGLE_W = 96;
const TOGGLE_H = 44;
const EDGE_PAD = 8;

type Pos = { x: number; y: number };

function clampPos(p: Pos): Pos {
  if (typeof window === 'undefined') return p;
  const maxX = Math.max(EDGE_PAD, window.innerWidth - TOGGLE_W - EDGE_PAD);
  const maxY = Math.max(EDGE_PAD, window.innerHeight - TOGGLE_H - EDGE_PAD);
  return {
    x: Math.min(Math.max(EDGE_PAD, p.x), maxX),
    y: Math.min(Math.max(EDGE_PAD, p.y), maxY),
  };
}

function readStoredPos(): Pos | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Pos;
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Draggable two-state theme switch.
 * - Default position: top-left.
 * - Drag with finger or mouse; tap (no drag) toggles theme.
 * - Position persists in localStorage and re-clamps on resize.
 * - The pill itself reskins between Tulip and Nachalat aesthetics.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isNachalat = theme === 'nachalat';

  // Default to top-left until we read storage on mount (avoids SSR hydration mismatch).
  const [pos, setPos] = useState<Pos>({ x: EDGE_PAD + 12, y: EDGE_PAD + 12 });
  const [dragging, setDragging] = useState(false);
  const [mounted, setMounted] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const posRef = useRef<Pos>(pos);
  posRef.current = pos;
  // After a drag ends, suppress the synthetic click that follows so we don't
  // accidentally toggle the theme at the end of a drag.
  const suppressClickRef = useRef(false);

  useEffect(() => {
    const stored = readStoredPos();
    const initial = stored ?? { x: EDGE_PAD + 12, y: EDGE_PAD + 12 };
    setPos(clampPos(initial));
    setMounted(true);
  }, []);

  useEffect(() => {
    function onResize() {
      setPos((p) => clampPos(p));
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const persist = useCallback((p: Pos) => {
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(p));
    } catch {
      /* ignore */
    }
  }, []);

  // Use document-level pointermove/pointerup attached on demand. This avoids
  // setPointerCapture, which redirects the synthetic `click` event off the
  // button and breaks tap-to-toggle.
  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.button !== undefined && e.button !== 0) return; // primary only
      const startX = e.clientX;
      const startY = e.clientY;
      const origX = posRef.current.x;
      const origY = posRef.current.y;
      let moved = false;

      const onMove = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        if (!moved && Math.hypot(dx, dy) > 5) {
          moved = true;
          setDragging(true);
        }
        if (moved) {
          ev.preventDefault();
          setPos(clampPos({ x: origX + dx, y: origY + dy }));
        }
      };

      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        document.removeEventListener('pointercancel', onUp);
        if (moved) {
          setDragging(false);
          suppressClickRef.current = true;
          persist(posRef.current);
          // Reset after the synthetic click that follows pointerup has had
          // a chance to fire (and be ignored).
          setTimeout(() => {
            suppressClickRef.current = false;
          }, 50);
        }
      };

      document.addEventListener('pointermove', onMove, { passive: false });
      document.addEventListener('pointerup', onUp);
      document.addEventListener('pointercancel', onUp);
    },
    [persist],
  );

  const onClick = useCallback(() => {
    if (suppressClickRef.current) return;
    toggleTheme();
  }, [toggleTheme]);

  return (
    <div
      ref={wrapRef}
      className={`theme-toggle-wrap ${className}`}
      aria-live="polite"
      style={{
        top: pos.y,
        left: pos.x,
        // Hide during the brief moment before we've read storage to avoid a flash at default.
        visibility: mounted ? 'visible' : 'hidden',
      }}
      onPointerDown={onPointerDown}
    >
      <button
        type="button"
        role="switch"
        aria-checked={isNachalat}
        aria-label={isNachalat ? 'החלפה למצב טוליפ' : 'החלפה למצב נחלת דוד'}
        onClick={onClick}
        className={`theme-toggle ${isNachalat ? 'is-nachalat' : 'is-tulip'} ${dragging ? 'is-dragging' : ''}`}
        data-state={theme}
      >
        {/* Track segments */}
        <span className="theme-toggle__seg theme-toggle__seg--start" aria-hidden="true">
          <TulipMark />
        </span>
        <span className="theme-toggle__seg theme-toggle__seg--end" aria-hidden="true">
          <NachalatMark />
        </span>

        {/* The thumb is positioned via CSS; rendered last for z-stack */}
        <span className="theme-toggle__thumb" aria-hidden="true">
          <span className="theme-toggle__thumb-inner">
            {isNachalat ? <NachalatMark /> : <TulipMark />}
          </span>
        </span>
      </button>

      <span className="theme-toggle__tip" aria-hidden="true">
        {isNachalat ? 'נחלת דוד' : 'טוליפ'}
      </span>

      <style jsx>{`
        .theme-toggle-wrap {
          position: fixed;
          z-index: 60;
          display: flex;
          align-items: center;
          gap: 10px;
          touch-action: none;
          user-select: none;
          -webkit-user-select: none;
          cursor: grab;
          transition: none;
        }

        .theme-toggle {
          pointer-events: auto;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: space-between;
          gap: 0;
          width: 96px;
          height: 44px;
          padding: 4px;
          border-radius: 9999px;
          border: 1px solid rgb(var(--border-strong));
          background-color: rgb(var(--surface));
          box-shadow: var(--shadow-soft), inset 0 1px 0 rgb(255 255 255 / 0.4);
          cursor: grab;
          transition: background-color 280ms ease, border-color 280ms ease,
            box-shadow 280ms ease, transform 120ms ease;
          isolation: isolate;
          overflow: hidden;
        }

        .theme-toggle.is-dragging {
          cursor: grabbing;
          transform: scale(1.04);
        }
        .theme-toggle:active {
          cursor: grabbing;
        }
        .theme-toggle:focus-visible {
          outline: 2px solid rgb(var(--primary) / 0.6);
          outline-offset: 3px;
        }

        /* ── Tulip state: cream pill, rose-tinted seal ── */
        .theme-toggle.is-tulip {
          background: linear-gradient(180deg, rgb(var(--surface)) 0%, rgb(var(--surface-alt)) 100%);
          border-color: rgb(var(--border-strong));
        }

        /* ── Nachalat state: velvet pill with filigree hairline ── */
        .theme-toggle.is-nachalat {
          background: radial-gradient(ellipse at center, #1c1610 0%, #0a0806 80%);
          border-color: #c9a961;
          box-shadow:
            0 0 0 1px rgba(232, 213, 168, 0.20),
            0 6px 22px -8px rgba(201, 169, 97, 0.55),
            inset 0 1px 0 rgba(232, 213, 168, 0.15);
        }
        .theme-toggle.is-nachalat::before {
          content: '';
          position: absolute;
          inset: 3px;
          border-radius: 9999px;
          border: 1px dashed rgba(201, 169, 97, 0.45);
          pointer-events: none;
        }
        .theme-toggle.is-nachalat::after {
          content: '';
          position: absolute;
          inset: -40%;
          background: conic-gradient(
            from 0deg,
            transparent 0deg,
            rgba(232, 213, 168, 0.10) 60deg,
            transparent 120deg,
            transparent 240deg,
            rgba(232, 213, 168, 0.08) 300deg,
            transparent 360deg
          );
          animation: tt-shimmer 6s linear infinite;
          pointer-events: none;
          z-index: -1;
        }

        @keyframes tt-shimmer {
          to { transform: rotate(360deg); }
        }

        .theme-toggle__seg {
          flex: 0 0 36px;
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgb(var(--text-muted));
          opacity: 0.65;
          transition: color 280ms ease, opacity 280ms ease;
        }

        .theme-toggle.is-tulip .theme-toggle__seg--end {
          color: rgb(var(--text-muted));
          opacity: 0.35;
        }
        .theme-toggle.is-nachalat .theme-toggle__seg--start {
          color: #b8a582;
          opacity: 0.3;
        }
        .theme-toggle.is-nachalat .theme-toggle__seg--end {
          color: #c9a961;
          opacity: 0;
        }

        .theme-toggle__thumb {
          position: absolute;
          top: 3px;
          width: 36px;
          height: 36px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: left 320ms cubic-bezier(0.34, 1.35, 0.5, 1),
            background 280ms ease, box-shadow 280ms ease;
          left: 3px;
          z-index: 2;
        }
        .theme-toggle.is-tulip .theme-toggle__thumb {
          left: 3px;
          background: linear-gradient(160deg, #ffffff 0%, #f9f2e2 100%);
          box-shadow:
            0 2px 6px rgba(167, 76, 102, 0.35),
            0 0 0 1px rgba(167, 76, 102, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.9);
          color: #a74c66;
        }
        .theme-toggle.is-nachalat .theme-toggle__thumb {
          left: calc(100% - 39px);
          background: radial-gradient(circle at 30% 30%, #f0dca8 0%, #c9a961 50%, #8b7355 100%);
          box-shadow:
            0 2px 8px rgba(201, 169, 97, 0.55),
            0 0 0 1px rgba(10, 8, 6, 0.6),
            inset 0 1px 0 rgba(255, 245, 210, 0.55);
          color: #0a0806;
        }

        .theme-toggle__thumb-inner {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }

        .theme-toggle__tip {
          pointer-events: none;
          font-family: var(--font-label, system-ui), sans-serif;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.02em;
          padding: 6px 10px;
          border-radius: 9999px;
          background-color: rgb(var(--surface));
          color: rgb(var(--text));
          border: 1px solid rgb(var(--border));
          box-shadow: var(--shadow-ambient-sm);
          opacity: 0;
          transform: translateX(-6px);
          transition: opacity 220ms ease, transform 220ms ease;
          white-space: nowrap;
        }
        .theme-toggle-wrap:hover .theme-toggle__tip,
        .theme-toggle:focus-visible + .theme-toggle__tip {
          opacity: 1;
          transform: translateX(0);
        }

        @media (prefers-reduced-motion: reduce) {
          .theme-toggle,
          .theme-toggle__thumb,
          .theme-toggle__tip { transition: none; }
          .theme-toggle.is-nachalat::after { animation: none; }
        }
      `}</style>
    </div>
  );
}

/* ───────── Inline iconography ───────── */

function TulipMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4c-2.6 2.3-4 4.6-4 6.9 0 1.7 1 3 2.3 3.4V20a1 1 0 0 0 2 0v-5.7c1.3-.4 2.3-1.7 2.3-3.4 0-2.3-1.4-4.6-2.6-6.9Z"
        fill="currentColor"
      />
      <path
        d="M7.5 9c-1 1.5-1.5 3-.8 4.2.6 1 1.9 1.3 3 .8M16.5 9c1 1.5 1.5 3 .8 4.2-.6 1-1.9 1.3-3 .8"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  );
}

function NachalatMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5 14.6 7h5.2L17.2 11l2.6 4.5h-5.2L12 20l-2.6-4.5H4.2L6.8 11 4.2 7h5.2L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.18"
      />
    </svg>
  );
}
