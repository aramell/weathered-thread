---
title: 'Shop Garment Browsing (Story 3.1)'
type: 'feature'
created: '2026-09-21'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 3.1's Shop flow (SHOP → garment types → colors → Product surface with no motif) already ships, but from `lib/placeholder-shop-data.ts` (4 garment types, 4 colorways, a flat `inStock`). The story requires the colors to come from real synced inventory, and no page reads the catalog yet.

**Approach:** Decided 2026-09-21: close Story 3.1 on the shipped placeholder-backed pages and build nothing. The Shop keeps `lib/placeholder-shop-data.ts` for garment types, colors and stock. The "real synced inventory" requirement stays unmet and is recorded as blocked on OAuth per-variation inventory (the deferred `getListingInventory` sync entry).

## Boundaries & Constraints

**Always:** Story 3.1's three ACs keep holding: `/shop` lists garment-type `product-card`s, `/shop/[type]` lists that type's colors, and `/shop/[type]/[color]` opens `ProductPickerShell` with the garment seeded and no motif chosen. Prices go through `formatPrice()` as integer cents. Unavailable colors show disabled, never hidden.

**Never:** Change `scripts/sync-etsy.ts`, add OAuth or any runtime Etsy call, or reference `ETSY_API_KEY` outside the sync. Never import `lib/catalog.ts` or `content/catalog/registry.ts` from a Client Component, or pass a catalog entry or its `url` as a prop to one (NFR8). Never edit `content/catalog/{slug}/synced.ts`.

</frozen-after-approval>

## Code Map

- `app/(site)/shop/page.tsx`, `app/(site)/shop/[type]/page.tsx`, `app/(site)/shop/[type]/[color]/page.tsx` -- the shipped Shop flow; all read `lib/placeholder-shop-data.ts` (`garmentTypes`, `colorways`, `getGarmentType`, `getColorway`).
- `app/(site)/page.tsx:7` -- homepage Shop grid reads the same `garmentTypes`; it moves with any migration.
- `components/product-picker-shell.tsx` -- Client Component; imports `placeholder-shop-data` (`sizes`, `colorways`, `garmentTypes`) and `placeholder-motif-data` directly. Any catalog-backed data reaches it as url-free props.
- `components/product-card.tsx` -- presentational `name`/`price`/`image`; reuse as is.
- `lib/catalog.ts` (`getListings`, `getListing`, `getListingsByCollection`), `content/catalog/{types,registry}.ts` -- server-only read layer from Stories 2.3/2.4. `CatalogEntry` includes the Etsy `url`.
- `lib/format-price.ts` -- the one price formatter.
- `_bmad-output/implementation-artifacts/deferred-work.md` -- entries on per-variation OAuth sync and a url-free catalog entry shape before any Client Component consumes catalog data.

## Implementation Notes

- Investigation found the Shop flow (`/shop`, `/shop/[type]`, `/shop/[type]/[color]`) already built in commits 155abb2, 7eaa6ec and 82b09f1 on placeholder data, before the Etsy pivot. Its three ACs hold structurally.
- Synced data is listing-level only, and `content/catalog/listings.json` and `registry.ts` are empty, so no page can read real garment-style or color inventory. The owner chose to close 3.1 on placeholders rather than approximate stock from listing-level `quantity` (option B) or build the OAuth sync first (option C).
- No code changed. Follow-up: deferred-work.md entry linking 3.1 to the per-variation OAuth sync.
