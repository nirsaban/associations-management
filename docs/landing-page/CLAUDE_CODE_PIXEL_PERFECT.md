# Pixel-Perfect Brief — Final, Aggressive Version

The previous two attempts produced something *similar to* the prototype, not *identical*. This brief removes the wiggle room.

> **Rule of thumb: if you find yourself writing a class name that does not appear in `Amutot Landing - Live Prototype.html`, stop. You're inventing.**

---

## 1. The mental model

The prototype HTML at `apps/web/src/landingPageDesign/Amutot Landing - Live Prototype.html` is **the production design**. Your job is to pour data into it, nothing else.

Think of it as a template, not an inspiration. We are not "rebuilding it in React." We are **embedding the exact HTML and CSS** and binding text to org data.

## 2. The non-negotiable rules

1. **Every CSS rule comes from the prototype's `<style>` block (lines 10–324).** Copy that block verbatim into `apps/web/src/app/l/[slug]/landing.css`, replacing whatever's in there. Do not "tidy up." Do not "convert to tokens." Do not delete a single selector. The only edit allowed is wrapping the whole thing inside `.lp-landing { ... }` so it stays scoped.
2. **Every section's HTML structure comes from the prototype, byte-for-byte.** Copy the markup from the line ranges below into the React component as literal JSX. The only edits allowed are:
    - text nodes → data bindings (`{data.headline}`, etc.),
    - `class` → `className`,
    - inline `style="..."` → `style={{...}}` if React forces it,
    - self-closing void tags (React requirement),
    - swapping `<img src="..." />` literals for `{data.image_url}` bindings.
3. **No new class names. No Tailwind utilities. No styled-components. No emotion. No `style={{}}` props that didn't exist in the prototype.** If a class isn't in the prototype, it doesn't exist.
4. **No "I'll refactor this for clarity" moves.** The prototype is messy on purpose — animations, blob positions, custom properties, repeated nth-child selectors. All of it stays.

## 3. Section line ranges in the prototype

Use these as your copy-paste source:

| Section | Line range (HTML) |
|---|---|
| `<style>` block (whole thing) | 10–324 |
| `nav` | 328–341 |
| `header.hero` | 342–389 |
| `section#story` (video / mission) | 390–403 |
| `section.about#about` | 404–420 |
| `section.activities#activities` | 421–481 |
| `section.gallery#gallery` | 482–494 |
| `section.reviews` | 495–522 |
| `section.stats` | 523–550 |
| `section.cta#donate` | 551–578 |
| `section.join#contact` | 579–603 |
| `section.faq` | 604–654 |
| `footer.footer` | 655–end |
| `<script>` block (any animations) | search for `<script>` after line 655 |

## 4. Data binding strategy

For each section, declare a tiny TypeScript type matching the section's `data` shape (use the field names already in `apps/web/src/app/(dashboard)/admin/landing/page.tsx` `getDefaultData()`). Then bind by **replacing only text nodes** in the prototype's HTML.

Example for the `marquee` section:

Prototype HTML:
```html
<div class="marquee">
  <div class="marquee-track">
    <span>חונכות</span><span>•</span><span>מזון</span>...
  </div>
</div>
```

React version:
```tsx
function MarqueeSection({ data }: { data: { items: string[] } }) {
  return (
    <div className="marquee">
      <div className="marquee-track">
        {data.items.map((item, i) => (
          <span key={i}>{item}{i < data.items.length - 1 && '•'}</span>
        ))}
      </div>
    </div>
  );
}
```

Notice: same class names, same structure, same separator. The only thing that changes is `<span>חונכות</span>` becomes `{data.items[0]}`.

## 5. Animations — copy any `<script>` from the prototype too

If the prototype has a `<script>` block (count-up, FAQ accordion, carousel auto-rotate, scroll reveal, marquee duplication), port the **exact same JS logic** into a `useEffect` in `page.tsx`. Same delays, same easings, same selector strings. Don't replace `requestAnimationFrame` with a library, don't swap easings, don't "make it more Reacty."

## 6. The renderer change

In `apps/web/src/app/l/[slug]/page.tsx`:

1. Replace the placeholder block at line 273-274 plus the existing ad-hoc `cta_payment` and `hero` rendering with a single ordered map:

