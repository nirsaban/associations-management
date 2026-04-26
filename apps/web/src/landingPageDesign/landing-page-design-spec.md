# Amutot Landing Page — Design Spec

A single public landing page per non-profit, composed by the admin from a section library, published at `/l/<org-slug>`. Primary goal: **conversion** (donate / join). All content is admin-supplied at runtime; this spec describes the system, not any specific org's copy.

---

## 1. Design philosophy

Premium, calm, trustworthy — closer to a well-designed cultural institution than a B2B SaaS. The work has been happening for decades; the page should feel that way. Generous whitespace, a serif display paired with a humanist sans, one restrained accent per theme, and elevation carried by tinted shadow rather than hard borders. Motion is present but quiet: entrance-on-scroll with 60–90 ms stagger, no bouncy springs on CTAs. Every section must hold its shape with 3 items or 30, a 4-word headline or 14, Hebrew or English.

---

## 2. Design tokens

### 2.1 CSS custom properties (copy verbatim)

```css
/* amutot-tokens.css — applied at :root; overridden per theme on a parent element */
:root {
  /* ─ neutrals (warm-grey, modern theme default) ─ */
  --n-50:  #FBFAF7;
  --n-100: #F5F3EE;
  --n-150: #EDE7DB;
  --n-200: #DFD8C7;
  --n-300: #C6BDA8;
  --n-500: #8E8676;
  --n-600: #6B645B;
  --n-700: #3F3B33;
  --n-800: #26231E;
  --n-900: #15130F;

  /* ─ admin-configurable — defaults are placeholders, overwritten per org ─ */
  --primary:       #2F5F5C;
  --primary-hover: #244845;
  --primary-50:    #E6EFEE;   /* oklch-mixed 12% primary + 88% neutral-50 */
  --primary-200:   #BFD6D4;
  --primary-600:   #244845;
  --primary-700:   #163330;
  --accent:        #C8732F;

  /* ─ semantic ─ */
  --bg:             var(--n-50);
  --surface:        #FFFFFF;
  --surface-raised: var(--n-100);
  --text:           var(--n-900);
  --text-muted:     var(--n-600);
  --border:         #E8E3D9;
  --border-strong:  #D6CFC1;
  --ring:           color-mix(in oklab, var(--primary) 40%, transparent);
  --shadow-tint:    color-mix(in oklab, var(--primary) 18%, transparent);

  /* ─ type ─ */
  --font-display: "Instrument Serif", "Frank Ruhl Libre", Georgia, serif;
  --font-body:    Inter, "Heebo", -apple-system, "Segoe UI", sans-serif;
  --font-mono:    "JetBrains Mono", ui-monospace, Menlo, monospace;

  /* fluid type scale — clamp(min, preferred, max) */
  --t-display-xl: clamp(3rem, 4vw + 2rem, 6rem);      /* 48 → 96 px */
  --t-display-lg: clamp(2.25rem, 2.5vw + 1.5rem, 3.5rem); /* 36 → 56 */
  --t-title-md:   clamp(1.25rem, 0.5vw + 1rem, 1.5rem);   /* 20 → 24 */
  --t-body-lg:    1.0625rem;  /* 17 */
  --t-body:       1rem;       /* 16 */
  --t-body-sm:    0.875rem;   /* 14 */
  --t-label:      0.6875rem;  /* 11, tracked */

  /* ─ spacing · 8pt grid ─ */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px;
  --s-5: 24px; --s-6: 32px; --s-7: 48px; --s-8: 64px;
  --s-9: 96px; --s-10: 128px;
  --section-y:       var(--s-9);        /* desktop vertical padding */
  --section-y-tight: var(--s-7);        /* mobile */

  /* ─ radii ─ */
  --r-sm:   6px;
  --r-md:   10px;
  --r-lg:   16px;
  --r-xl:   24px;
  --r-card: 18px;
  --r-btn:  999px;

  /* ─ elevation ─ */
  --e-0: none;
  --e-1: 0 1px 2px rgba(21,19,15,.04), 0 1px 1px rgba(21,19,15,.03);
  --e-2: 0 4px 10px -2px rgba(21,19,15,.06), 0 2px 4px rgba(21,19,15,.04);
  --e-3: 0 12px 28px -8px rgba(21,19,15,.12), 0 4px 8px rgba(21,19,15,.04);
  --e-4: 0 20px 50px -12px var(--shadow-tint), 0 4px 10px rgba(21,19,15,.05);
  --e-cta: 0 1px 0 rgba(255,255,255,.15) inset, 0 10px 24px -10px var(--shadow-tint);

  /* ─ motion ─ */
  --dur-fast: 160ms;
  --dur-base: 280ms;
  --dur-slow: 520ms;
  --ease-default:     cubic-bezier(0.2, 0.7, 0.2, 1);
  --ease-emphasized:  cubic-bezier(0.22, 1, 0.36, 1);
  --ease-exit:        cubic-bezier(0.4, 0.0, 1, 1);
  --stagger:          75ms;

  /* ─ breakpoints (for reference in @media queries / container queries) ─ */
  --bp-sm:  640px;
  --bp-md:  768px;
  --bp-lg:  1024px;
  --bp-xl:  1280px;
  --bp-2xl: 1440px;
}

@media (prefers-reduced-motion: reduce) {
  :root { --dur-fast: 0ms; --dur-base: 0ms; --dur-slow: 0ms; --stagger: 0ms; }
}
```

