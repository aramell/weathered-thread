---
title: 'Product Picker — Garment & Motif Selection With Live Preview (Epic 3 Story 3.3)'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'f271bb96a1674b6e7d439f14f37847136c2ca158'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Both entry stubs (`/shop/[type]/[color]` from Story 3.1, `/collections/[slug]/[motif]` from Story 3.2) are static dead ends — a disabled Add to Bag and no way to complete the missing garment or motif selection — so no visitor can ever assemble a full, purchasable combination.

**Approach:** Build one Client Component, `ProductPickerShell`, that owns all picker state (garment type, color, size, motif) and renders inline on both existing stub routes in place of their static bodies. Presentational `motif-tile`/`garment-swatch`/sticky-bar units read that state via props; the live preview, price, and Add to Bag validity all update from client state, never navigation.

## Boundaries & Constraints

**Always:**
- Exactly one Client Component (`ProductPickerShell`) owns selection state; `motif-tile`, `garment-swatch`, and the sticky Add-to-Bag bar stay presentational (props only), per epic Technical Decisions.
- Reuse `lib/placeholder-shop-data.ts` and `lib/placeholder-motif-data.ts` as the only data sources; never fork into or mimic `content/catalog/`.
- Price becomes an integer-cents field, rendered only through new `lib/format-price.ts`.
- Motif-first landing with no garment type yet shows an inline garment-type picker (reusing `product-card` styling) before color/size controls — settled from `EXPERIENCE.md` Flow 1's narrated sequence ("taps Crewneck Sweatshirt, then Blue Jean") since the AC's "complete the missing selection" can't otherwise be satisfied for that path.
- Out-of-stock is color-level only (Ivory, flat across garment types, matching `key-product.html`'s own example); sizes have no stock modeling yet and are always selectable.
- Sticky bar appears only once the primary Add to Bag button scrolls out of view (mobile), mirroring `nav-scroll-shell.tsx`'s client-boundary/scroll-effect shape but keyed off that button via `IntersectionObserver`.

**Never:**
- Never implement Add to Bag's submit/navigation — Checkout Handoff is Story 4.1; an enabled button here stays inert (no `href`, no handler).
- Never add real Squarespace calls, a `[sku]` canonical route, or per-size inventory — still gated on Epic 2 per `epic-3-context.md`.
- Never touch Story 3.4's fixed content sections (THE GARMENT/THE EMBROIDERY) — this story only replaces the picker + Add to Bag zone above them.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Garment-first, no motif | `/shop/crewneck-sweatshirt/pepper` loads | Type+color+size controls, motif gallery, "Choose a design for this piece.", Add to Bag disabled | N/A |
| Garment-first, motif chosen | Tap a `motif-tile` | Preview/price update to that combination; Add to Bag enables once size is set | N/A |
| Motif-first, no garment | `/collections/sea-isle/sic-water-tower` loads | Motif shown, inline garment-type picker, "Choose a garment for this piece.", Add to Bag disabled | N/A |
| Motif-first, fully selected | Tap type, then color, then size | Preview/price update to the full combination; Add to Bag enables | N/A |
| Out-of-stock color | Ivory swatch tapped | Swatch visible, disabled, out-of-stock microcopy; selection ignored | Add to Bag stays disabled if no valid combination exists |
| Mobile scroll | Add to Bag button leaves viewport | Sticky bar appears, mirrors the same enabled/disabled state and price | N/A |

</frozen-after-approval>

## Code Map

- `lib/placeholder-shop-data.ts` -- add `sizes: string[]` (S/M/L/XL, flat), `swatchColor`/`inStock` per colorway (Ivory `false`), migrate `price` to integer cents; update `shop/page.tsx` and `shop/[type]/page.tsx` call sites to `formatPrice()`.
- `lib/format-price.ts` -- new: single `formatPrice(cents: number): string`.
- `components/motif-tile.tsx` -- add optional `selected?: boolean` prop, render the Antique Brass border internally instead of callers wrapping their own.
- `components/motif-tile-link.tsx` -- pass `selected` through to `MotifTile` instead of its own border div; behavior unchanged.
- `components/garment-swatch.tsx` -- new presentational circular swatch (`rounded-full`, Line/Wet Ink border, disabled + microcopy variant), per `DESIGN.md`.
- `components/add-to-bag-bar.tsx` -- new presentational sticky bar (price, disabled state).
- `components/product-picker-shell.tsx` -- new Client Component; seeded with either `{garmentType, colorway}` or `{motif}`; owns all remaining selection state; renders preview block, type/color/size controls, motif gallery, Add to Bag, back link; mounts the sticky bar via `IntersectionObserver`.
- `app/(site)/shop/[type]/[color]/page.tsx` -- replace static stub body with `ProductPickerShell` seeded garment-first.
- `app/(site)/collections/[slug]/[motif]/page.tsx` -- replace static stub body with `ProductPickerShell` seeded motif-first.
- `components/button-primary.tsx` -- not reused for Add to Bag (`href`-only, can't be disabled); keep both stubs' existing raw `<button>` pattern.

## Tasks & Acceptance

**Execution:**
- [x] `lib/format-price.ts` -- add `formatPrice()` -- shared cents→display formatting
- [x] `lib/placeholder-shop-data.ts` -- add sizes/swatchColor/inStock, migrate price to cents -- picker's data source
- [x] `components/garment-swatch.tsx` -- new presentational swatch -- color selection unit
- [x] `components/add-to-bag-bar.tsx` -- new presentational sticky bar -- mobile persistent CTA
- [x] `components/motif-tile.tsx`, `components/motif-tile-link.tsx` -- add/forward `selected` prop -- shared border logic for picker's motif gallery
- [x] `components/product-picker-shell.tsx` -- new shell owning all picker state -- the picker itself
- [x] `app/(site)/shop/[type]/[color]/page.tsx` -- wire to shell, garment-first seed
- [x] `app/(site)/collections/[slug]/[motif]/page.tsx` -- wire to shell, motif-first seed
- [x] `app/(site)/shop/page.tsx`, `app/(site)/shop/[type]/page.tsx` -- switch to `formatPrice()`

**Acceptance Criteria:**
- Given garment-first landing, when a motif is picked from the inline gallery, then preview/price reflect that combination and Add to Bag enables once size is set.
- Given motif-first landing, when type, then color, then size are picked, then preview/price reflect the full combination and Add to Bag enables.
- Given a color with no confirmed inventory, when the picker renders, then its swatch is visible, disabled, carries out-of-stock microcopy, and can never form part of an enabled Add to Bag state.
- Given mobile viewport, when the Add to Bag button scrolls out of view, then the sticky bar appears showing the same price and enabled/disabled state.
- Given either entry path, when the picker renders, then a `button-secondary` back link (matching Shop vs Collection origin) always accompanies Add to Bag, never standing alone.

## Implementation Notes

- `ProductPickerShell`'s garment-type picker and motif gallery are both always rendered (not hidden once set) so a visitor can revise either choice from the same surface afterward; this doubles as `EXPERIENCE.md`'s "Product motif switcher" use of `motif-tile`, which the AC list implies but doesn't name outright.
- The on-garment preview reuses the colorway's real `frontImage` (once a color is picked) plus a text caption naming the motif+garment combination, rather than a flat Sailcloth block — real garment photography already exists per-color from Story 3.1, so this is a closer approximation than an empty placeholder while still labeled "placeholder mockup, real photography pending."
- Also updated `app/(site)/page.tsx` (homepage) to call `formatPrice()` — not listed in the Code Map, but required by the same `garmentTypes.price` cents migration (otherwise a type error and a raw-cents homepage price).
- Verified via `npx tsc --noEmit`, `npm run lint`, `npm run build` (all pass, all 27 routes prerender), and live Chrome DevTools clicks through both entry flows, the out-of-stock swatch (including a direct `/shop/crewneck-sweatshirt/ivory` URL-seeded case), the sticky bar at mobile/desktop widths, and back-link presence. No console errors.
- Matrix Test Audit: no row has an automated covering test — this repo has no test framework at all (pre-existing, project-wide; every prior Epic 1/3 spec logs the same gap as `defer`, e.g. `spec-3-2-motif-selection-on-collection-story.md`). Not introduced by this story; verification instead relied on `tsc`/`lint`/`build` plus the live manual pass above, covering every matrix row.

## Spec Change Log

## Review Triage Log

- **`ProductPickerShell`'s preview placeholder always reads "Select a garment to preview this design.", even once a garment type is already chosen and only color is missing** — verdict `low`. Confirmed at `components/product-picker-shell.tsx:108-127`: the ternary only branches on `colorway`, never on `garmentType`, so a motif-first visitor who has just picked a garment type sees stale/misleading copy until they also pick a color. Every motif-first visitor passes through this state, so kept despite the low severity. Route: `patch`.
- **No on-page prompt exists for "choose a color" or "choose a size" (unlike the explicit `missingGarmentPrompt`/`missingMotifPrompt`), and the out-of-stock caption is the only explanation available, positioned by the swatches rather than near the Add to Bag button** — verdict `low`. Confirmed: `missingGarmentPrompt`/`missingMotifPrompt` (`product-picker-shell.tsx:77-78`) have no color/size counterparts, and a URL-seeded out-of-stock color (e.g. `/shop/crewneck-sweatshirt/ivory`) leaves Add to Bag disabled with its only explanation in the swatch-adjacent caption at line 197-202. Raised independently by edge-case-hunter and blind-hunter (two findings, same root cause: CTA-disabled reasons aren't fully surfaced next to the button the way motif/garment are). Route: `patch`.
- **Out-of-stock caption is a sentence fragment and doesn't match `EXPERIENCE.md`'s Voice and Tone "Do" example** — verdict `low`. Confirmed at `product-picker-shell.tsx:198-201`: `"{color} currently out of stock in this style."` is missing a verb, reading as a fragment; `EXPERIENCE.md:46`'s Voice and Tone table gives "This design is currently out of stock in your size." as the approved full-sentence pattern. Every visitor who encounters the out-of-stock state sees this, so kept despite low severity. Route: `patch`.
- **Size control's button row lacks the `role="list"`/`aria-labelledby` grouping that Garment Type and Color both get in the same file** — verdict `low`. Confirmed: `product-picker-shell.tsx:143-173` (Garment Type) and `:177-203` (Color) both wrap their options in `role="list" aria-labelledby={...}`; the Size block (`:205-229`) has a plain `<span>` label with no `id` and a bare `<div className="flex gap-2">` with neither `role` nor `aria-labelledby` — an inconsistent accessibility pattern within the same component. Route: `patch`.
- **When the sticky Add-to-Bag bar becomes visible, the primary Add to Bag button stays in the DOM/accessibility tree — not `aria-hidden`, still focusable — with the identical accessible name, so two same-named primary actions are simultaneously exposed to assistive tech** — verdict `medium`. Confirmed: the primary button (`product-picker-shell.tsx:266-273`) has no `aria-hidden`/`tabIndex` toggle tied to `stickyVisible`, unlike `AddToBagBar` which does gate on `visible`. `EXPERIENCE.md`'s `button-primary` row states "never two `button-primary`s competing" — real ambiguity for screen-reader/voice-control users once the bar appears. Route: `patch`.
- **`lib/format-price.ts`'s conditional `minimumFractionDigits` would format prices inconsistently across a grid once any price has non-zero cents** (blind-hunter) — verdict `false`. Refuted: every current `garmentTypes` price (`lib/placeholder-shop-data.ts`) is a whole-dollar cents value (6800/3800/5800/4200); no reachable code path today produces a non-whole-dollar price, so the claimed mixed-format grid never actually renders.
- **`sizes` is typed as a loose `string[]` instead of a literal union, unlike `garmentTypeSlug`/`colorSlug`** (blind-hunter) — verdict rejected. No concrete failure scenario named beyond a hypothetical future typo; the fix (introducing and threading a shared literal type) is more than a direct correction, and the harm is speculative, not observed.
- **`GarmentSwatch`'s `title={label}` duplicates `aria-label={label}` verbatim** (blind-hunter) — verdict `false`. No functional or accessibility harm: screen readers use `aria-label` and ignore a redundant `title`; sighted users get a harmless native tooltip. No bad outcome demonstrated.
- **`product-picker-shell.tsx` doesn't comment that price is garment-type-level only (never re-derived from color)** (blind-hunter) — verdict `false`. A documentation suggestion, not a defect; no bad outcome demonstrated.
