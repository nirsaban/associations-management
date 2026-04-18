# Amutot Design System — "The Digital Sanctuary"

This document is the authoritative design spec for the **ניהול עמותות** web
and PWA UI. It is encoded in three places:

- `apps/web/tailwind.config.ts` — Tailwind utility tokens
- `apps/web/src/app/globals.css` — CSS variables + component classes
- `packages/ui/styles/tokens.css` — shared token export

All three files mirror the same values. When you change a token, change
it in all three.

---

## 1. Creative North Star

A dignified, calm, organized space that respects the user's time and
emotional state. We lean editorial, not template-y:

- **Intentional asymmetry** over rigid grids.
- **Tonal layering** over heavy borders and drop shadows.
- **Hebrew RTL** treated as a rhythmic design element, not a translation.

---

## 2. Color System (Material 3 mapping)

Teal-primary, sage-secondary, amber-tertiary. Full Material 3 role set
including `fixed` and `dim` variants.

### Primary
| Token | Hex |
|-------|-----|
| `primary` | `#004650` |
| `primary-container` | `#135f6b` |
| `primary-fixed` | `#acedfb` |
| `primary-fixed-dim` | `#90d1df` |
| `on-primary` | `#ffffff` |
| `on-primary-container` | `#95d6e4` |
| `on-primary-fixed` | `#001f25` |
| `on-primary-fixed-variant` | `#004e59` |
| `inverse-primary` | `#90d1df` |

### Secondary
| Token | Hex |
|-------|-----|
| `secondary` | `#456646` |
| `secondary-container` | `#c6edc3` |
| `secondary-fixed` | `#c6edc3` |
| `secondary-fixed-dim` | `#abd0a8` |
| `on-secondary` | `#ffffff` |
| `on-secondary-container` | `#4b6c4b` |

### Tertiary (warm amber accent)
| Token | Hex |
|-------|-----|
| `tertiary` | `#563900` |
| `tertiary-container` | `#754e00` |
| `tertiary-fixed` | `#ffddaf` |
| `tertiary-fixed-dim` | `#ffba44` |
| `on-tertiary-container` | `#ffc05b` |

### Error
| Token | Hex |
|-------|-----|
| `error` | `#ba1a1a` |
| `error-container` | `#ffdad6` |
| `on-error` | `#ffffff` |
| `on-error-container` | `#93010a` |

### Surfaces (tonal layering stack — low → high)
| Token | Hex |
|-------|-----|
| `surface` / `background` | `#f8fafa` |
| `surface-container-low` | `#f2f4f4` |
| `surface-container` | `#eceeee` |
| `surface-container-high` | `#e6e8e8` |
| `surface-container-highest` | `#e1e3e3` |
| `surface-container-lowest` | `#ffffff` |
| `inverse-surface` | `#2e3131` |
| `inverse-on-surface` | `#eff1f1` |

### Text & Outline
| Token | Hex |
|-------|-----|
| `on-surface` | `#191c1d` |
| `on-surface-variant` | `#3f4949` |
| `outline` | `#6f7979` |
| `outline-variant` | `#bec8c9` |

### The "No-Line" Rule
Do not use 1px solid borders to section content. Define boundaries with
background color shifts or whitespace. If a container must have
definition, use `outline-variant` at **15–40% opacity** — never 100%.

### Glass & Gradient
- **Primary CTAs**: linear gradient `primary → primary-container` at 135°
  (class `bg-gradient-primary`).
- **Glassmorphism**: surface at 80% opacity + 12px backdrop-blur
  (class `glass` / `glass-dark`). Reserve for floating elements
  (mobile bottom nav, desktop tooltips).

---

## 3. Typography

Two families, always loaded via Google Fonts in the root layout.

| Role | Family | Weights |
|------|--------|---------|
| Display / Headlines | `Be Vietnam Pro` | 400, 600, 700, 800, 900 |
| Title / Body / Label | `Plus Jakarta Sans` | 400, 500, 600, 700, 800 |

### Scale (Tailwind utilities)
| Utility | Size / LH / Weight | Use |
|---------|--------------------|-----|
| `text-display-lg` | 56 / 64 / 900 | Marketing hero |
| `text-display-md` | 48 / 56 / 900 | Dashboard hero stat |
| `text-display-sm` | 40 / 48 / 800 | Large KPI |
| `text-headline-lg` | 32 / 40 / 800 | Page title |
| `text-headline-md` | 28 / 36 / 800 | Section header |
| `text-headline-sm` | 24 / 32 / 700 | Card header |
| `text-title-lg` | 20 / 28 / 600 | Subsection |
| `text-title-md` | 16 / 24 / 600 | Card title |
| `text-title-sm` | 14 / 20 / 600 | List label |
| `text-body-lg` | 18 / 28 / 400 | Lead paragraph |
| `text-body-md` | 16 / 24 / 400 | Body (default) |
| `text-body-sm` | 14 / 20 / 400 | Secondary body |
| `text-label-lg` | 16 / 24 / 500 | Button label |
| `text-label-md` | 14 / 20 / 500 | Input label |
| `text-label-sm` | 12 / 16 / 500 | Metadata / tags |

