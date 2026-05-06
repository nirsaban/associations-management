
## 2026-05-06: Social Share Image — Client-Side html2canvas

**Decision:** Use `html2canvas` (client-side) for generating the shareable achievement image when a weekly distributor completes all deliveries.

**Why not server-side (@vercel/og):**
- No Vercel deployment — app runs on a self-hosted VPS with Docker
- html2canvas is simpler, no server infrastructure needed
- Image is generated on-demand when user clicks "שתפו את ההישג"

**Flow:**
1. Distributor marks all families as delivered
2. Success banner shows "שתפו את ההישג" button
3. Click opens modal with rendered card (org logo, name, family count, CTA)
4. User can share (native share API), download PNG, or copy referral link
5. Referral link includes the user's affiliate code for click attribution