### 2.2 JS object form (for Tailwind config / theme provider)

```js
export const tokens = {
  color: {
    neutral: { 50:'#FBFAF7',100:'#F5F3EE',150:'#EDE7DB',200:'#DFD8C7',300:'#C6BDA8',500:'#8E8676',600:'#6B645B',700:'#3F3B33',800:'#26231E',900:'#15130F' },
    semantic: { bg:'var(--bg)', surface:'var(--surface)', surfaceRaised:'var(--surface-raised)', text:'var(--text)', textMuted:'var(--text-muted)', border:'var(--border)', borderStrong:'var(--border-strong)', ring:'var(--ring)', shadowTint:'var(--shadow-tint)' },
    primary: { DEFAULT:'var(--primary)', hover:'var(--primary-hover)', 50:'var(--primary-50)', 200:'var(--primary-200)', 600:'var(--primary-600)', 700:'var(--primary-700)' },
    accent: 'var(--accent)',
  },
  font: { display:'var(--font-display)', body:'var(--font-body)', mono:'var(--font-mono)' },
  type: { displayXl:'var(--t-display-xl)', displayLg:'var(--t-display-lg)', titleMd:'var(--t-title-md)', bodyLg:'var(--t-body-lg)', body:'var(--t-body)', bodySm:'var(--t-body-sm)', label:'var(--t-label)' },
  space: { 1:4,2:8,3:12,4:16,5:24,6:32,7:48,8:64,9:96,10:128, sectionY:96, sectionYTight:48 },
  radius: { sm:6, md:10, lg:16, xl:24, card:18, btn:9999 },
  elevation: { 0:'none', 1:'var(--e-1)', 2:'var(--e-2)', 3:'var(--e-3)', 4:'var(--e-4)', cta:'var(--e-cta)' },
  motion: {
    dur: { fast:160, base:280, slow:520 },
    ease: { default:[0.2,0.7,0.2,1], emphasized:[0.22,1,0.36,1], exit:[0.4,0,1,1] },
    stagger: 75,
  },
  breakpoint: { sm:640, md:768, lg:1024, xl:1280, '2xl':1440 },
};
```

### 2.3 How admin primary/accent drive the scale

Two inputs: `primary_color` (hex) and `accent_color` (hex). At build/ render time, derive a 7-stop scale by mixing in oklch against the theme's neutral-50 and neutral-900:

```js
// runtime or build-time; prefer build-time CSS var injection on :root
const P = parseOklch(primary_color);
const stops = {
  50:  oklchMix(P, neutral50, 0.88),
  200: oklchMix(P, neutral50, 0.55),
  300: oklchMix(P, neutral50, 0.30),
  400: P.withL(0.60),
  500: P,                         // admin input, untouched
  600: P.withL(P.l - 0.08),
  700: oklchMix(P, neutral900, 0.30),
};
// shadow-tint is always color-mix(primary 18%, transparent)
```

Always recompute the scale when `primary_color` changes. Never hard-code a tint table keyed on the admin's hex.

---

## 3. Typography system

