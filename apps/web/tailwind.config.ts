import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Chesed Harmony - Primary
        'primary': 'var(--color-primary)',
        'primary-container': 'var(--color-primary-container)',
        'on-primary': 'var(--color-on-primary)',
        'on-primary-container': 'var(--color-on-primary-container)',
        'primary-hover': 'var(--color-primary-hover)',

        // Surface
        'surface': 'var(--color-surface)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'on-surface': 'var(--color-on-surface)',
        'on-surface-variant': 'var(--color-on-surface-variant)',

        // Secondary & Tertiary
        'secondary': 'var(--color-secondary)',
        'on-secondary': 'var(--color-on-secondary)',
        'secondary-container': 'var(--color-secondary-container)',
        'on-secondary-container': 'var(--color-on-secondary-container)',

        'tertiary': 'var(--color-tertiary)',
        'on-tertiary': 'var(--color-on-tertiary)',
        'tertiary-container': 'var(--color-tertiary-container)',
        'on-tertiary-container': 'var(--color-on-tertiary-container)',

        // Semantic
        'error': 'var(--color-error)',
        'on-error': 'var(--color-on-error)',
        'error-container': 'var(--color-error-container)',
        'on-error-container': 'var(--color-on-error-container)',

        'success': 'var(--color-success)',
        'on-success': 'var(--color-on-success)',
        'success-container': 'var(--color-success-container)',
        'on-success-container': 'var(--color-on-success-container)',

        'warning': 'var(--color-warning)',
        'on-warning': 'var(--color-on-warning)',
        'warning-container': 'var(--color-warning-container)',
        'on-warning-container': 'var(--color-on-warning-container)',

        // Border
        'border': 'var(--color-border)',
        'border-light': 'var(--color-border-light)',
      },
      borderRadius: {
        'sm': 'var(--radius-sm)',
        'md': 'var(--radius-md)',
        'lg': 'var(--radius-lg)',
        'full': 'var(--radius-full)',
      },
      fontFamily: {
        'headline': 'var(--font-headline)',
        'body': 'var(--font-body)',
        'label': 'var(--font-label)',
        'sans': ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'xs': 'var(--space-xs)',
        'sm': 'var(--space-sm)',
        'md': 'var(--space-md)',
        'lg': 'var(--space-lg)',
        'xl': 'var(--space-xl)',
        '2xl': 'var(--space-2xl)',
      },
      fontSize: {
        'label-sm': ['12px', { lineHeight: '16px' }],
        'label-md': ['14px', { lineHeight: '20px' }],
        'body-sm': ['14px', { lineHeight: '20px' }],
        'body-md': ['16px', { lineHeight: '24px' }],
        'body-lg': ['18px', { lineHeight: '28px' }],
        'title-sm': ['14px', { lineHeight: '20px', fontWeight: '500' }],
        'title-md': ['16px', { lineHeight: '24px', fontWeight: '500' }],
        'title-lg': ['20px', { lineHeight: '28px', fontWeight: '500' }],
        'headline-sm': ['24px', { lineHeight: '32px', fontWeight: '400' }],
        'headline-md': ['28px', { lineHeight: '36px', fontWeight: '400' }],
        'headline-lg': ['32px', { lineHeight: '40px', fontWeight: '400' }],
      },
    },
  },
  plugins: [],
};
export default config;
