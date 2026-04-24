# DECISIONS.md — Organization Profile + Landing Page Builder

## Integration Points Found

### Existing Organization Model
The `Organization` model already has: name, slug, contactPhone, contactEmail, address, logoUrl, description, paymentLink, paymentDescription, social URLs (facebook, instagram, whatsapp, website), settings JSON, status enum. New fields (legalName, taxId, city, postalCode, country, primaryColor, accentColor, aboutShort, aboutLong) will be added as columns to this existing table via migration.

### Auth Pattern
All admin endpoints use `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('ADMIN')` + `@CurrentUser()` decorator. The `CurrentUser` interface provides `{ id, sub, phone, organizationId, platformRole?, systemRole }`. SUPER_ADMIN bypasses RolesGuard automatically.

### Tenant Isolation
Prisma middleware in `PrismaService` auto-injects `organizationId` into queries for models listed in `TENANT_SCOPED_MODELS`. Organization model itself is in `NON_TENANT_MODELS`. New tenant-scoped models (Asset, LandingPage, LandingPageSection, Review, LandingLead) need to be added to `TENANT_SCOPED_MODELS`.

### Frontend Stack
Next.js 14 App Router, Zustand for auth state, TanStack React Query, Axios API client, React Hook Form + Zod, Lucide icons, Tailwind CSS only (no component libraries). RTL Hebrew throughout.

### Dashboard Layout
Sidebar navigation is defined in `apps/web/src/app/(dashboard)/layout.tsx` with role-based nav arrays. Admin nav needs new entries for "פרופיל עמותה" and "דף נחיתה".

---

## Key Decisions

### D1: No Grow/Affiliate system exists
The spec references "existing Grow + Affiliate system" and "existing affiliate_links + /r/:slug redirect flow" — **these do not exist in the codebase**. The only payment-related field is `Organization.paymentLink` (a plain URL). Decision: payment CTAs on the landing page will link directly to the org's `paymentLink` URL. The `default_payment_link_id` FK on Organization will instead be a simple `defaultPaymentLink` text field (URL), consistent with the existing `paymentLink` field. `cta_payment` sections will reference this URL. No `/r/:slug` redirect flow will be invented.

### D2: File upload strategy — local disk for dev, configurable for prod
The codebase has no file upload infrastructure. Decision: add multer for multipart uploads, store files in a local `uploads/` directory (served statically by NestJS), with the path configurable via `UPLOAD_DIR` env var. The Asset model stores the URL, not the file path. For production, the operator would use a reverse proxy or S3-compatible storage; we add `UPLOAD_DIR` to `.env.example`. This keeps the implementation simple and avoids adding AWS SDK as a dependency.

### D3: Logo stored as Asset, not just URL
The existing `logoUrl` field is a plain URL. We'll add a proper `Asset` model and `logo_asset_id` FK, but keep `logoUrl` populated for backward compatibility with the existing onboarding flow and any code that reads it.

### D4: Landing page sections — no `organizationId` on sections
`LandingPageSection` belongs to `LandingPage` (which has `orgId`). Sections don't need their own `organizationId` — they're always accessed through their parent landing page. Same for the section-level data. However, `Review` and `LandingLead` DO need `organizationId` for tenant isolation.

### D5: Rich text sanitization
For `aboutLong` and rich text fields in sections: we'll use a simple server-side sanitizer (strip dangerous tags/attributes) on write. On the frontend, we'll render with `dangerouslySetInnerHTML` after sanitization. No DOMPurify added to the frontend since content is sanitized on save.

### D6: Drag-and-drop library
No drag library exists in the repo. We'll add `@dnd-kit/core` + `@dnd-kit/sortable` for the section reorder UI, as the spec recommends dnd-kit for React.

### D7: Framer Motion for animations
We'll add `framer-motion` for the public landing page scroll animations, as the spec recommends.

### D8: Themes as CSS variable sets
The 4 themes (warm, modern, minimal, bold) will be implemented as CSS variable maps applied to the landing page root element. The org's `primaryColor` and `accentColor` override theme defaults via inline CSS custom properties.

### D9: Public landing page route
The public landing page at `/l/:slug` is placed OUTSIDE the `(dashboard)` layout group — it has no auth chrome, no sidebar, and uses its own minimal layout. It's a server-rendered page (or at least SSR-capable) for SEO.

### D10: Reviews and Leads — new models with tenant scope
`Review` and `LandingLead` will have `organizationId` and be added to `TENANT_SCOPED_MODELS`. The public submission endpoints won't use JWT auth (they're public) but will set `organizationId` explicitly by looking up the org from the landing page slug.

### D11: View count tracking
Simple: increment `view_count` via a `POST /api/public/landing/:slug/track` endpoint, debounced by a `_lp_viewed` cookie per slug (24h expiry). No session table needed.

### D12: Image processing — skip auto-resize for v1
The spec asks for server-side auto-resize to max 512px. Adding sharp as a dependency would be heavyweight. Decision: validate file size (2MB max) and MIME type server-side, but skip the resize for v1. Document in follow-ups.

### D13: EXIF stripping — skip for v1
Would require sharp or similar. Documented as follow-up.

### D14: Honeypot field on reviews
Add a hidden `website` field to the review submission form. If filled, silently reject the submission (bot trap).

### D15: Rate limiting
Use NestJS Throttler for public endpoints. Reviews: 5/min per IP. Leads: 5/min per IP. View tracking: 60/min per IP.

### D16: Framer Motion — animation system
All landing page section components use `framer-motion` for scroll-triggered entrance animations. Motion language follows the inline design system spec:
- Entrance: 24px Y-offset + opacity 0→1, 600ms, easing [0.22, 1, 0.36, 1] (easeOutExpo)
- Stagger: 70ms between children
- Card hover: scale(1.02) in 150ms
- CTA press: scale(0.98), no bounce
- `prefers-reduced-motion` honored globally via `<MotionConfig reducedMotion="user">` — Framer Motion's built-in support disables all animations when the user prefers reduced motion.

### D17: UI UX Pro Max skill — not available
The skill was not found at any path in the repo or env. Fell back to the inline design system spec for all design decisions. All design choices come from the inline spec, not the skill.

### D18: 21st.dev — not initialized
21st.dev requires interactive CLI setup and an API key. Since we're working autonomously without interactive prompts, we hand-rolled all section components following the inline design system spec. The components use the same patterns that 21st.dev components follow (CSS variable tokens, fluid typography, layered shadows). This is documented as a follow-up: initialize 21st.dev and optionally swap in marketplace components for hero, reviews, and CTA sections.

### D19: Design system — CSS custom properties
All typography, spacing, radii, and shadow values come from CSS custom properties defined in `themes.ts`. No hard-coded hex values, pixel sizes, or font stacks inside section components. Four themes (warm/modern/minimal/bold) each define the full token set. The org's `primaryColor` and `accentColor` are injected as `--lp-primary` and `--lp-accent` overrides.

### D20: Hebrew RTL typography
Using Heebo as the heading/body font (RTL-friendly, loaded via the app's font setup). Fluid sizes via `clamp()` per the spec. Direction set via `dir="rtl"` on the root element.
