---
title: 'Design-first picker, caricature garments, designs on Home'
type: 'feature'
created: '2026-10-27'
status: 'done'
baseline_commit: 'ccd877d0eda4e4d3c3166f1513dde088741000a3'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-weathered-thread-2026-09-14/EXPERIENCE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-weathered-thread-2026-09-14/DESIGN.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Home and Shop push garment-type cards the owner is dropping; a shopper who already chose a design is asked to choose one again, with Garment Type buried below it; garment choices use blank-garment photos that clash with the real design photography.

**Approach:** Implement the committed UX update (ccd877d; mocks `mockups/key-home.html`, `key-product.html`): Home and `/shop` show design tiles, the picker collapses a chosen design to a summary row and leads with caricature garment options tinted to the chosen color, and the hero becomes a user-driven gallery.

## Boundaries & Constraints

**Always:** Follow the spines as written (tokens, 44px targets, text labels, `aria-pressed`, "Photo N of M" announced). Keep `Shop`/`Motif` url-free (NFR8). Read `node_modules/next/dist/docs/` before Next.js code. Prices stay from the Etsy sync. `/shop/[type]` and `/shop/[type]/[color]` stay as unlinked garment-first deep links that show every option uncollapsed.

**Never:** Delete routes; autoplay or auto-rotate the gallery; show the "Choose a garment" prompt twice; add dependencies; change sync or catalog code; real image compositing (the preview slide reuses the existing blank-garment placeholder photo and caption).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Design-first arrival | `/collections/[slug]/[motif]` | Design collapsed to summary (collection, name, Change); order: Design, Garment Type, Color, Size, Add to Bag; hero = design photos | N/A |
| Change | Tap Change | Full design grid opens inline, tiles show collection; pick swaps and collapses; Close collapses unchanged | N/A |
| Garment-first arrival | `/shop/[type]/[color]` | Full design grid shown, nothing collapsed, no Close | N/A |
| Gallery | Design with N photos; garment+color chosen | N+1 slides, preview last, jumps to it on color pick; prev/next buttons; "Photo i of M" | No frontImage: no preview slide |
| No photos, no color | Design with no images | Existing "Select a garment to preview" text | N/A |
| Art by style | Heavyweight/Lightweight Crewneck, Long Sleeve Tee, Heavyweight Tee, unknown | crewneck, long-sleeve, tee, tee | Unknown falls back to tee |
| Home | More than 8 designs | Newest 6 tiles + "See all designs" to `/shop` | Zero designs: section hidden |

</frozen-after-approval>

## Code Map

- `components/product-picker-shell.tsx` -- sole picker; owns state; reorder, summary, gallery, option swap, single prompt
- `components/product-card.tsx`, `components/motif-tile.tsx` -- add optional `collection` label; product-card gains optional `media` slot for art
- `app/(site)/page.tsx`, `app/(site)/shop/page.tsx`, `app/(site)/shop/[type]/page.tsx` -- Home slice, drop "Browse by garment", colorway cards use tinted art
- `lib/collections.ts` (`getCollection`), `lib/motifs.ts` (newest-first order), `lib/shop-types.ts`, `lib/shop-presentation.ts` (`swatchColor`) -- reuse
- `app/globals.css` -- add `--color-garment-blank: #E3DDCE`
- `lib/shop.test.ts`, `package.json` `test:catalog` -- node:test; no component test harness exists, so logic goes in pure lib helpers
- Do not touch: `content/catalog/**`, `scripts/**`, `motif-tile-link.tsx` behavior

## Tasks & Acceptance

**Execution:**
- [x] `app/globals.css` -- add garment-blank token -- DESIGN.md
- [x] `lib/garment-art.ts` + `lib/garment-art.test.ts` -- `garmentArtKind(styleSlug)`; add test to `test:catalog` -- matrix "Art by style"
- [x] `lib/picker-gallery.ts` + test -- `buildGallerySlides`, `slideLabel` -- matrix "Gallery"
- [x] `components/garment-art.tsx`, `garment-option.tsx`, `design-summary.tsx`, `picker-gallery.tsx` -- new; SVGs ported from `mockups/key-product.html` symbols
- [x] `components/product-card.tsx`, `motif-tile.tsx` -- collection label, media slot
- [x] `components/product-picker-shell.tsx` -- apply new order, summary/Change/Close, gallery, options, remove photo strip
- [x] `app/(site)/page.tsx`, `shop/page.tsx`, `shop/[type]/page.tsx` -- per matrix

**Acceptance Criteria:**
- Given Home, when rendered, then no garment-type cards remain and a "See all designs" link goes to `/shop`.
- Given a chosen design, when a color is picked, then caricatures tint to it and the gallery shows the preview with a placeholder caption.
- Given `npm run lint`, `tsc --noEmit`, `test:catalog`, `build`, when run, then all pass.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route | Evidence |
|---|---|---|---|
| Color pick with no `frontImage` jumps to last design photo (shell:876) | medium | patch | Index = images.length clamps to last photo when no preview slide exists; matrix says no preview slide then. Also no test covers the index arithmetic. |
| Add to Bag disabled with no reason/describedby when design chosen, no garment (shell:106-111, 373-384) | medium | patch | Verified: with a motif and no garment every remaining prompt is null, so `aria-describedby` is undefined on a disabled button. |
| Focus lost on Change/Close/tile pick (shell:758,769,793) | low | patch | Focused button unmounts; keyboard users land on body. Small ref+effect fix. |
| `aria-expanded` always false on Change (design-summary:225) | low | patch | Summary only renders collapsed, so the attribute is meaningless; drop it. |
| Duplicate slide key if two photos share a URL (picker-gallery:424) | low | patch | Direct one-line key fix. |
| Swipe/scroll feedback loop between onScroll and scrollTo (picker-gallery:399-411) | maybe-false | defer | Effect can snap mid-swipe once the rounded index changes; cannot confirm without a device. Would be medium if real. Check by hand on touch. |
| Garment change with color selected does not re-jump to preview | low | rejected | Spec only requires the jump on color pick; fix adds branching. |
| Stale scrollLeft after resize/rotate; clientWidth 0 at mount | low | rejected | Rare; fix adds ResizeObserver. |
| "See all designs" shown for 8 or fewer designs (page.tsx:79) | false | rejected | AC says Home has a See all designs link to /shop; the matrix only fixes the >8 slice. |
| Home 8-vs-6 rule untested | low | rejected | Boundary logic is two lines; extracting a helper is more than a direct correction. |
| Close button when motif unknown | false | rejected | Design-first routes 404 for unknown motifs, so designFirst implies a motif. |
| Shell state persists across client navigation between designs | false | rejected | Dynamic route params remount the page component. |
| Collection fallback differs between picker and Home/Shop | low | rejected | Unreachable with valid catalog data. |
| `/shop` empty state; garmentArtKind underscores; hard-coded INK; aria-live verbosity; reduced-motion; caption wording; import order | low | rejected | Cosmetic or unlikely, fixes add guards or surface. |
| `/shop/[type]` unreachable from nav; colorway cards drop real photos | false | rejected | Both are the spec's stated intent (unlinked deep links, tinted art). |

## Verification

**Commands:**
- `npm run test:catalog` -- expected: all pass
- `npx tsc --noEmit && npm run lint` -- expected: clean
- `npm run build` -- expected: succeeds

**Manual checks (if no CLI):**
- Dev server: Home, `/shop`, a design page (collapsed/Change/Close), `/shop/heavyweight-tee/bay` (uncollapsed), 390px wide.
