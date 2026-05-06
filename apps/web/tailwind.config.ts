import type { Config } from 'tailwindcss';

/**
 * Tailwind config — Soft Tulip theme.
 * Colors are driven by CSS variables defined in globals.css using
 * the rgb(var(--token) / <alpha-value>) pattern so opacity utilities
 * (bg-primary/20) keep working.
 */

const withAlpha = (token: string) =>
  `rgb(var(--${token}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ─── Tulip semantic tokens (brief §2.1) ─── */
        background: withAlpha('bg'),
        surface: withAlpha('surface'),
        'surface-alt': withAlpha('surface-alt'),
        border: withAlpha('border'),
        'border-strong': withAlpha('border-strong'),

        primary: withAlpha('primary'),
        'primary-hover': withAlpha('primary-hover'),
        'primary-soft': withAlpha('primary-soft'),
        'primary-tint': withAlpha('primary-tint'),

        secondary: withAlpha('secondary'),
        'secondary-soft': withAlpha('secondary-soft'),

        accent: withAlpha('accent'),
        'accent-soft': withAlpha('accent-soft'),

        foreground: withAlpha('text'),
        'text-muted': withAlpha('text-muted'),
        'text-inverse': withAlpha('text-inverse'),

        /* Bright tones — backgrounds, icons, decorative borders */
        success: withAlpha('success'),
        warning: withAlpha('warning'),
        error: withAlpha('error'),
        info: withAlpha('info'),

        /* Strong tones — for TEXT on light bg (AA-compliant) */
        'success-strong': withAlpha('success-strong'),
        'warning-strong': withAlpha('warning-strong'),
        'error-strong': withAlpha('error-strong'),
        'info-strong': withAlpha('info-strong'),

        /* ─── Backward-compat: existing M3 names mapped to tulip ─── */
        'primary-container': withAlpha('primary-soft'),
        'primary-fixed': withAlpha('primary-soft'),
        'primary-fixed-dim': withAlpha('primary'),
        'on-primary': withAlpha('text-inverse'),
        'on-primary-container': withAlpha('text'),
        'on-primary-fixed': withAlpha('text'),
        'on-primary-fixed-variant': withAlpha('primary-hover'),
        'inverse-primary': withAlpha('primary-soft'),

        'secondary-container': withAlpha('secondary-soft'),
        'secondary-fixed': withAlpha('secondary-soft'),
        'secondary-fixed-dim': withAlpha('secondary'),
        'on-secondary': withAlpha('text-inverse'),
        'on-secondary-container': withAlpha('text'),
        'on-secondary-fixed': withAlpha('text'),
        'on-secondary-fixed-variant': withAlpha('secondary'),

        tertiary: withAlpha('accent'),
        'tertiary-container': withAlpha('accent-soft'),
        'tertiary-fixed': withAlpha('accent-soft'),
        'tertiary-fixed-dim': withAlpha('accent'),
        'on-tertiary': withAlpha('text-inverse'),
        'on-tertiary-container': withAlpha('text'),
        'on-tertiary-fixed': withAlpha('text'),
        'on-tertiary-fixed-variant': withAlpha('accent'),

        'error-container': 'rgb(253 232 228 / <alpha-value>)',
        'on-error': withAlpha('text-inverse'),
        'on-error-container': withAlpha('error'),

        'surface-bright': withAlpha('surface'),
        'surface-dim': withAlpha('surface-alt'),
        'surface-tint': withAlpha('primary'),
        'surface-variant': withAlpha('surface-alt'),
        'surface-container-lowest': withAlpha('surface'),
        'surface-container-low': withAlpha('bg'),
        'surface-container': withAlpha('surface-alt'),
        'surface-container-high': withAlpha('surface-alt'),
        'surface-container-highest': withAlpha('border'),
        'inverse-surface': withAlpha('text'),
        'inverse-on-surface': withAlpha('text-inverse'),
        'on-background': withAlpha('text'),
        'on-surface': withAlpha('text'),
        'on-surface-variant': withAlpha('text-muted'),

        outline: withAlpha('border-strong'),
        'outline-variant': withAlpha('border'),
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        '2xl': 'var(--radius-xl)',
        full: '9999px',
      },
      fontFamily: {
        headline: ['"Be Vietnam Pro"', 'system-ui', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        label: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'label-sm': ['12px', { lineHeight: '16px', fontWeight: '500' }],
        'label-md': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'label-lg': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        'body-md': ['16px', { lineHeight: '24px' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        'title-sm': ['14px', { lineHeight: '20px', fontWeight: '600' }],
        'title-md': ['16px', { lineHeight: '24px', fontWeight: '600' }],
        'title-lg': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'headline-sm': ['24px', { lineHeight: '32px', fontWeight: '700' }],
        'headline-md': ['28px', { lineHeight: '36px', fontWeight: '800' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '800' }],
        'display-sm': ['40px', { lineHeight: '48px', fontWeight: '800' }],
        'display-md': ['48px', { lineHeight: '56px', fontWeight: '900' }],
        'display-lg': ['56px', { lineHeight: '64px', fontWeight: '900' }],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        md: 'var(--shadow-md)',
        'ambient-sm': 'var(--shadow-ambient-sm)',
        'ambient-md': 'var(--shadow-ambient-md)',
        'ambient-lg': 'var(--shadow-ambient-lg)',
      },
      backdropBlur: {
        glass: '12px',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-primary-soft':
          'linear-gradient(135deg, rgb(var(--primary-soft)) 0%, rgb(var(--accent-soft)) 100%)',
        'gradient-warm': 'var(--gradient-warm)',
      },
      ringColor: {
        DEFAULT: withAlpha('primary'),
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { transform: 'translateY(8px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 240ms ease-out',
        shimmer: 'shimmer 1.4s linear infinite',
      },
    },
  },
  plugins: [],
};

export default config;
