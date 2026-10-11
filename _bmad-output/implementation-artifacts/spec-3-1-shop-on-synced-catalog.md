---
title: 'Shop Pages on the Synced Catalog (Story 3.1 follow-up)'
type: 'feature'
created: '2026-10-11'
status: 'done'
baseline_commit: 'e4bbe690514a56159c1fd4adae7c99058dbdecd2'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `/shop`, `/shop/[type]`, `/shop/[type]/[color]`, the homepage Shop grid and `ProductPickerShell` still read `lib/placeholder-shop-data.ts` (4 invented garment types, a "bay"/XL taxonomy, flat prices and stock), though `content/catalog` now holds real per-variation Etsy inventory (Style x Primary color x Size, `priceCents`, `quantity`). Story 3.1's "colors from real synced inventory" AC is unmet.

**Approach:** Add a server-only shop model built from the catalog's `variations` and pass its url-free, serializable form to the picker as a prop. Styles, colors, sizes, prices and stock all come from Etsy; only presentation (swatch hex, photo, garment blurb) stays authored. Motifs stay on `lib/placeholder-motif-data.ts`.

## Boundaries & Constraints

**Always:**
- Garment types = distinct `Style` values, colors = `Primary color`, sizes = `Size`, across `active` listings that have variations. A (style, color, size) combination is in stock when any listing has `quantity > 0` for it; its price is the lowest in-stock `priceCents`, or `null` when out of stock (a disabled offering's price is meaningless and is never shown).
- A style card, color card and the picker price show the lowest in-stock price through `formatPrice()`; the picker shows the chosen size's price once a size is picked. A color with no in-stock size is out of stock; a size with no stock is disabled. Disabled, never hidden.
- Slugs are the lowercased, hyphenated Etsy names (`Blue Jean` -> `blue-jean`). Style order is Etsy's first-appearance order; colors follow the authored presentation order, then Etsy order.
- A variation missing `Style`, `Primary color` or `Size` fails the build with a message naming the listing; a listing with no variations is skipped.
- Routes keep working with `generateStaticParams`; unknown style or color slugs `notFound()`.

**Never:**
- Import `lib/catalog.ts`, `content/catalog/registry.ts` or the shop module from a Client Component, or pass an entry, the Etsy `url` or a `listingId` as a prop (NFR8). Only the url-free shop model crosses to the client.
- Change `scripts/`, `content/catalog/**` or the sync; add runtime Etsy calls.
- Swap motifs onto the catalog, build the checkout handoff (Epic 4) or search (3.5).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path | Logo listing, 48 variations | 4 styles, 4 colors each, sizes S/M/L, real prices | N/A |
| Color out of stock | Bay on Long Sleeve (all `quantity` 0) | Swatch/card disabled with out-of-stock text, no price | N/A |
| Mixed listings | Two listings, same combo | In stock if either has stock; lowest in-stock price | N/A |
| Inactive/no variations | `state` not `active`, or `variations: []` | Excluded from the model | N/A |
| Malformed variation | Missing `Size` option | Build fails naming the listing | Throw |
| Unknown slug | `/shop/nope`, `/shop/heavyweight-tee/nope` | 404 | `notFound()` |
| Color change | Chosen size is out of stock in the new color | Size cleared, prompt shown, Add to Bag disabled | N/A |

</frozen-after-approval>

## Code Map

- `lib/catalog.ts` -- server-only read layer; `getListings()` is the model's only input.
- `lib/placeholder-shop-data.ts` -- source of presentation to carry over: swatch hex, `/images/garments/{color}-front.jpg` photos, garment blurbs. Delete it afterwards.
- `app/(site)/shop/page.tsx`, `shop/[type]/page.tsx`, `shop/[type]/[color]/page.tsx`, `app/(site)/page.tsx` -- Server Components to move onto the model.
- `app/(site)/collections/[slug]/[motif]/page.tsx` -- second `ProductPickerShell` caller; must pass the model.
- `components/product-picker-shell.tsx` -- consumes `garmentTypes`/`colorways`/`sizes`; take the model as a prop and derive stock from it.
- `components/garment-swatch.tsx`, `product-card.tsx` -- unchanged.
- `lib/catalog.test.ts`, `package.json` `test:catalog` -- test pattern (`tsx --conditions react-server`) for the new module's tests.
- `lib/format-price.ts` -- reuse as is.

## Tasks & Acceptance

**Execution:**
- [x] `lib/shop.ts` -- server-only `buildShop(listings)` (pure) and `getShop()`; types for the serializable `Shop`/`ShopGarmentType`/`ShopColor`/`ShopSize`, with no url or listing id -- the one model for every shop surface
- [x] `lib/shop-presentation.ts` -- authored swatch hex, photo and blurb per slug, with a neutral fallback for an unknown color or style -- Etsy does not supply them
- [x] `lib/shop.test.ts` -- cover the I/O matrix; add to `test:catalog` -- verifies aggregation and failure rows
- [x] `app/(site)/shop/**`, `app/(site)/page.tsx` -- read `getShop()`, render real names, prices and disabled out-of-stock colors -- the swap
- [x] `components/product-picker-shell.tsx`, `collections/[slug]/[motif]/page.tsx` -- take `shop` as a prop; size and color availability from it; clear an unavailable size -- keep one client island
- [x] `lib/placeholder-shop-data.ts` -- delete once unreferenced; update `deferred-work.md` -- closes the 3.1 entry

**Acceptance Criteria:**
- Given the synced logo listing, when a visitor opens `/shop`, then four real styles appear with lowest in-stock prices, and `/shop/long-sleeve-tee` shows Bay disabled with no price.
- Given `/shop/heavyweight-tee/ivory`, when a size is chosen and a motif picked, then Add to Bag enables; given Bay on a style with no stock, it stays disabled with the out-of-stock prompt.
- Given the built client bundles, then no Etsy `url` or listing id appears in them.

## Implementation Notes

- Helpers `getGarmentType`/`getColor` live in `lib/shop-types.ts` (client-safe) so the picker can look up without importing the server-only module.
- Cards with no in-stock price show "Sold out". Size buttons now carry `disabled` and an out-of-stock `aria-label`; the size section shows only once a color is chosen.
- Verified: `tsc`, lint, `test:catalog` (54), `test:sync` (25), `npm run build` (27 pages) pass; no `etsy.com/listing` or listing id in `.next/static` or prerendered HTML.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Picker derivation (size, price, Add to Bag) has no executing test | medium | patch | Extracted `derivePicker` into `lib/shop-types.ts`; 5 new tests in `lib/shop.test.ts` |
| Unknown-slug lookups untested | medium | patch | Lookup tests added (unknown, scoped color, stale color) |
| Out-of-stock color card on `/shop/[type]` still a link | medium | patch | Now a non-link `aria-disabled` card; built HTML has no `/bay` link |
| Size state not cleared on color/garment change | low | patch | Cleared in both handlers; `derivePicker` also ignores a stale size |
| Two-color description reads "A, and B" | low | patch | `colorNames` handles fewer than 3 names |
| Shared garment photos across styles | low | defer | Pre-existing (placeholder photography); logged in deferred-work |
| Slug collisions / untrimmed / non-ASCII option values | low | reject | Etsy normalizes values; real data has none; a guard adds complexity |
| Empty shop (no active listings) | low | reject | Not reachable with a synced catalog; build would fail loudly |
| Old `/shop/crewneck-sweatshirt` URLs 404 | false | reject | Pre-launch placeholder routes; nothing links or indexes them |
| Crewneck blurb keyed to a guessed slug | false | reject | Synced style is "Heavyweight Crewneck" -> `heavyweight-crewneck`; matches |
| Stale color slug on garment switch | low | reject | Shows "Choose a color for this piece."; sensible, all styles share colors today |
| Size section hidden until a color is chosen | low | reject | Sizes depend on color stock; intended |
| Extra variation options ignored | low | reject | Not present in synced data; speculative |
| `getShop()` rebuilt per call / stock frozen at build | false | reject | Build-time static by design; staleness already noted for the sync |
| Null `frontImage` shows generic preview text | low | reject | Only for colors outside `shop-presentation.ts`; unlikely |

## Design Notes

The model is the NFR8 boundary: the listing is read on the server and only names, slugs, cents and booleans cross to the client. Presentation lives apart from the model because Etsy supplies no hex, photo or copy.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no errors
- `npm run lint` -- expected: no new errors
- `npm run test:catalog && npm run test:sync` -- expected: all pass
- `npm run build` -- expected: succeeds, prerendering every `/shop/*` route
- `grep -rl "etsy.com/listing\|4590111844" .next/static` -- expected: no matches

**Manual checks (if no CLI):**
- Run the dev server; click through `/shop` to a color page and confirm Bay shows disabled on Long Sleeve Tee.
