/**
 * Chart palette derived from the soft tulip theme tokens.
 *
 * Returns CSS color values that resolve through the design tokens defined
 * in globals.css, so the palette stays in sync with the rest of the chrome.
 *
 * Usage with Recharts/Chart.js: pass `chartPalette[i]` as the stroke / fill.
 * Use {@link withAlpha} for translucent fills (e.g. area chart fills).
 */
export const chartPalette = [
  'rgb(var(--primary))',     // dusty rose
  'rgb(var(--secondary))',   // sage
  'rgb(var(--accent))',      // lavender
  'rgb(var(--info))',        // soft slate blue
  'rgb(var(--warning))',     // amber
  'rgb(var(--success))',     // deeper sage
] as const;

export const withAlpha = (token: string, alpha: number): string =>
  `rgb(var(--${token}) / ${alpha})`;

export const chartColor = {
  axis: 'rgb(var(--text-muted))',
  grid: 'rgb(var(--border))',
  tooltipBg: 'rgb(var(--surface))',
  tooltipBorder: 'rgb(var(--border))',
  tooltipText: 'rgb(var(--text))',
} as const;