```tsx
{sections.map((s) => {
  switch (s.type) {
    case 'hero':       return <HeroSection key={s.id} data={s.data} />;
    case 'marquee':    return <MarqueeSection key={s.id} data={s.data} />;
    case 'video':      return <VideoSection key={s.id} data={s.data} />;
    case 'about':      return <AboutSection key={s.id} data={s.data} />;
    case 'activities': return <ActivitiesSection key={s.id} data={s.data} />;
    case 'gallery':    return <GallerySection key={s.id} data={s.data} />;
    case 'reviews':    return <ReviewsSection key={s.id} data={s.data} />;
    case 'stats':      return <StatsSection key={s.id} data={s.data} />;
    case 'cta_payment':return <GrowDonateSection key={s.id} data={s.data} org={org} slug={slug} />;
    case 'join_us':    return <JoinSection key={s.id} data={s.data} />;
    case 'faq':        return <FaqSection key={s.id} data={s.data} />;
    case 'footer':     return <FooterSection key={s.id} data={s.data} org={org} />;
    default:           return null;
  }
})}
```

2. Each `*Section` component is a separate function in the same file (or extract to `_sections/`), and **its body is the literal JSX-converted prototype markup** for that section.
3. Keep `<nav>` and the global count-up effect at the top level of the page.
4. **DO NOT change `GrowDonateSection`** — it works.

## 7. Verification — do these checks before you say done

1. Open both pages side-by-side at the same width:
    - tab A: `file:///<absolute-path>/apps/web/src/landingPageDesign/Amutot Landing - Live Prototype.html`
    - tab B: `http://localhost:3010/l/or-laam?preview=1`
2. Run this in DevTools console on both tabs and compare:
   ```js
   getComputedStyle(document.querySelector('.hero h1')).fontSize
   getComputedStyle(document.querySelector('.section.about')).paddingTop
   getComputedStyle(document.querySelector('.activities .card')).borderRadius
   ```
   These should be **identical** numbers.
3. Diff the two pages' rendered HTML:
   ```js
   document.querySelector('.lp-landing').outerHTML.length
   ```
   The character counts should be within 5% of each other (the difference is just the data values, not the structure).
4. Visual check at 1440px desktop AND 390px mobile, scrolling top to bottom. Anything that looks even slightly off (color, spacing, font weight, border-radius, shadow, animation timing) means you didn't copy verbatim. Go back and fix.

## 8. Seed data

If `or-laam` is missing data for any section, also extend the Prisma seed (`prisma/seed.ts` or wherever `or-laam` is defined) with the **exact copy from the prototype HTML for that section** so the demo page has full content. Then run `npx prisma migrate reset --force`.

## 9. Acceptance — Claude Code MUST tick all of these

- [ ] `apps/web/src/app/l/[slug]/landing.css` contains the prototype's `<style>` block verbatim, scoped under `.lp-landing`.
- [ ] All 13 sections render at `/l/or-laam?preview=1` in the order set by the admin.
- [ ] Every section uses the prototype's exact class names (no inventions).
- [ ] DevTools comparison from §7.2 returns identical values for at least 5 sample selectors.
- [ ] All animations in the prototype work in the React version: hero blobs float, marquee scrolls, hero stats count up, stats section counts up, reviews carousel auto-rotates, FAQ smooth open, cards lift on hover, prefers-reduced-motion kills all of it.
- [ ] No console errors. `npm run lint` passes. `npm run build` passes.
- [ ] No new dependencies in `package.json`.
- [ ] Side-by-side screenshot comparison saved to `docs/landing-page/screenshots/sidebyside-desktop.png` and `sidebyside-mobile.png`. They are visually indistinguishable except for any per-org content (logo, name).

## 10. If you find a real blocker

Stop and ask. Do not "best-effort" a section.

Real blockers (escalate):
- A CSS rule in the prototype uses a custom property that isn't declared anywhere.
- A section's JS logic in the prototype references a class that doesn't exist in the markup.
- The seed shape conflicts with the prototype's HTML in a way that can't be reconciled.

Not blockers (just do them):
- "This CSS is verbose" — copy it anyway.
- "This animation feels janky" — copy it anyway.
- "I could simplify this with Tailwind" — no.

Now go. Start with §3 (copy the `<style>` block), then walk top-to-bottom through the line ranges. Don't skip ahead.