| Role         | Family            | Size (desktop → mobile) | Weight | Line | Tracking | Usage |
| ------------ | ----------------- | ----------------------- | ------ | ---- | -------- | ----- |
| display/xl   | Instrument Serif  | 96 → 46 px (clamp)      | 400    | 0.98 | -0.02em  | Hero headlines |
| display/lg   | Instrument Serif  | 56 → 34 px              | 400    | 1.02 | -0.018em | Section titles |
| display/md   | Instrument Serif  | 34 → 26 px              | 400    | 1.1  | -0.015em | Reviews, pull-quotes |
| title/md     | Inter             | 24 → 19 px              | 500    | 1.25 | -0.01em  | Card titles, accordion headers |
| body/lg      | Inter             | 17 → 16 px              | 400    | 1.55 | 0        | Section intros |
| body         | Inter             | 16 px                   | 400    | 1.6  | 0        | Rich text |
| body/sm      | Inter             | 14 px                   | 400    | 1.5  | 0        | Captions, meta |
| label        | Inter             | 11 px                   | 500    | 1.4  | 0.14em UPPERCASE | Section eyebrows |

**Hebrew handling.** Heebo is matched to Inter on x-height; Frank Ruhl Libre pairs with Instrument Serif. When `<html lang="he" dir="rtl">` or `[data-lang="he"]`, swap the font stack so Heebo/Frank Ruhl come *first*, not as a fallback:

```css
[lang="he"], :is([dir="rtl"]) { --font-body: "Heebo", Inter, sans-serif; --font-display: "Frank Ruhl Libre", "Instrument Serif", serif; }
```

Hebrew runs ~15% shorter than English. Use `text-wrap: balance` on all headlines and **do not** fix headline height — let it reflow.

---

## 4. Motion system

| When | Property | Duration | Easing |
| ---- | -------- | -------- | ------ |
| Hover lift (cards, buttons) | `translateY(-1px)` + shadow step | `--dur-fast` 160ms | `--ease-default` |
| Button press | `scale(0.98)` | 120ms | `--ease-default` |
| Entrance-on-scroll | `opacity 0→1, translateY(12px → 0)` | `--dur-base` 280ms | `--ease-emphasized` |
| Entrance stagger (grid children) | per-child delay | `--stagger` 75ms | — |
| Accordion open/close | `grid-template-rows 0fr → 1fr` + opacity | `--dur-base` | `--ease-emphasized` |
| Lightbox open | scale 0.96→1, opacity | `--dur-slow` 520ms | `--ease-emphasized` |
| Stats count-up | numeric easing, 1.2 s | once when ≥60% visible | `--ease-default` |
| Exit / close | fade only | `--dur-fast` | `--ease-exit` |

**No bouncy springs anywhere.** CTAs in particular must not bounce — they are a commercial action.

**Reduced motion.** Under `prefers-reduced-motion: reduce`, collapse all durations to 0 via the token override in § 2.1. Transform-based entrances become instantaneous opacity swaps. Count-up snaps to final value.

**Implementation note.** Assume Framer Motion (`motion.dev`). Expose a `useEntrance()` hook that returns `initial`/`whileInView`/`viewport={{ once: true, amount: 0.25 }}` + the standard easing — every section uses it.

---

## 5. Theme definitions

Every theme accepts `--primary` and `--accent` and derives scales the same way. Only the token overrides below differ.

### 5.1 `modern` (default, full-fidelity)
Clean, bright, lots of whitespace, serif display. **Pick when:** the org has no strong existing brand, or wants "premium nonprofit." Uses the base tokens as specified in § 2.1.

### 5.2 `warm`
Earthy, slightly rounded, human. **Pick when:** community / youth / family-focused; the work is relational.
```css
[data-theme="warm"] {
  --n-50:#F7F1E8; --n-100:#FDF9F2; --n-200:#E6D8C2; --n-600:#6E5A44; --n-900:#2B1F14;
  --bg: var(--n-50); --surface: var(--n-100); --text: var(--n-900); --border: var(--n-200);
  --r-card: 22px; --r-btn: 14px;   /* softer corners */
  --font-display: "Fraunces", "Frank Ruhl Libre", Georgia, serif;
}
```

