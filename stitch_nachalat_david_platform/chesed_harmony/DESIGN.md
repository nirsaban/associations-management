# Design System Document: High-End Community Editorial

## 1. Overview & Creative North Star: "The Digital Sanctuary"
The design system is built upon the Creative North Star of **"The Digital Sanctuary."** In the context of a community-assistance platform, the UI must transcend basic utility. It should feel like a dignified, calm, and highly organized space that respects the user’s time and emotional state. 

We break the "template" look by moving away from rigid grids and boxy containment. Instead, we use **Intentional Asymmetry** and **Tonal Layering**. By utilizing wide margins, varying header scales, and overlapping elements, we create an editorial experience that feels premium and bespoke. This system prioritizes the Hebrew script (RTL) as a rhythmic design element rather than just translated text.

---

## 2. Colors: Depth over Definition
Our palette is rooted in a deep, authoritative teal and a grounding sage. We do not use color simply to decorate; we use it to build a physical sense of space.

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off content. Traditional "dividers" are forbidden. Boundaries must be defined solely through background color shifts or whitespace. 
*   *Example:* Place a `surface-container-low` section against a `surface` background to define a sidebar or header area.

### Surface Hierarchy & Nesting
Treat the UI as a series of stacked, fine paper sheets. 
*   **Base:** `surface` (#f8fafa)
*   **Nesting Level 1:** `surface-container-low` (#f2f4f4) for secondary content areas.
*   **Nesting Level 2 (The Interactive Layer):** `surface-container-lowest` (#ffffff) for primary cards and input areas.
*   **Highest Elevation:** `surface-container-highest` (#e1e3e3) for elements requiring immediate focus.

### The "Glass & Gradient" Rule
To elevate the PWA experience, use **Glassmorphism** for floating elements (like mobile bottom navs or desktop tooltips). Use `surface` colors at 80% opacity with a `backdrop-blur` of 12px.
*   **Signature Textures:** For Primary CTAs, use a subtle linear gradient: `primary` (#004650) to `primary-container` (#135f6b) at a 135-degree angle. This adds "soul" and depth to the action.

---

## 3. Typography: Editorial Authority
We utilize two distinct families to create a sophisticated hierarchy that excels in Hebrew RTL.

*   **Display & Headlines (Be Vietnam Pro):** Used for large, impactful numbers and page titles. Its geometric nature provides a modern, architectural feel.
*   **Title, Body & Labels (Plus Jakarta Sans):** Chosen for its exceptional legibility at small sizes and its friendly, open counters.

**The Hierarchy Logic:**
*   **Display-LG (3.5rem):** Use for dashboard "Hero" stats (e.g., total families assisted).
*   **Headline-MD (1.75rem):** Use for section headers.
*   **Body-LG (1rem):** The standard for all reading text. Ensure a line-height of 1.6 for maximum comfort in Hebrew.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often a sign of "out-of-the-box" design. We use **Ambient Light** principles.

*   **The Layering Principle:** Depth is achieved by "stacking" surface tiers. A `surface-container-lowest` card sitting on a `surface-container-low` background creates a natural lift.
*   **Ambient Shadows:** If a floating effect is required (e.g., a Modal), use a custom shadow: `0px 12px 32px rgba(25, 28, 29, 0.06)`. The shadow color is a tinted version of `on-surface` (#191c1d), never pure black.
*   **The "Ghost Border" Fallback:** If a container needs more definition (e.g., in high-glare environments), use the `outline-variant` (#bec8c9) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons: The Tactile Primary
*   **Primary:** Large (min-height 56px), utilizing the signature gradient (`primary` to `primary-container`). Roundedness: `md` (0.75rem).
*   **Secondary:** `secondary-container` (#c6edc3) text on `on-secondary-container`. No background, or a subtle `surface-container-high` hover state.
*   **Ghost:** Use `on-surface` text with 0% background, shifting to 5% `on-surface` on hover.

### Cards: The Floating Content
*   **Style:** No borders. Use `surface-container-lowest` for the card background.
*   **Spacing:** Use `xl` (1.5rem) internal padding to give information "room to breathe."
*   **Grouping:** Forbid divider lines. Use 24px of vertical white space to separate family info blocks.

### Forms: The Respectful Input
*   **Input Fields:** `surface-container-low` background with a bottom-only `outline` of 2px. This creates an "editorial" underline look rather than a boxy "form" look.
*   **States:** Error states use `error` (#ba1a1a) for text and a subtle `error-container` (#ffdad6) for the input background.

### Tables: The Data Canvas
*   **Admin Tables:** No vertical or horizontal lines. Use alternating row colors: `surface` and `surface-container-low`. 
*   **Header:** `label-md` uppercase in `on-surface-variant` (#3f4949) for a professional, metadata-heavy feel.

### Navigation: The Glass Anchor
*   **Mobile Bottom Nav:** Use a Glassmorphic `surface` background with 16px blur. Active states should use a small `tertiary-fixed` (#ffddaf) dot below the icon, rather than changing the icon's color to a harsh blue.
*   **Desktop Sidebar:** Use `surface-container-low` with a slight "inset" feeling (achieved by a subtle inner-shadow).

---

## 6. Do's and Don'ts

### Do
*   **Do** lean into white space. If a layout feels "empty," increase the typography size rather than adding more boxes.
*   **Do** use `tertiary` (#563900) for "Warmth" accents—it provides a sophisticated amber glow that pairs beautifully with the deep teal.
*   **Do** ensure RTL alignment is perfect; icons should be flipped where appropriate to match the reading flow.

### Don't
*   **Don't** use pure black (#000000) for text. Always use `on-surface` (#191c1d) to maintain the "warm" brand feel.
*   **Don't** use standard Material Design elevation shadows. Stick to the Tonal Layering and Ambient Shadows defined in section 4.
*   **Don't** use sharp corners. Everything must follow the `md` (0.75rem) or `lg` (1rem) roundedness scale to feel "welcoming."

---

## 7. Signature Feedback States
*   **Toasts:** Floating `inverse-surface` capsules with `inverse-on-surface` text. Positioned at the top-center on mobile for thumb-reach accessibility.
*   **Empty States:** Use large, `headline-sm` typography with a 150x150px illustration in desaturated `outline-variant` tones. Never use high-contrast images for empty states.