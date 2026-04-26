# Gap-Fix Brief — Finish the Donor Landing Page (Claude Code)

**Status of previous attempt:** unfinished. Only 3 of 13 sections were built. The renderer at `apps/web/src/app/l/[slug]/page.tsx` has a literal placeholder at **line 273**:

```tsx
{/* Placeholder — remaining sections added in subsequent steps */}
<div style={{ minHeight: '40vh', padding: '64px' }} />
```

You (Claude Code) are picking up where that stopped. **Do not stop until all 13 sections render and visually match the prototype 1:1.**

---

## 1. The single source of truth

Open and keep open in a browser tab while you work:

- Local prototype HTML: `apps/web/src/landingPageDesign/Amutot Landing - Live Prototype.html`
  Section line ranges in that file:
    - `nav` — line 328
    - `header.hero` — line 342
    - `section#story` (video / mission) — line 390
    - `section.about#about` — line 404
    - `section.activities#activities` — line 421
    - `section.gallery#gallery` — line 482
    - `section.reviews` — line 495
    - `section.stats` — line 523
    - `section.cta#donate` — line 551
    - `section.join#contact` — line 579
    - `section.faq` — line 604
    - `footer.footer` — line 655
- Hosted preview (same prototype): `https://claude.ai/design/p/d9f722f2-c090-4c88-9b38-0955e0b691d6`
- Live broken page to compare against: `http://localhost:3010/l/or-laam?preview=1`
- Design tokens spec: `apps/web/src/landingPageDesign/landing-page-design-spec.md`

