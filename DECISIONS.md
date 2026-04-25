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
