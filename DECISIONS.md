# DECISIONS.md — Landing Page Implementation (from design handoff)

## Design source
Generated from Claude Design handoff bundle (`amutot-lanfing-page-2`).
Authoritative spec: `landing-page-design-spec.md`.
Reference impl: `Amutot Landing - Design.html` + 7 JSX component files.

## Key decisions

### D1: Typography stack change
**Spec**: Instrument Serif (display) + Inter (body) + Heebo (Hebrew body) + Frank Ruhl Libre (Hebrew display).
**Previous**: Noto Sans Hebrew. **Reason**: Spec prescribes a serif display + humanist sans pairing for "premium, calm, trustworthy" feel.

### D2: Neutral palette — warm-grey
Spec uses warm near-white `#FBFAF7` as bg, warm-undertone neutrals throughout (n-50 `#FBFAF7` → n-900 `#15130F`). Previous used cool slate. Warm undertone is deliberate: "closer to a well-designed cultural institution."

### D3: No WebGL shader / geometric shapes in hero
Spec: subtle gradient mesh (two radial blobs tinted by primary). No canvas. The shader-background and shape-landing-hero stay in components/ui but are not used on the landing page.

### D4: cta_payment amount chips
Spec requires donation amount chips as `role="radiogroup"`. New `amounts[]` field in section data. Falls back to single CTA if absent.

### D5: Stats — dark inverted band
Neutral-900 bg, neutral-100 text. Numbers in serif at 72-96px. Count-up animation once when 60% visible.

### D6: Reviews — serif pull-quote
Body in Instrument Serif with curly quotes. Stars in `--primary` color (not yellow).

### D7: Gallery — CSS columns masonry
`columns: 4` on desktop, not CSS grid. 12px gap. Masonry ≥4 images; centered row for 1-3.

### D8: Footer — dark band, 4-col, legal info
Shows Israeli legal requirements: registration number + Hebrew legal name.

### D9: cta_payment background = `--primary-50`
Light primary tint, not solid primary color.

### D10: Pill buttons (radius 999px)
With inset glow: `0 1px 0 rgba(255,255,255,0.15) inset`.

### D11: Primary-tinted shadows
`--shadow-tint: color-mix(in oklab, var(--primary) 18%, transparent)`.

### D12: Section eyebrows
11px uppercase, letter-spacing 1.8px. Admin-editable.

### D13: FAQ — two-column with grid-row animation
Title 1fr + list 2fr. Accordion uses `grid-template-rows: 0fr → 1fr`.

### D14: No affiliate_links table
CTA links to `Organization.paymentLink` URL directly.

---

# DECISIONS — Soft Tulip theme refresh (app chrome)

### D15: Token naming — additive, not replacement
Existing M3 token names (`--color-primary`, `--color-on-surface`, `--color-surface-container-low`, …) are kept and **mapped onto the new tulip palette**. New tulip-specific names (`--bg`, `--surface`, `--surface-alt`, `--primary`, `--primary-soft`, `--secondary`, `--accent`, `--text`, `--text-muted`, `--success`, `--warning`, `--error`, `--info`, `--border`, `--border-strong`) are added alongside.
**Why:** ~90 existing tsx files already consume the M3 names; renaming would ripple. Wrapping tulip values into the legacy aliases lets the entire app re-skin with one CSS-vars update while new code can adopt the cleaner semantic names.
**Implication:** Tailwind exposes both spellings (e.g. `bg-primary`, `bg-on-surface`, `bg-surface-container-low`). Don't deprecate yet — let new code drift to the tulip names organically.

### D16: CSS-var driven Tailwind colors with `<alpha-value>`
Tailwind config now uses `rgb(var(--token) / <alpha-value>)` (with R G B triplets in CSS), so `bg-primary/20`, `ring-primary/40`, etc. continue to work and the entire palette swaps via CSS variables.
**Why:** Required for runtime org-color override (deferred — see D18) and for opacity utilities to keep functioning.

### D17: Dark mode — deferred
`darkMode: 'class'` remains configured in Tailwind, but no `[data-theme="dark"]` ruleset was added in this PR. Brief §2.2 explicitly permits deferring when no toggle exists.
**Follow-up PR:** add the dark token block from brief §2.2 under `[data-theme="dark"]` and a toggle component.

### D18: Org primary-color runtime override — deferred
The org profile already captures `primaryColor` / `accentColor`, but no chrome-level CSS-var override is wired today. The CSS-var foundation in this PR makes the override one-line in a future PR (set inline `--primary: <r g b>` on `<html>` from the layout); keeping the tulip palette as the fallback when no org override is present.
**Why deferred:** scope creep — would require a new provider/effect, color-format conversion (hex → rgb triplet), and tests. Follow-up PR.

### D19: WhatsApp brand color preserved
`ReferralCard` keeps `bg-[#25D366]` for the WhatsApp share button. WhatsApp brand guidelines mandate the green; the tulip palette is the chrome theme, not a brand override.

### D20: Unused `shape-landing-hero.tsx` left untouched
Component is defined and exported but never imported anywhere in the app. Its hardcoded indigo/rose/violet/cyan/amber gradients are out of the chrome palette but ship nothing because the file is dead. Marked for removal in a separate cleanup PR rather than refactoring a component nobody renders.

### D21: Form primitive — switched from underline to soft border
The previous `globals.css` styled inputs with a `surface-container-low` fill + bottom border ("editorial underline"). Tulip uses a soft 1px border with primary focus ring at 18% alpha. This is a calmer look that pairs with the warm cream surface.

### D22: AA-tuned primary + status-strong variants
The brief's exact `--primary: #C4708A` reaches only **3.48:1** with white text — fails WCAG-AA at body sizes (4.5:1). Per brief §2.3 ("darken/lighten the token") `--primary` was deepened to **`#A74C66`** (5.43:1 with white, 5.17:1 on bg, 4.87:1 on surface-alt). The brief's lighter rose is preserved as `--primary-tint` for purely decorative use (large hero gradients, etc.).

Similarly the bright status tones (`--success`, `--warning`, `--error`, `--info`) are kept as specified for **backgrounds, icons, and decorative borders** — but TEXT in those colors uses new strong variants that pass AA on the warm cream bg:
- `--success-strong: #547044` (5.28:1)
- `--warning-strong: #946724` (4.72:1)
- `--error-strong: #9C443A` (6.04:1)
- `--info-strong: #5A7387` (4.70:1)

**How to apply:** when colorising text, use `text-success-strong` / `text-warning-strong` / `text-error-strong` / `text-info-strong`. Reserve the bright `text-success` etc. for SVG icons sitting on tinted backgrounds (≥3:1 large/non-text suffices).

### D23: De-pinked surfaces — rose reserved for primary actions
First pass tinted every surface with `--primary-soft` (#F5DDE4) — table-row hover, alternate rows, button-outline hover, gradients — making the chrome read as monochromatic pink. Reverted surfaces to neutral warm-cream (`--bg #FDF9F2`, `--surface-alt #F9F2E2`, `--surface-hover #F0E5CC`, `--border #E8DEC8`, `--border-strong #D4C5A8`) and switched `tbody tr:hover` and `.btn-outline:hover` to `--surface-hover` (cream, not pink).
**Why:** the rose primary is meant to mark *primary actions* (CTAs, links, focus rings, active sidebar). Bleeding it into every passive hover state turned the whole UI pink.
**How to apply:** when introducing a new hover/active background, prefer `bg-surface-hover` (cream); use `bg-primary/N` only when the element is genuinely a primary action.
