'use client';

import React from 'react';
import { useTheme } from './ThemeProvider';

type Size = 'sm' | 'md';

/**
 * Compact in-chrome theme switch. Drop this anywhere in a nav/sidebar/header
 * to give users a discoverable affordance for the theme — independent of the
 * floating draggable pill.
 */
export function ThemeSwitchButton({
  size = 'md',
  showLabel = true,
  className = '',
}: {
  size?: Size;
  showLabel?: boolean;
  className?: string;
}) {
  const { theme, toggleTheme } = useTheme();
  const isNachalat = theme === 'nachalat';

  const dim = size === 'sm' ? 32 : 38;
  const label = isNachalat ? 'מצב טוליפ' : 'מצב נחלת';
  const ariaLabel = isNachalat ? 'החלף למצב טוליפ' : 'החלף למצב נחלת דוד';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={ariaLabel}
      aria-pressed={isNachalat}
      title={ariaLabel}
      className={`theme-switch-btn ${isNachalat ? 'is-nachalat' : 'is-tulip'} ${className}`}
    >
      <span className="theme-switch-btn__orb" aria-hidden="true">
        {isNachalat ? <StarIcon /> : <BloomIcon />}
      </span>
      {showLabel && <span className="theme-switch-btn__label">{label}</span>}

      <style jsx>{`
        .theme-switch-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: ${size === 'sm' ? '4px 8px' : '6px 10px'};
          border-radius: 9999px;
          border: 1px solid rgb(var(--border));
          background-color: rgb(var(--surface));
          color: rgb(var(--text));
          font-family: var(--font-label, system-ui), sans-serif;
          font-size: ${size === 'sm' ? '11px' : '12px'};
          font-weight: 600;
          line-height: 1;
          cursor: pointer;
          transition: background-color 200ms ease, border-color 200ms ease,
            color 200ms ease, transform 120ms ease;
        }
        .theme-switch-btn:hover {
          background-color: rgb(var(--surface-hover));
          border-color: rgb(var(--border-strong));
        }
        .theme-switch-btn:active {
          transform: scale(0.97);
        }
        .theme-switch-btn:focus-visible {
          outline: 2px solid rgb(var(--primary) / 0.6);
          outline-offset: 2px;
        }

        .theme-switch-btn.is-nachalat {
          border-color: #c9a961;
          background:
            linear-gradient(180deg, rgba(201, 169, 97, 0.08), rgba(201, 169, 97, 0.02)),
            rgb(var(--surface));
        }

        .theme-switch-btn__orb {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: ${dim - (size === 'sm' ? 10 : 12)}px;
          height: ${dim - (size === 'sm' ? 10 : 12)}px;
          border-radius: 9999px;
          flex: 0 0 auto;
          transition: background 200ms ease, box-shadow 200ms ease, color 200ms ease;
        }
        .theme-switch-btn.is-tulip .theme-switch-btn__orb {
          background: linear-gradient(160deg, #ffffff 0%, #f9f2e2 100%);
          color: #a74c66;
          box-shadow: 0 1px 3px rgba(167, 76, 102, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.9);
        }
        .theme-switch-btn.is-nachalat .theme-switch-btn__orb {
          background: radial-gradient(circle at 30% 30%, #f0dca8 0%, #c9a961 50%, #8b7355 100%);
          color: #0a0806;
          box-shadow: 0 1px 5px rgba(201, 169, 97, 0.55), inset 0 1px 0 rgba(255, 245, 210, 0.6);
        }

        .theme-switch-btn__label {
          white-space: nowrap;
        }
      `}</style>
    </button>
  );
}

function BloomIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 4c-2.6 2.3-4 4.6-4 6.9 0 1.7 1 3 2.3 3.4V20a1 1 0 0 0 2 0v-5.7c1.3-.4 2.3-1.7 2.3-3.4 0-2.3-1.4-4.6-2.6-6.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 2.5 14.6 7h5.2L17.2 11l2.6 4.5h-5.2L12 20l-2.6-4.5H4.2L6.8 11 4.2 7h5.2L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.25"
      />
    </svg>
  );
}