The prototype HTML is **1.6k lines** with all CSS inlined. Lift the relevant CSS for each section into `apps/web/src/app/l/[slug]/landing.css` (extending what's already there — do not rewrite the file from scratch and do not break the nav/hero/donate styles already working).

## 2. What is currently broken (verified by screenshot at `/l/or-laam?preview=1`)

| # | Section | Status |
|---|---|---|
| 1 | nav | ✅ rendered |
| 2 | hero | ⚠️ partial — pill `נוסדה 1994` and stat tiles row visible only when data exists; verify or-laam seed has them |
| 3 | marquee (scrolling keywords) | ❌ not rendered |
| 4 | video / story (`#story`) | ❌ not rendered |
| 5 | about (`#about`) | ❌ not rendered |
| 6 | activities (`#activities`) | ❌ not rendered |
| 7 | gallery (`#gallery`) | ❌ not rendered |
| 8 | reviews | ❌ not rendered |
| 9 | stats | ❌ not rendered |
| 10 | cta_payment (`#donate`) | ✅ rendered (Grow Wallet wired — DO NOT TOUCH) |
| 11 | join_us (`#contact`) | ❌ not rendered |
| 12 | faq | ❌ not rendered |
| 13 | footer | ❌ not rendered |

10 missing sections. The page just ends after the donate block with a 40vh blank div.

## 3. Exact code change required

In `apps/web/src/app/l/[slug]/page.tsx`:

1. **Delete the placeholder** at lines 273-274.
2. **Insert renderers** for the 10 missing sections, in the same order as `sections.sort((a, b) => a.position - b.position)`. Each renderer must:
    - be conditionally rendered like the existing `cta_payment` block (`{sections.some((s) => s.type === 'X') && (...)}` with the section's `data` passed in),
    - use `id="X"` matching the anchor in `NAV_ANCHORS` where applicable (`#story`, `#about`, `#activities`, `#gallery`, `#contact`, `#donate`),
    - copy the prototype's HTML structure and class names verbatim from the line ranges above so the existing-or-new CSS selectors match,
    - be data-driven from `section.data` — no hardcoded copy. Default values can mirror the prototype's content as fallbacks.

3. **Critical: also render the sections in the order the admin set them, not in a hardcoded order.** Switch the page body to a single `sections.map((s) => renderSection(s))` so reordering in the admin builder reorders the public page. Replace the current ad-hoc `sections.find(... 'cta_payment')` and `sections.find(... 'hero')` calls with a `switch (s.type)` inside `renderSection` covering all 13 types. Keep nav and the count-up effect at the top level.

## 4. CSS extension

Append to `apps/web/src/app/l/[slug]/landing.css` only the rules from the prototype that target the 10 new sections (selectors starting with `.marquee`, `.about`, `.activities`, `.gallery`, `.reviews`, `.stats`, `.join`, `.faq`, `.footer` and shared primitives like `.section`, `.eyebrow`, `.kicker` if not already present). Do not duplicate rules that already exist for `.nav`, `.hero`, `.cta`, `.btn`, `.blob`. Use the design tokens declared at the top of the spec — don't hardcode new colors.

## 5. Animations — must work

Match the prototype:
- entrance: `opacity 0 → 1` + `translateY(8px) → 0` with `--stagger 75ms` between siblings, triggered when section enters viewport (use a single shared `IntersectionObserver`).
- stats count-up: same observer pattern already in `page.tsx` lines 99-140 — extend the selector to also pick up `.stats .n[data-num]`, not just `.hero-stat .n`.
- marquee: pure CSS infinite scroll, paused on hover.
- gallery: hover lift (1.02 scale + shadow).
- faq: smooth height transition + 180° chevron rotate when open.
- reviews carousel: auto-advance every 6s, pause on hover, dot indicators, prev/next on arrow keys.
- All animations must collapse under `prefers-reduced-motion: reduce` (already declared in tokens).

## 6. Data shape — match what the admin builder already provides

Look at `apps/web/src/app/(dashboard)/admin/landing/page.tsx` `getDefaultData()` (around line 58). The shapes there are authoritative — use those exact field names when reading `section.data` in your renderers. If a field is missing, fall back gracefully (don't render an undefined `<img>`, don't render an empty `<h2>`).

## 7. Verify against the org seed

Run:
```bash
psql $DATABASE_URL -c "SELECT type, position, visible FROM \"Section\" s JOIN \"LandingPage\" lp ON s.\"landingPageId\" = lp.id JOIN \"Organization\" o ON lp.\"organizationId\" = o.id WHERE o.slug = 'or-laam' ORDER BY position;"
```

If the seed only contains `hero` + `cta_payment`, **also** add the remaining 11 sections to the seed for `or-laam` so the demo page actually shows everything. Use copy from the prototype as the seed values.

The seed file is most likely `prisma/seed.ts` or under `prisma/seeds/`. Find it, extend it, and re-run `npx prisma migrate reset --force`.

## 8. Acceptance — Claude Code must NOT report done until every box is ticked

- [ ] `apps/web/src/app/l/[slug]/page.tsx` line 273-274 placeholder is gone.
- [ ] Visiting `http://localhost:3010/l/or-laam?preview=1` shows all 13 sections in order, with content, in Hebrew RTL.
- [ ] The page side-by-side with the prototype HTML looks identical at 1440px desktop and 390px mobile (use Chrome devtools).
- [ ] Stats count-up runs in both `hero` and `stats` sections when scrolled into view.
- [ ] Reviews carousel auto-rotates and responds to ←/→ keys.
- [ ] FAQ accordion: clicking opens with smooth height; chevron rotates.
- [ ] Marquee scrolls horizontally and pauses on hover.
- [ ] Footer renders org info from `org` (legalName, contactPhone, contactEmail, address, socials).
- [ ] No console errors. No hydration warnings. No new packages added.
- [ ] `npm run lint` passes. `npm run build` passes.
- [ ] Reordering sections in the admin builder reorders the public page (test by dragging a section then refreshing `/l/or-laam`).
- [ ] `prefers-reduced-motion` kills all animations (test in devtools rendering tab).

## 9. Out of scope

- Don't replace Grow Wallet. Don't refactor it.
- Don't touch backend DTOs unless a section's data shape genuinely needs a new field.
- Don't add a component library.

## 10. Reporting

When (and only when) every checkbox above is ticked:
1. Take 2 screenshots of `/l/or-laam?preview=1` (desktop + mobile, full page) into `docs/landing-page/screenshots/`.
2. Write `docs/landing-page/04-done.md` in Hebrew describing what was added, files touched, and link to the screenshots.

Now go. The placeholder at line 273 is your starting point.
