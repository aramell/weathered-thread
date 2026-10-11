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
- Mobile-first at ~390px and up: single column, motif gallery/product grids max 2 columns on mobile, up to 3 on desktop.
- Everything renders from static/build-time-synced content — no live runtime calls to Etsy from a visitor-facing request. The raw Etsy listing `url` never reaches a client bundle or site markup.

## Technical Decisions

- Exactly one Client Component, `ProductPickerShell`, owns all picker state (motif, color, size) for a Product surface instance; `motif-tile`, `garment-swatch`, and the sticky Add-to-Bag bar are presentational islands that only read state/setters via props — never their own `useState`.
- Everything else on these surfaces defaults to Server Components; `'use client'` is reserved for picker interactivity (selection, live preview swap, sticky CTA).
- Entity model: the commerce catalog is one Etsy `listing` per design (`motif`), with three variation axes — garment style (long-sleeve tee, short-sleeve tee, heavyweight crew, lightweight crew), color (ivory, pepper, blue jean), and size (S/M/L on tees; crew sizes unconfirmed). `garment` = one style × color combination (carries `swatchImage`); `motif` = a design, with repo-authored story/icon content plus its synced listing; `product` = one garment × motif pairing, assembled in-repo and sharing its motif's listing (and listing URL).
- Open catalog-model items this epic must settle or work around: what identifies a `product` in its route (a listing key alone identifies only the design); where garment-level content (`swatchImage`, style/color) lives now that catalog directories are per listing; how a style/color a design isn't offered in appears in the picker; whether per-combination price/inventory are readable without OAuth; and how the placeholder garment types/colorways/sizes (bay, XL, crewneck-sweatshirt) reconcile with the Etsy "garment style" axis.
- Any route segment derived from a listing key uses it byte-for-byte (no case-folding/slugification).
- Price is stored as an integer in cents and always rendered through one shared `formatPrice()` util — never a formatted string/float, never reimplemented per component.
- Closed set of image fields, no ad hoc additions: `garment.swatchImage`, `product.previewImage` (the on-garment composite), `motif.motifIcon`.
- Final garment-to-motif assignment is still an open business decision — surfaces must behave sensibly (empty/no-motifs-assigned-yet state) rather than assume every garment has a motif lineup.
- The on-garment preview is a composited placeholder until real photography exists; that is a data/asset concern, not a different code path later.

## UX & Interaction Patterns

- `motif-tile`: Paper Raised surface, caption-mono name label, `rounded.DEFAULT`; selected state is a thin Antique Brass border; tap selects and updates the on-garment preview elsewhere on screen; only one selected at a time per garment context.
- `garment-swatch`: small circular (`rounded.full`) swatch, Line border at rest / Wet Ink border selected; disabled (not hidden) when a color has no confirmed inventory.
- `product-card`: Paper Raised surface, body-type title, price-mono price, `rounded.DEFAULT`; used in the Shop grid and search results. Tap goes to the Product surface for that garment (motif unset) or that garment+motif pairing when reached from a design-specific context.
- Motif-preview swap should feel like a photo swap, never a spinner over the garment; if client-side composition is needed, show a brief Paper Raised placeholder instead.
- Sticky Add-to-Bag bar appears on mobile once the primary Add to Bag button scrolls out of view, without duplicating the header.
- A `button-secondary` "Back to Shop" / "Back to Collection" (matching entry path) always accompanies the primary Add to Bag action — never the only action on screen.
- Tap/click only to select — no hover-dependent affordances; product image galleries swipe on mobile, arrow controls on desktop.
- No color fill/shadow beyond what `DESIGN.md` specifies; motion limited to quiet fades — no carousels or autoplay, including the motif gallery.

## Cross-Story Dependencies

- Story 3.1 and 3.2 are the two independent entry paths into Story 3.3's shared Product surface; 3.3 must support landing with either garment-only or motif-only pre-selected.
- Story 3.4 depends on the picker structure built in 3.3 (fixed content order and focus order around the same surface).
- Story 3.5 (search) surfaces the same `product-card`/`motif-tile` components used in 3.1/3.2, so it should reuse rather than fork them.
- Epic 2 (catalog sync, authored content merge, server-only catalog read layer, registry drift check) is delivered: Epic 3 reads merged listings through the catalog read module, not per-listing files or `lib/placeholder-*.ts`. Existing pages still on the placeholder data are recorded follow-up work for moving onto the catalog. The 13 Sea Isle motifs (renamed per the 2026-09-15 sprint change proposal) are authored in Epic 2 and simply consumed here.
- Real inventory/color/size data depends on what Etsy's public read-only endpoints expose without OAuth (unconfirmed for per-variation inventory); Etsy app approval and API Terms limits on storing listing data remain unverified.
- Epic 4 (Checkout Handoff) depends on Story 3.3's Add-to-Bag validity gating (a complete, in-stock combination) as its entry precondition.
