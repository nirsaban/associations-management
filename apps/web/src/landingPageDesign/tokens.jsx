// Design tokens shared across all Amutot landing mocks.
// Declared as JS so artboards can reference them; the markdown spec
// exports them as CSS custom properties + a JS object form.

const T = {
  // Modern theme (primary) — light, calm editorial
  modern: {
    bg:        '#FBFAF7',  // warm near-white
    surface:   '#FFFFFF',
    raised:    '#F5F3EE',
    text:      '#15130F',  // near-black, warm undertone
    textMuted: '#6B645B',
    border:    '#E8E3D9',
    borderStrong: '#D6CFC1',
    ring:      'rgba(21,19,15,0.12)',
    // Admin-configurable — shown at default (teal-leaning sage) to prove
    // the design is not dependent on a specific hue
    primary:     '#2F5F5C',
    primaryHover:'#244845',
    primaryTint: '#E6EFEE',
    accent:      '#C8732F',   // used sparingly (links, highlights)
    shadowTint:  'rgba(47,95,92,0.18)', // primary-tinted
  },
  warm: {
    bg: '#F7F1E8', surface: '#FDF9F2', text: '#2B1F14',
    textMuted: '#6E5A44', border: '#E6D8C2',
    primary: '#9A3B1D', accent: '#D7A046',
  },
  minimal: {
    bg: '#FAFAFA', surface: '#FFFFFF', text: '#0A0A0A',
    textMuted: '#757575', border: '#EAEAEA',
    primary: '#0A0A0A', accent: '#0A0A0A',
  },
  bold: {
    bg: '#0E0E10', surface: '#17171A', text: '#FDFDFD',
    textMuted: '#9A9AA3', border: '#2A2A30',
    primary: '#E8FF5A', accent: '#FF4D1F',
  },
  // Shared
  fontDisplay: '"Instrument Serif", "Frank Ruhl Libre", Georgia, serif',
  fontBody:    'Inter, "Heebo", -apple-system, Segoe UI, sans-serif',
  fontMono:    'JetBrains Mono, ui-monospace, Menlo, monospace',
  radius: { sm: 6, md: 10, lg: 16, xl: 24, card: 18, btn: 999 },
  dur: { fast: 160, base: 280, slow: 520 },
  ease: {
    default:     'cubic-bezier(0.2, 0.7, 0.2, 1)',
    emphasized:  'cubic-bezier(0.22, 1, 0.36, 1)',
    exit:        'cubic-bezier(0.4, 0.0, 1, 1)',
  },
  stagger: 75, // ms between grid children on entrance
};

window.T = T;
