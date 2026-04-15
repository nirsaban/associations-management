import type { Config } from 'tailwindcss';

/**
 * Tailwind config — sourced verbatim from Stitch designs
 * (stitch_nachalat_david_platform/*/code.html). All 10 screens share the
 * identical token block; keeping it as the single source of truth ensures
 * pixel-parity with the reference mocks.
 */
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
        'primary': '#004650',
        'primary-container': '#135f6b',
        'primary-fixed': '#acedfb',
        'primary-fixed-dim': '#90d1df',
        'on-primary': '#ffffff',
        'on-primary-container': '#95d6e4',
        'on-primary-fixed': '#001f25',
        'on-primary-fixed-variant': '#004e59',
        'inverse-primary': '#90d1df',

        'secondary': '#456646',
        'secondary-container': '#c6edc3',
        'secondary-fixed': '#c6edc3',
        'secondary-fixed-dim': '#abd0a8',
        'on-secondary': '#ffffff',
        'on-secondary-container': '#4b6c4b',
        'on-secondary-fixed': '#012108',
        'on-secondary-fixed-variant': '#2d4e30',

        'tertiary': '#563900',
        'tertiary-container': '#754e00',
        'tertiary-fixed': '#ffddaf',
        'tertiary-fixed-dim': '#ffba44',
        'on-tertiary': '#ffffff',
        'on-tertiary-container': '#ffc05b',
        'on-tertiary-fixed': '#281800',
        'on-tertiary-fixed-variant': '#614000',

        'error': '#ba1a1a',
        'error-container': '#ffdad6',
        'on-error': '#ffffff',
        'on-error-container': '#93000a',

        'background': '#f8fafa',
        'surface': '#f8fafa',
        'surface-bright': '#f8fafa',
        'surface-dim': '#d8dada',
        'surface-tint': '#206773',
        'surface-variant': '#e1e3e3',
        'surface-container-lowest': '#ffffff',
        'surface-container-low': '#f2f4f4',
        'surface-container': '#eceeee',
        'surface-container-high': '#e6e8e8',
        'surface-container-highest': '#e1e3e3',
        'inverse-surface': '#2e3131',
        'inverse-on-surface': '#eff1f1',
        'on-background': '#191c1d',
        'on-surface': '#191c1d',
        'on-surface-variant': '#3f4949',

        'outline': '#6f7979',
        'outline-variant': '#bec8c9',
      },
      borderRadius: {
        DEFAULT: '0.25rem',
        lg: '0.5rem',
        xl: '0.75rem',
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
        'ambient-sm': '0 4px 12px rgba(25, 28, 29, 0.04)',
        'ambient-md': '0 8px 24px rgba(25, 28, 29, 0.06)',
        'ambient-lg': '0 12px 32px rgba(25, 28, 29, 0.08)',
      },
      backdropBlur: {
        glass: '12px',
      },
      backgroundImage: {
        'gradient-primary':
          'linear-gradient(135deg, #004650 0%, #135f6b 100%)',
        'gradient-primary-soft':
          'linear-gradient(135deg, #135f6b 0%, #206773 100%)',
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
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 240ms ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