### 5.3 `minimal`
Near-monochrome, heavy whitespace, thin rules, editorial. **Pick when:** highbrow / cultural / advocacy.
```css
[data-theme="minimal"] {
  --n-50:#FAFAFA; --n-100:#FFFFFF; --n-200:#EAEAEA; --n-600:#757575; --n-900:#0A0A0A;
  --bg: var(--n-50); --surface: var(--n-100); --text: var(--n-900); --border: var(--n-200);
  --e-1: 0 0 0 1px var(--n-200);
  --e-cta: 0 0 0 1px var(--n-900);   /* no colored shadow; hairline only */
  --r-card: 0px; --r-btn: 0px;        /* sharp */
  /* minimal intentionally demotes the admin's accent — used only for links */
}
```

### 5.4 `bold`
Saturated color, large display type, asymmetric. **Pick when:** activist / campaigning. Dark by default.
```css
[data-theme="bold"] {
  --n-50:#17171A; --n-100:#0E0E10; --n-200:#2A2A30; --n-600:#9A9AA3; --n-900:#FDFDFD;
  --bg: var(--n-100); --surface: var(--n-50); --text: var(--n-900); --border: var(--n-200);
  --font-display: Inter;  /* display-weight inter, 800, -0.035em tracking */
  --r-card: 8px;
}
```

Rationale for tokens-over-themes: the admin picks theme AND primary/accent independently. Themes set structure (corner radius, darkness, type family); primary/accent set hue. This is why no theme may bake the primary color into fixed tokens.

---

## 6. Section specs

All sections share: `section` container with horizontal gutters `max(6vw, 32px)`, max inner width `1280px`, vertical padding `var(--section-y)` desktop / `var(--section-y-tight)` mobile.

### 6.1 hero

**Purpose.** First impression + primary CTA. Typically at the top; optional secondary CTA scrolls to `#story` or opens video.

**Admin-editable fields**

| Field | Type | Required | Constraint |
| ----- | ---- | -------- | ---------- |
| eyebrow       | string | no  | max 48 chars |
| headline      | string | yes | 4–80 chars; warn on save if >80 |
| subheadline   | string | no  | max 200 chars |
| primary_cta_label | string | yes | max 24 chars (defaults to "Donate") |
| primary_cta_action| enum   | yes | `payment` or `link` |
| secondary_cta_label | string | no | max 24 chars |
| background_image    | image  | no | 2400×1200 min; JPEG/WebP; alt text required |

If no `background_image`, render the animated gradient mesh (two tinted radial blobs behind the text). Never render a plain flat color.

**Layout**

| Breakpoint | Columns | Gutter | Headline | CTA row |
| ---------- | ------- | ------ | -------- | ------- |
| desktop 1440 | content 12-col, left-aligned (or right in RTL) | 48px side, 40px top | `clamp(60, 5vw, 96)` | horizontal, `gap: 12` |
| tablet 768   | content full-width | 32/28 | 56 px | horizontal, wraps |
| mobile 390   | full-width | 22/16 | 46 px | stacked, full-width CTAs |

**Empty state.** If `headline` is blank at runtime, do not render the section (it should never ship empty — admin builder requires it).

**Motion.** Headline: opacity 0→1 + translateY 16→0, 480ms, emphasized ease, 0ms delay. Subhead: same, 80ms delay. CTAs: 160ms delay, same curve. Gradient blobs: 20 s slow drift loop (`@keyframes`, `transform: translate()`), 0.05 opacity breathing; disabled under reduced-motion.

**A11y.** `<h1>` lives here; exactly one per page. Alt text required for background image. Gradient mesh uses `aria-hidden`. Contrast: headline-on-bg ≥ 7:1 computed post-overlay; subhead ≥ 4.5:1.

**Variability**
- 4-word headline at 96 px → occupies ~2 lines.
- 14-word headline drops to 72 px automatically (container query on headline length), still 3 lines max.
- Hebrew headline: use `--font-display` fallback (Frank Ruhl Libre) and -0.01em tracking instead of -0.02em (Hebrew letters need more air).

### 6.2 video

**Purpose.** Story in motion. Usually after hero.

**Fields.** `title` (str, req, max 80), `description` (str, opt, max 240), `source` (url: YouTube / Vimeo / uploaded MP4, req), `orientation` (enum: `16:9` | `9:16` | `1:1`, req, default `16:9`), `poster_image` (image, opt — extracted from source if absent).

**Layout.** Centered stack. Video width: `16:9` → up to 960px; `9:16` → 320px; `1:1` → 560px. Rounded corners `var(--r-lg)`, elevation `--e-4`.