Body line-height is 1.6 for Hebrew comfort.

Never use pure black `#000` for text — always `on-surface` (`#191c1d`).

---

## 4. Elevation — Ambient Shadows

Prefer **tonal layering**: a `surface-container-lowest` card on a
`surface-container-low` background already reads as "lifted."

When a shadow is required:

| Utility | Value | Use |
|---------|-------|-----|
| `shadow-ambient-sm` | `0 4px 12px rgba(25,28,29,0.04)` | Resting cards |
| `shadow-ambient-md` | `0 8px 24px rgba(25,28,29,0.06)` | Hover / popovers |
| `shadow-ambient-lg` | `0 12px 32px rgba(25,28,29,0.08)` | Modals |

Shadow tint is `on-surface` (`#191c1d`), never pure black. Never use the
default Tailwind `shadow-*` scale.

---

## 5. Radius

| Utility | Value | Use |
|---------|-------|-----|
| `rounded` (default) | `0.25rem` | Inline chips, ghost borders |
| `rounded-lg` | `0.5rem` | Buttons, inputs |
| `rounded-xl` | `0.75rem` | Cards, modals |
| `rounded-full` | `9999px` | Avatars, pills, status dots |

No sharp corners anywhere.

---

## 6. Components

### Buttons
Reusable classes in `globals.css`: `.btn-primary`, `.btn-secondary`,
`.btn-tertiary`, `.btn-outline`, `.btn-ghost`. Min-height 48px, radius
`lg`, font-semibold. Primary uses the teal gradient + `shadow-ambient-sm`,
active state scales to `0.97`.

### Inputs ("editorial underline")
`surface-container-low` background, bottom-only 2px underline in
`outline-variant`, focus shifts to `primary` underline and
`surface-container-lowest` background. Error state swaps to
`error-container` background and `error` underline. No boxy borders.

### Cards
`.card` — `surface-container-lowest` bg, `rounded-xl`, 1.5rem padding,
`shadow-ambient-sm`. `.card-muted` for secondary cards on a lighter
surface. No border, no divider lines inside — use 24px vertical
whitespace to separate blocks.

### Tables
No vertical/horizontal lines. Alternating rows between `surface` and
`surface-container-low`. Headers are `label-md` uppercase in
`on-surface-variant` with 0.04em letter-spacing. Hover row uses
`surface-container`.

### Navigation
- **Mobile bottom nav**: `glass` background, fixed bottom, flex
  row-reverse, active state marked with a `tertiary-fixed` dot beneath
  the icon (not a color change).
- **Desktop sidebar**: `surface-container-low`, fixed right (RTL),
  `w-72`. No border — rely on the tonal shift against the main
  `surface` background.

### Icons
**Material Symbols Outlined** via Google Fonts. Default weight 400,
size 24. Use `.material-symbols-outlined.filled` for filled variants.
Flip directional icons in RTL with `.icon-flip-rtl`.

### Feedback
- **Toasts**: `.glass-dark` floating capsule, top-center on mobile.
- **Empty states**: `headline-sm` heading + 150×150 illustration in
  desaturated `outline-variant` tones. No high-contrast art.

---

## 7. Layout & RTL

- `<html dir="rtl" lang="he">` is set in `apps/web/src/app/layout.tsx`.
- Use logical properties / Tailwind logical utilities: `ms-*`, `me-*`,
  `ps-*`, `pe-*`, `start-*`, `end-*`. Do **not** use `ml-*`, `mr-*`,
  `pl-*`, `pr-*`, `left-*`, `right-*`.
- Prefer `gap-*` over directional spacing on flex/grid.
- All user-facing text is Hebrew.

Container widths: `max-w-md` (mobile forms), `max-w-4xl`
(content pages), full-bleed dashboards with inner `max-w-7xl`.

---

## 8. Do's and Don'ts

### Do
- Lean into whitespace. If empty, scale typography up, don't add boxes.
- Use `tertiary` accents for warmth — pairs beautifully with the teal.
- Flip directional icons in RTL.
- Follow the established design patterns when implementing new features.

### Don't
- Don't use pure black, 1px borders, or default Material elevation shadows.
- Don't use sharp corners.
- Don't use `ml-*` / `mr-*` / directional paddings.
- Don't add new color tokens ad-hoc — extend the palette here first.

---

## 9. Reference Screens

When building a new page, follow the established design patterns
from existing screens in the codebase.
