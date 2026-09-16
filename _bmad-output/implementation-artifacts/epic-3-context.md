# Epic 3 Context: Garment × Motif Discovery & Picker

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A visitor can reach the same converged Product surface from either direction — browsing garments first (Shop) or motifs first (a Collection Story) — pick a garment × motif × color × size combination, watch the on-garment preview update as they choose, and search across garments and motifs directly. This epic is where the two entry paths in the site's PLACE → STORY → MOTIF → OBJECT architecture actually meet, so getting the shared Product surface and its picker state right here is what both Shop-first and Collection-first customers depend on before they can ever reach Checkout Handoff (Epic 4).

## Stories

- Story 3.1: Shop Garment Browsing (Shop-first entry)
- Story 3.2: Motif Selection on Collection Story (Collection-first entry)
- Story 3.3: Product Picker — Garment & Motif Selection With Live Preview
- Story 3.4: Product Page Content Sequence & Accessibility
- Story 3.5: Site Search

## Requirements & Constraints

- Shop surface shows garment types (Sweatshirts, Tees, Hats if sellable) as cards, then that type's colors as cards sourced from real synced inventory (e.g. Pepper, Blue Jean, Ivory, Bay) — not hand-typed.
- Both entry paths (garment-first via Shop, motif-first via a Collection Story) must converge on one identical Product surface for a given garment+motif combination.
- Color/size selection must show disabled (never hidden) swatches/sizes for combinations with no confirmed inventory, with out-of-stock microcopy; Add to Bag stays disabled until a fully valid combination exists.
- When no motif is chosen yet (garment-first entry), the Product surface shows "Choose a design for this piece." and Add to Bag stays disabled.
- Product surface content renders in fixed order: product images → name/price → color/size selectors → Add to Bag → emotional description → "THE GARMENT" → "THE EMBROIDERY" → fit/size → care → shipping/returns.
- Search covers garments and motifs by text; no matches shows a plain "No matches." with no fallback suggestions — no complex filtering beyond garment type/collection at launch.
- Accessibility floor: tap targets ≥44×44px; text labels (never color/image-only) on every motif tile and swatch, with screen-reader announcement of selection changes; alt text on motif/garment/preview images describes motif + story cue, never filename-derived; focus order on Product follows visual order (images → selection → Add to Bag → detail sections).
- Contrast (Wet Ink on Sailcloth, Sailcloth on Deep Harbor) must clear WCAG AA at body text size.
- No accounts/login/personalization/session state; no carousels, popups, discount modals, countdown timers, or scarcity UI anywhere in this epic's surfaces.
- Mobile-first at ~390px and up: single column, motif gallery/product grids max 2 columns on mobile, up to 3 on desktop — never more columns than the imagery can carry at readable size.
- Everything renders from static/build-time-synced content — no live runtime calls to Squarespace from a visitor-facing request.

## Technical Decisions

- Exactly one Client Component, `ProductPickerShell`, owns all picker state (motif, color, size) for a Product surface instance; `motif-tile`, `garment-swatch`, and the sticky Add-to-Bag bar are presentational islands that only read state/setters via props — never their own `useState`.
- Everything else on these surfaces defaults to Server Components; `'use client'` is reserved specifically for this picker interactivity (selection, live preview swap, sticky CTA).
- Entity model: `garment` = one Squarespace SKU (a color/size variant, the only thing Squarespace knows about); `motif` = repo-authored only, no Squarespace representation; `product` = one garment × motif pairing, assembled in-repo by cross-joining a collection's synced garments against its authored motifs — never itself a Squarespace SKU, never looked up from Squarespace directly.
- SKU is the join key between synced and authored content and is used byte-for-byte (no case-folding/slugification) in the `[sku]` route segment.
- Price is stored as an integer in cents and always rendered through one shared `formatPrice()` util — never a formatted string/float, never reimplemented per component.
- Closed set of image fields, no ad hoc additions: `garment.swatchImage`, `product.previewImage` (the on-garment composite), `motif.motifIcon`.
- Final garment-to-motif assignment is still an open business decision (not finalized during planning) — the Product surface and pickers need to behave sensibly (per the empty/no-motifs-assigned-yet state) rather than assume every garment has a motif lineup.
- The on-garment preview is a composited placeholder (flat motif photo digitally placed on a blank garment photo) until real photography exists; this is a data/asset concern, not a different code path later.

## UX & Interaction Patterns

- `motif-tile`: Paper Raised surface, caption-mono name label, `rounded.DEFAULT`; selected state is a thin Antique Brass border; tap selects and updates the on-garment preview elsewhere on screen; only one selected at a time per garment context.
- `garment-swatch`: small circular (`rounded.full`) swatch, Line border at rest / Wet Ink border selected; disabled (not hidden) when a color has no confirmed inventory.
- `product-card`: Paper Raised surface, body-type title, price-mono price, `rounded.DEFAULT`; used in the Shop grid and search results.
- Motif-preview swap should feel like a photo swap, never a spinner over the garment; if client-side composition is needed, show a brief Paper Raised placeholder instead.
- Sticky Add-to-Bag bar appears on mobile once the primary Add to Bag button scrolls out of view, keeping the one primary action reachable without duplicating the header.
- A `button-secondary` "Back to Shop" / "Back to Collection" (matching entry path) always accompanies the primary Add to Bag action on the Product surface — never the only action on screen.
- Tap/click only to select (motif, swatch, garment) — no hover-dependent affordances; product image galleries swipe on mobile, use arrow controls on desktop.
- No color fill/shadow on any of these surfaces beyond what `DESIGN.md` specifies; keep motion to quiet fades — no carousels or autoplay anywhere, including the motif gallery.

## Cross-Story Dependencies

- Story 3.1 and 3.2 are the two independent entry paths into Story 3.3's shared Product surface; 3.3 must support landing with either garment-only or motif-only pre-selected.
- Story 3.4 depends on the picker structure built in 3.3 (it specifies the fixed content order and focus order around the same surface, not a separate one).
- Story 3.5 (search) surfaces the same `product-card`/`motif-tile` components used in 3.1/3.2, so its result rendering should reuse rather than fork them.
- All of Epic 3 reads from the catalog data structure Epic 2 produces (`content/catalog/{sku}/` synced + authored, merged via `index.ts`); the final Sea Isle motif name list (13 motifs, renamed per the 2026-09-15 sprint change proposal) is authored in Epic 2 and simply consumed here — Epic 3's stories received no AC changes from that proposal.
- Epic 2's sync script depends on Squarespace being configured (per current project status this is not yet done), which in turn blocks real inventory/color/price data reaching Epic 3's surfaces — Epic 3 stories should be considered gated on that setup for anything beyond static/placeholder scaffolding.
- Epic 4 (Checkout Handoff) depends on Story 3.3's Add-to-Bag validity gating (a complete, in-stock combination) as its entry precondition.