**States.** `loading` → skeleton shimmer on poster; `error` → replace with a static frame + text "Video unavailable"; never crash the section.

**Motion.** Poster fades in (280ms). Play button scales 1 → 1.03 on hover (160ms). No autoplay unless `muted` and `playsInline` and the admin opts in via a `muted_autoplay` flag (default off — it's disruptive).

**A11y.** Native player controls; embed title attribute populated from `title`; caption track required for uploaded videos (block save if absent — see § 9).

### 6.3 about

**Purpose.** Mission + brief history.

**Fields.** `title` (str, req, max 80), `body_rich_text` (markdown subset: p, ul, strong, em, a; max 1200 chars), `side_image` (image, opt; 4:5 portrait, 1200×1500 min).

**Layout.**
- Desktop: 12-col grid; title + body span 7 cols, image spans 5 on the right (5 left in RTL).
- Tablet: 6+6.
- Mobile: stacked; image above text.

**Empty.** If `body_rich_text` blank, don't render. If no `side_image`, center the text block (max-width 62ch).

**Motion.** Title + first paragraph enter together; image enters with 120ms delay, same curve.

### 6.4 activities

**Purpose.** What the org does.

**Fields per card.** `title` (req, max 60), `description` (req, max 200), `image` (opt; 4:3; 800×600 min) OR `icon` (enum from curated 24-icon list, opt), `link_url` (opt).

**Grid**

| Count | Desktop cols | Tablet cols | Mobile cols |
| ----- | ------------ | ----------- | ----------- |
| 1     | card takes 6 of 12 cols, left-aligned | 6 of 6 | 1 |
| 2–3   | 3           | 2           | 1 |
| 4–6   | 3           | 2           | 1 |
| 7–12  | 4           | 3           | 1 (or 2 on wide phones) |
| 0     | section does not render |

Gap: `var(--s-5)` (24px). Card radius `var(--r-card)` (18). Card bg `--surface`. Image aspect locked 4:3.

**Motion.** Each card: opacity + translateY 8 → 0, 280ms, `--stagger` 75 ms between children. Hover: lift 1px, shadow step `--e-2` → `--e-3`.

**A11y.** Entire card clickable if `link_url` present; otherwise `<article>` non-interactive. Alt text required for each `image` before save.

### 6.5 gallery

**Fields.** `images[]` (0–60; 800px min on long edge; alt text required per image).

**Layout.** 4-column CSS columns masonry (desktop), 3 (tablet), 2 (mobile). 12 px gap. Each image rounded `var(--r-md)`.

**States.** 0 images → section does not render. 1–3 → render as a centered inline row rather than masonry. ≥4 → masonry.

**Lightbox.** Click opens full-bleed modal. ←/→ navigate, Esc closes, focus trapped, background dimmed `rgba(0,0,0,.86)`. Image max 92vh/92vw, preserved aspect. Caption uses alt text. Prefetch adjacent image on open.

**Motion.** Images enter bottom-up with 40 ms stagger. Lightbox fade 280 ms, image scales from `clickOrigin` via `view-transition-name` if supported, else `scale(0.96→1)`.

### 6.6 reviews

**Fields per approved review.** `name` (req, max 40), `rating` (int 1–5, req), `body` (req, max 400), `date`, `approved` (bool; only `true` render).

**Grid.** 3-up desktop / 2 tablet / 1 mobile. Card: serif pull-quote style, name below, star row above. Stars use `--primary` (not yellow — consistent with brand).

**States**
- `empty` (no approved reviews) → show dashed card with copy "Be the first to leave a note" + button to open the inline form.
- `populated` → grid + "Leave your own review" secondary CTA below.
- `form` → inline form replaces CTA on click: name, star picker (keyboard-accessible, `role="radiogroup"`), textarea. Submit → "Thanks — your review is pending approval."

**Motion.** Stagger as activities. Form slide-down 320ms.

### 6.7 stats

**Fields.** 3–5 stats: `value` (string; can include `₪`, `%`, `,`), `label` (str, max 80).

**Layout.** Dark band (text color = neutral-900 bg, foreground neutral-100). Numbers in display/xl serif, 72–96 px. 3–5 equal columns desktop; 2×2 or 2×3 tablet; 1-col mobile.

**Motion.** When band enters viewport and numeric, count up from 0 to `value` over 1.2 s (parse integer/percent/currency; preserve suffix). Respects reduced-motion (snap to final).

### 6.8 cta_payment — the conversion engine

**Purpose.** The single section that must convert.

**Fields.** `headline` (req, max 80), `subheadline` (opt, max 200), `amounts[]` (array of integers in shekels, 3–6, req — defaults `[100, 250, 500, 1000]`), `default_amount_index` (int), `allow_custom` (bool), `installments_hint` (bool; if true show "up to 12 installments"), `receipt_hint` (bool; if true show "§46 tax receipt").

**Layout.** Centered, max 720 px. Eyebrow → headline (display/xl) → sub → amount chip row → single primary CTA → trust row (lock icon, installments, receipt). Chip row wraps on narrow viewports. Selected chip uses `--primary` bg; others `--surface` with border.

Background is `--primary-50` (light primary tint) so the section is visually distinct from neighbors without a jarring saturation jump.

**Mobile.** Chips wrap to 2–3 per row, CTA is full-width.

**Motion.** Headline + chips enter with tight stagger (50 ms). CTA shadow breathes very subtly (1.00 → 1.005 scale over 2.4 s loop) — this is the one animation that earns its keep. Disable under reduced-motion.

**A11y.** Chips are `role="radiogroup"`. CTA `<button>` with `aria-describedby` pointing at the trust row so screen readers announce the security context. Focus ring `--ring`, 3 px offset.

### 6.9 join_us

**Fields.** Form fields: name (req), email (req, validated), phone (opt, loose int'l pattern), message (opt, max 500). Also `submit_label` (str, opt, default "Send"), `success_message` (str, opt, default "Got it. Thank you.").

**Layout.** Two-column desktop (40/60 – copy left, form right). Stacked mobile. Form card `--surface`, `--e-2`, radius `--r-xl`.

**States.** `default`, `submitting` (button spinner, fields disabled), `error` (inline red text under the offending field + shake 1px 2× on submit rejection), `success` (entire form replaced by centered checkmark + message, 560 ms emphasized ease).

**A11y.** Labels always visible (no placeholder-as-label); error messages `aria-live="polite"`; phone field `inputmode="tel"`.

### 6.10 faq

**Fields.** `items[]`: `{ question: str, answer: rich_text }`. Min 1 to render.

**Layout.** Two-column desktop: title column + list column (1fr / 2fr). Stacked mobile. Each item: `<button aria-expanded>` row with question + chevron, collapsible answer panel.

**States.** `collapsed` (default), `one-open` (chevron rotated 180°, answer visible), `all-open` (admin can set `default_all_open` for highbrow use cases).

**Motion.** Open/close via `grid-template-rows: 0fr → 1fr` + opacity on the answer; 280ms emphasized.

**A11y.** Proper `aria-expanded`, `aria-controls`, unique IDs. Whole row is the button — not just the chevron. Keyboard: Enter/Space toggles; ↑/↓ moves focus between questions.

### 6.11 footer

**Fields.** `address` (str, opt), `hours` (str, opt), `email` (req), `phone` (opt), `social[]` (enum: instagram/facebook/youtube/twitter/tiktok/linkedin; each with url), `legal_name_hebrew` (req — Israeli non-profits must display), `legal_name_english` (opt), `registration_number` (req, format `58-XXX-XXX-X`), `section_46_authorized` (bool), `credits_line` (opt, max 120).

**Layout.** Dark band (neutral-900 bg, neutral-100 text). 4-col desktop (logo+about / visit / contact / follow), 2-col tablet, 1-col mobile. Legal line + credits in a `--border` divided row at bottom.

**A11y.** Social icons labeled (`aria-label="Instagram"`). External links `rel="noopener"`.

---

## 7. Component primitives

### Button

| Variant | Bg | Fg | Border | Shadow |
| ------- | -- | -- | ------ | ------ |
| primary   | `--primary`       | `#fff`      | none               | `--e-cta` |
| secondary | `--surface`       | `--text`    | 1px `--border`     | `--e-1` |
| ghost     | transparent       | `--text`    | none               | none |
| danger    | `#B43A2B`         | `#fff`      | none               | `--e-1` |

Sizes: `sm` (36×pad 16, 13px), `md` (44×pad 22, 14.5px), `lg` (52×pad 30, 16px). Radius `--r-btn` (999). States: hover → shadow step + 1px lift; active → scale 0.98; focus-visible → 3px `--ring` offset 2px; disabled → 50% opacity, no pointer-events.

### Card
`--surface` bg, `--r-card` radius, 1px `--border`, padding `--s-5`. Hover: shadow `--e-2` → `--e-3`, translateY -1px.

### Input / Textarea
Label above (never placeholder-as-label). Field: `--bg` fill, 1px `--border`, radius `--r-md`, padding 12×14. Focus: border `--primary`, ring `--ring`. Error: border `#B43A2B`, helper text red below.

### Select
Uses native `<select>` on mobile; custom listbox on desktop (radix-style pattern). Same chrome as Input closed; popover is `--surface` elevated `--e-3`.

### Rating
5-star radiogroup; keyboard left/right to change; fills in `--primary`.

### Dialog / Lightbox
`role="dialog"` + focus trap + scroll lock. Backdrop `rgba(0,0,0,.86)`; content `--surface` radius `--r-xl` (or full-bleed for lightbox). Close: top-right 36px hit target, Esc, backdrop click.

### Accordion
See § 6.10. Single implementation reused for FAQ and any future collapsible.

---

## 8. Accessibility checklist

- [ ] All images require alt text **at admin save time** — block publish otherwise.
- [ ] Every interactive element ≥ 44×44 px hit target on mobile.
- [ ] Focus states never rely on color alone — shadow ring + offset.
- [ ] Color contrast: body text ≥ 4.5:1; large text ≥ 3:1; against every admin primary color (validate at save time and warn).
- [ ] Heading order: one `<h1>` (hero), `<h2>` per section, `<h3>` for cards.
- [ ] Language: `<html lang>` matches org's default; sections with mixed content use `lang=""` on spans.
- [ ] RTL: use logical properties (`padding-inline-start`, `margin-inline-end`). Never hard-code `left`/`right` for layout.
- [ ] Reduced motion: all animations collapse (§ 4).
- [ ] Keyboard: every flow (donate, join, review, FAQ, lightbox) operable without a mouse.
- [ ] Screen reader: stats count-up is hidden from AT (`aria-hidden` on the animated span, true value in a visually-hidden sibling).
- [ ] Forms: associated labels, error summary, `aria-live` for async states, `autocomplete` attributes on name/email/phone.

---

## 9. Open questions for the implementer (admin-builder UX)

These are UX policies the **admin** (section builder) side of the product must enforce — the public landing page alone can't guarantee them.

1. **Headline length cap.** Hero headline hard-limit 80 chars; warn at 60. Subheadline 200 chars.
2. **Alt text required.** Block save of any section containing an image whose `alt` is empty. Offer "decorative" checkbox that sets `role="presentation"` explicitly.
3. **Minimum items to render.** Activities, gallery, reviews, FAQ all require ≥1 item. Admin sees a greyed-out preview thumbnail with "Add at least 1 item to publish this section."
4. **Section dependency.** `cta_payment` requires the org's payment partner to be connected. If disconnected, block adding the section and explain why.
5. **Image quality.** Reject uploads under 800 px on the long edge. Offer auto-convert to WebP on upload.
6. **Legal fields for footer.** Registration number and Hebrew legal name are required before publish (Israeli law). Section 46 authorization shown only if verified in the org's settings.
7. **Primary color contrast.** When admin picks a `primary_color`, compute contrast against `#FFFFFF` and `--text`. If < 4.5:1 for white text on primary, disable primary-button style until they pick a darker hue, or automatically desaturate for buttons while preserving their choice elsewhere.
8. **Preview in RTL & LTR.** Admin builder should offer a language toggle in preview regardless of their default, so they catch Hebrew/English length differences before publish.
9. **Max sections.** Soft cap at 11 (one of each); hard cap 15 (allow duplicates of activities/gallery if needed for multi-program orgs).
10. **Theme + primary-color combo warnings.** Some combos (e.g. `bold` theme + pastel primary) look bad. Show a live preview thumbnail swatch; don't auto-correct.
11. **Video captions.** Uploaded videos require a caption track before publish; embedded YouTube/Vimeo warn if captions not available.
12. **Review moderation default.** All new reviews land `approved: false`. Admin gets email digest of pending reviews.

---

*End of spec. Any decision not stated here is at the implementer's discretion; any decision stated here should not be silently "corrected" without raising it.*
