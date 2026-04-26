# Brief for Claude Code — Implement Donor Landing Page 1:1 to Live Prototype

**Status:** ready to execute. Paste this whole file into a Claude Code session opened at the repo root and tell it: *"Read this brief and start."*

---

## 1. Goal

Make the **public donor landing page** rendered at `apps/web/src/app/l/[slug]/page.tsx` look and behave **1:1** with the approved Live Prototype.

The prototype is the source of truth. If reality in the codebase disagrees with the prototype, change the codebase — not the prototype.

## 2. Sources of truth (read these first, in this order)

1. **Live Prototype HTML** — already in the repo:
   `apps/web/src/landingPageDesign/Amutot Landing - Live Prototype.html`
   This is the rendered, animated, final design — open it in a browser side-by-side with what you build and match it pixel-for-pixel.
2. **Online preview** (same prototype, hosted in Claude Design):
   `https://claude.ai/design/p/d9f722f2-c090-4c88-9b38-0955e0b691d6`
3. **Design spec** (tokens, motion, type scale, breakpoints):
   `apps/web/src/landingPageDesign/landing-page-design-spec.md`
4. **Token files** for the design system:
   `apps/web/src/landingPageDesign/tokens.jsx`
   `apps/web/src/landingPageDesign/section-tokens.jsx`
   `apps/web/src/landingPageDesign/themes-secondary.jsx`
5. **Section JSX building blocks** (already extracted from the prototype):
   `apps/web/src/landingPageDesign/sections-top.jsx`
   `apps/web/src/landingPageDesign/sections-bottom.jsx`
   `apps/web/src/landingPageDesign/primitives.jsx`
   `apps/web/src/landingPageDesign/design-canvas.jsx`

## 3. Where to implement

- Public page (donor-facing, this is the main file to update):
  `apps/web/src/app/l/[slug]/page.tsx`
  with its stylesheet `apps/web/src/app/l/[slug]/landing.css`
- Admin builder (must stay in sync — every section in the prototype must be selectable here):
  `apps/web/src/app/(dashboard)/admin/landing/page.tsx`
  `apps/web/src/app/(dashboard)/admin/landing/_components/SectionLibrary.tsx`
  `apps/web/src/app/(dashboard)/admin/landing/_components/SectionProperties.tsx`
- API DTOs (only touch if a section's shape changes):
  `apps/api/src/modules/landing/dto/section.dto.ts`

## 4. Required sections (must match prototype, in this exact order)

1. `nav` — sticky, logo, anchors (אודות / איך זה עובד / גלריה / פעילויות / צרו קשר), primary CTA `תרמו עכשיו` that scrolls to `#donate`.
2. `hero` — gradient + soft animated blobs, big serif Hebrew headline with one accent word, subheadline, two CTAs, trust strip (4 stats, count-up on scroll).
3. `marquee` — scrolling keyword bar.
4. `video` — embedded mission video.
5. `about` — text + layered image.
6. `activities` — grid of 6 programs, hover lift.
7. `gallery` — masonry photo grid.
8. `reviews` — testimonial carousel.
9. `stats` — impact numbers band, count-up.
10. `cta_payment` — donation block: monthly / one-off toggle, preset amount chips (₪50 / ₪100 / ₪250 / ₪500) + custom amount, dedication line, big primary CTA whose text updates live (`תרמו ₪___ עכשיו`), security badges (תשלום מאובטח · קבלה לפי 46), Grow Wallet SDK already wired — keep it.
11. `join_us` — volunteer signup form.
12. `faq` — accordion (Hebrew, 5 items minimum, smooth height + chevron rotation).
13. `footer` — logo, links, social icons, copyright.

## 5. Visual rules — non-negotiable

- **Tokens come from `landing-page-design-spec.md` §2.1.** Use the exact CSS custom properties. Do not invent colors.
- Palette: warm parchment background (`--n-50` `#FBFAF7`), deep ink text (`--n-900`), single accent gold/teal per theme. No B2B SaaS blue.
- Typography: Instrument Serif / Frank Ruhl Libre for display, Inter / Heebo for body. Hebrew RTL by default (`dir="rtl"` at the root). Fluid scale via `clamp()` from spec §2.1.
- Spacing: 8pt grid, `--section-y` desktop, `--section-y-tight` mobile.
- Cards: `--r-card` radius, layered shadows (`--e-2` / `--e-3`), no hard borders.
- Buttons: pill (`--r-btn`), primary gets gradient + glow on hover, secondary is ghost.

## 6. Motion rules

- All entrances: fade-up + 8px translate, **75ms stagger**, `--ease-emphasized` easing.
- Hero blobs: slow CSS keyframes float, gradient slowly shifts.
- Stats: count-up only on viewport entry, never restarts.
- Cards: hover = lift + shadow grow + 1.02 scale.
- Donation chips: spring scale on click; CTA label updates with subtle slide.
- FAQ: smooth height transition + chevron rotation.
- Respect `prefers-reduced-motion` — durations collapse to 0 (already declared in tokens).

## 7. Tech constraints (from the project's CLAUDE.md — do not violate)

- **Tailwind only.** No shadcn, no MUI, no Chakra, no Radix.
- All UI text is **Hebrew, RTL**. Code identifiers are English.
- Tenant scoping: the page is keyed by `[slug]` (org slug). Do not bypass the existing landing API.
- Keep the Grow Wallet SDK donation flow. Don't replace it.

## 8. Acceptance checklist (Claude Code: tick each before reporting done)

- [ ] Open `Amutot Landing - Live Prototype.html` in a browser. Open the new `/l/<demo-slug>` page side by side. They look the same on desktop **and** mobile.
- [ ] Every section listed in §4 renders with the prototype's content shape and animations.
- [ ] Donation block's CTA label updates live as the user picks an amount; selected chip has the spring/scale state.
- [ ] Count-up runs once when stats enter the viewport, not on every scroll.
- [ ] FAQ accordion opens/closes smoothly, only one item open at a time (or many — match prototype behavior).
- [ ] `prefers-reduced-motion` kills animations.
- [ ] Lighthouse mobile ≥ 90 performance, ≥ 95 accessibility.
- [ ] No new component-library deps in `package.json`.
- [ ] Admin builder still works: dragging a section in the admin still re-orders the public page.
- [ ] Run `npm run lint` and `npm run build` — both pass.

## 9. Out of scope (do not touch)

- Backend section DTO shapes, unless a section's data shape genuinely changes.
- Auth, OTP, role enums.
- Other org dashboard pages.
- Payment provider — keep Grow Wallet exactly as it is.

## 10. Reporting

When done, write `docs/landing-page/NN-done.md` (next available number) summarizing in Hebrew:
- מה נעשה (what changed),
- אילו קבצים נגעו,
- צילומי מסך לפני/אחרי (paths to images committed under `docs/landing-page/screenshots/`).
