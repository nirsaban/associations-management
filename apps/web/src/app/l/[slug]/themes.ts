/**
 * Theme system — landing-page-design-spec.md § 5
 *
 * Themes set structure (corners, darkness, type family).
 * Primary/accent set hue independently.
 * CSS custom properties in tokens.css handle the actual values;
 * this file maps theme names and derives color scales.
 */

export const VALID_THEMES = ['modern', 'warm', 'minimal', 'bold'] as const;
export type ThemeName = typeof VALID_THEMES[number];

/**
 * Derive primary color scale overrides as inline CSS custom properties.
 */
export function derivePrimaryScale(primaryHex: string, accentHex: string): Record<string, string> {
  return {
    '--primary': primaryHex,
    '--primary-hover': primaryHex,
    '--primary-50': `color-mix(in oklab, ${primaryHex} 12%, var(--n-50))`,
    '--primary-200': `color-mix(in oklab, ${primaryHex} 45%, var(--n-50))`,
    '--primary-600': `color-mix(in oklab, ${primaryHex} 80%, var(--n-900))`,
    '--primary-700': `color-mix(in oklab, ${primaryHex} 70%, var(--n-900))`,
    '--accent': accentHex,
    '--shadow-tint': `color-mix(in oklab, ${primaryHex} 18%, transparent)`,
    '--ring': `color-mix(in oklab, ${primaryHex} 40%, transparent)`,
  };
}
