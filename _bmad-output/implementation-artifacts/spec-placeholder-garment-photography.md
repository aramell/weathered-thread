---
title: 'Shop Garment Browsing with Placeholder Photography (Epic 3 Story 3.1)'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '49647b3f393bd063c5976a92715c83f3192eae2d'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The homepage Shop grid's 4 garment-type cards are dead-end flat color blocks — tapping one goes nowhere, and Epic 3 Story 3.1's browse-by-color flow can't use real data because Epic 2's Squarespace sync isn't configured yet.

**Approach:** Build the Story 3.1 navigation flow (Shop → garment type → color list → a minimal Product-surface landing) using the user's 4 practice colorway photos (Pepper, Ivory, Blue Jean, Bay) as placeholder inventory, kept structurally separate from Epic 2's real `content/catalog/` pipeline so nothing here needs to be unwound when real sync lands.

## Boundaries & Constraints

**Always:**
- Keep all placeholder data and images outside `content/catalog/` (e.g. `lib/placeholder-shop-data.ts`, `public/images/garments/`) so Epic 2's real sync is never confused with this stand-in data.
- Apply the same 4 colorways (Pepper, Ivory, Blue Jean, Bay) to every garment type, all reusing the same 4 front photos — there's no real per-type photography or inventory yet.
- Leave the homepage Shop grid's existing type cards visually as-is (flat blocks); only the new `/shop/[type]` color cards get real images.

**Never:**
- Never write into `content/catalog/{sku}/` or mimic its `synced.ts`/`authored.ts` shape.
- Never build Story 3.3's full Product Picker (swatch interactivity, sticky Add-to-Bag bar, motif selection, size selection). The `/shop/[type]/[color]` page is a minimal landing stub showing only the garment-first "no motif selected" empty state.
- Never wire the back-view photos into any UI — copy them into `public/images/garments/` unused.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid type + color | `/shop/heavyweight-tee/pepper` | Renders Pepper front photo, "Heavyweight Tee — Pepper", price, "Choose a design for this piece.", disabled Add to Bag, "Back to Shop" link to `/shop/heavyweight-tee` | N/A |
| Unknown type slug | `/shop/bogus-type` | 404 via `notFound()` | N/A |
| Unknown color slug under valid type | `/shop/heavyweight-tee/bogus-color` | 404 via `notFound()` | N/A |

</frozen-after-approval>

## Code Map

- `components/product-card.tsx` -- add optional `image?: string` prop; render `next/image` (fill) in place of the flat block when present, else keep current flat block unchanged.
- `app/(site)/page.tsx:6-11,50-59` -- `shopItems` array and Shop grid section; source garment types from new `lib/placeholder-shop-data.ts` instead of the local array, wrap each `ProductCard` in a `Link` to `/shop/{type.slug}`.
- `components/button-primary.tsx` -- style/structure reference for the new `button-secondary.tsx`.
- `_bmad-output/planning-artifacts/ux-designs/ux-weathered-thread-2026-09-14/DESIGN.md:79-83,164` (button-secondary tokens: transparent, Wet Ink border/text, `label-mono`, `rounded.sm`) -- source of truth for the new component's styling.
- Source photos: `/Users/andrewramell/Downloads/Weathered_Thread_Photo_Practice_Set_With_Backs (1)/*.jpg` -- copy into `public/images/garments/` as `{color}-front.jpg` / `{color}-back.jpg`.
- `app/(site)/collections/[slug]/page.tsx` -- pattern reference for `notFound()` + `generateStaticParams` on a dynamic slug route.

## Tasks & Acceptance

**Execution:**
- [x] Copy all 8 photos from the Downloads practice set into `public/images/garments/` as `pepper-front.jpg`, `pepper-back.jpg`, `ivory-front.jpg`, `ivory-back.jpg`, `blue-jean-front.jpg`, `blue-jean-back.jpg`, `bay-front.jpg`, `bay-back.jpg` -- makes the assets available to the app; back photos stay unused per Boundaries.
- [x] `lib/placeholder-shop-data.ts` -- new file exporting `garmentTypes` (slug/name/price for the 4 existing items: crewneck-sweatshirt, heavyweight-tee, lightweight-crewneck, long-sleeve-tee) and `colorways` (slug/name/frontImage for pepper/ivory/blue-jean/bay) -- single source of placeholder data for both new routes and the homepage.
- [x] `components/product-card.tsx` -- add optional `image` prop per Code Map -- lets one component serve both the flat-block (types) and real-photo (colors) cases.
- [x] `components/button-secondary.tsx` -- new component per DESIGN.md tokens -- needed for the stub's "Back to Shop" action.
- [x] `app/(site)/page.tsx` -- switch `shopItems` to `garmentTypes` from the new data module, wrap each card in `Link href="/shop/{slug}"` -- makes the existing grid navigable.
- [x] `app/(site)/shop/[type]/page.tsx` -- new page: `notFound()` on unknown slug; render type name heading and a grid of `ProductCard` (one per colorway, with image) each linking to `/shop/{type}/{color}`; `generateStaticParams` over `garmentTypes` -- Story 3.1 AC2.
- [x] `app/(site)/shop/[type]/[color]/page.tsx` -- new page: `notFound()` on unknown type or color; render colorway front photo, "{type} — {color}" heading, price, "Choose a design for this piece.", disabled Add to Bag button, `ButtonSecondary` back link to `/shop/{type}`; `generateStaticParams` over the full type×color cartesian product -- Story 3.1 AC3.

**Acceptance Criteria:**
- Given a visitor on the homepage, when they tap a Shop grid card, then they land on `/shop/{type-slug}` showing that type's name and 4 colorway cards with real placeholder photos.
- Given a visitor on a Garment Type List page, when they tap a colorway card, then they land on `/shop/{type}/{color}` showing that garment+color selected, price, "Choose a design for this piece.", and a disabled Add to Bag button.
- Given any unknown type or color slug in the URL, when the page renders, then Next.js returns a 404 rather than a broken/empty page.

## Implementation Notes

## Spec Change Log

## Review Triage Log

- **`app/(site)/shop/[type]/[color]/page.tsx` product photo missing `priority`** — verdict `medium`. It's the largest, first content block on the page and almost certainly the LCP element; without `priority`, Next.js lazy-loads it, hurting LCP for every visitor. Route: `patch`.
- **`app/(site)/shop/[type]/page.tsx` has no back-navigation link** — verdict `low`. Its sibling `[color]` page has a `ButtonSecondary` "Back to Shop" link; this page has none, an inconsistent affordance (browser back still works). Route: `patch`.
- **`lib/placeholder-shop-data.ts` `colorways` array formatting inconsistency** — verdict `low`. `blue-jean` is wrapped multi-line while the other three identically-shaped entries are single-line; cosmetic only. Route: `patch`.
- **`generateMetadata` on both new pages omits `description`** — verdict `low`. The sibling `app/(site)/collections/[slug]/page.tsx:60-63` sets both `title` and `description`; the new routes regress on that established pattern (SEO/social-preview only, no user-facing breakage). Route: `patch`.
- **Homepage Shop grid missing `role="list"`/`aria-labelledby`/`role="listitem"`** — verdict `low` (verification-gap missing-adoption finding, filed pre-verified; disposition `patch`). `app/(site)/page.tsx:47-53`'s now-navigable grid doesn't carry the same list semantics its own sibling `app/(site)/shop/[type]/page.tsx:45-61` and the pre-existing `app/(site)/collections/[slug]/page.tsx` motifs grid use for an identical pattern. Route: `patch`.
- **Site nav "Shop" link (`/shop`) 404s** — verdict `low`. Confirmed via `git show` on the baseline commit: `components/nav-header.tsx`'s `navLinks` already pointed to `/shop` before this change, and no `app/(site)/shop/page.tsx` existed at baseline or exists now. Pre-existing, not caused by this story. Route: `defer`.
- **Back-view photos committed unreferenced (~4.6MB)** — verdict `false`. Raised independently by blind-hunter and verification-gap's Other findings; both are the same root cause. Refuted by the spec's own frozen Boundaries ("Never wire the back-view photos into any UI — copy them into `public/images/garments/` unused") and the human's explicit decision earlier in this build to copy them in unused for a future feature. Working as specified, not a defect.
- **All 8 placeholder photos are large, unresized originals (~9.6MB total)** — verdict `low`, rejected. `next/image` (used throughout) auto-optimizes served bytes regardless of source size, so there's no user-facing performance defect — only larger repo/clone size. Fix would mean an image-processing pass on photos explicitly labeled temporary practice/placeholder content; low likelihood of real-world impact and more than a direct correction. Rejected.
- **Colorway card alt text on `/shop/[type]` lacks garment-type context** — verdict `low`, rejected. `ProductCard`'s `alt` is tied to its `name` prop (the color name, correctly shown as the visible label); composing full context would require adding a new prop to the component's public surface. Low real-world impact (alt is still a real, non-misleading color name) and fix is more than a direct correction. Rejected.
- **No fallback UI if a placeholder image fails to load** (`components/product-card.tsx`, `app/(site)/shop/[type]/[color]/page.tsx`) — verdict `low`, rejected. Both edge-case-hunter findings share this root cause. These are locally bundled static assets served by the app's own build output, not network-dependent fetches, so the failure mode is very unlikely in practice; a real fix would require an `onError` handler, which needs converting a Server Component to a Client Component — more than a direct correction for a placeholder-content edge case. Rejected.

## Design Notes

This stub intentionally implements only Story 3.3's garment-first "no motif selected" empty state (image, name/price, disabled Add to Bag, "Choose a design for this piece."). Everything else in Story 3.3 — swatch interactivity, sticky Add-to-Bag bar, size selection, motif gallery, accessibility content sequence — is out of scope and will replace this stub when that story is built.

## Verification

**Commands:**
- `npm run build` -- expected: succeeds with no type errors, all `/shop/*` static params generate cleanly.
- `npm run lint` -- expected: no new errors.

**Manual checks (if no CLI):**
- `npm run dev`, visit `/`, confirm each Shop card links to `/shop/{slug}` and renders that type's 4 colorway photos.
- Visit `/shop/heavyweight-tee/pepper`, confirm the Pepper front photo, copy, and disabled Add to Bag render; confirm "Back to Shop" returns to `/shop/heavyweight-tee`.
- Visit `/shop/nonsense` and `/shop/heavyweight-tee/nonsense`, confirm both 404.
