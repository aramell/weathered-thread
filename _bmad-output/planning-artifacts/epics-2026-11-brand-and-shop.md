# Epics: Brand and Shop Revision (Nov 2026)

Source: `prds/prd-weathered-thread-2026-11-20/prd.md` (FR16 to FR32). Continues numbering from `epics.md` (Epics 1 to 4). Epic 4 there (Etsy hand-off) is superseded by Square hosted checkout; refreshing `epics.md` is a separate housekeeping item.

Before any story: read the relevant guide in `node_modules/next/dist/docs/` (AGENTS.md). Restoring `stash@{0}` (Square checkout WIP) is tracked separately and should land first or be rebased deliberately, since Stories 5.1, 6.2 and 6.3 touch the same files.

## FR coverage

| FR | Story |
|---|---|
| FR16 | 5.2 |
| FR17 | 5.3 |
| FR18, FR21 | 5.4 |
| FR19 | 5.5 |
| FR20 | 5.2, 5.3 |
| FR22 | 5.1 |
| FR23 | 7.1 |
| FR24 | 7.2 |
| FR25 | 7.3 |
| FR26 | 6.1 |
| FR27, FR28 | 6.2 |
| FR29, FR30 | 6.3 |
| FR31 | 8.1 |
| FR32 | 8.2 |

Order: Epic 5, then 6, then 7, then 8. Epic 8 is blocked on assets.

---

## Epic 5: Fix what's broken

Make the shop truthful and reachable before changing how it looks.

### Story 5.1: Collections index resolves (built, in review)
As a visitor, I want the Collections link to work, so that I can browse by place.
- **Given** the header link to Collections, **when** I follow it, **then** `/collections` renders a page listing every collection with a link to each.
- **Given** any collection slug in `lib/collections.ts`, **when** I open `/collections/{slug}`, **then** it renders, not a 404.
- A test fails the build if a nav link has no matching route.
- Verify the 404 cause in the browser first (PRD A-1).

### Story 5.2: Bay only on tees; size list from data
- **Given** Bay is Heavyweight Tee only (decided), **when** any other style is shown, **then** Bay is not offered for it.
- The rule lives in one place (a catalog or shop-presentation rule), not per page.
- **Given** the shop model, **then** sizes shown equal those in the synced data. Trim unused `2XL`/`3XL` from `SIZE_ORDER` in `lib/shop.ts`.
- Test: a Bay variation on a non-tee style never reaches the rendered shop.

### Story 5.3: Prices match the owner's chart
- **Given** the owner's pricing chart, **when** every style, color and size is compared with the site, **then** all prices match, or each difference is listed and explained.
- Find the root cause (hypothesis: lowest-price-across-listings in `lib/shop.ts`) before changing code. Add a test with chart values as fixtures.
- **Blocked by** OQ-4 (chart and price screenshot).

### Story 5.4: All active designs appear; Etsy changes flow through
- **Given** the owner has run `npm run auth:etsy`, **when** the sync runs, **then** every active listing the owner intends to sell is in `content/catalog` (15 expected).
- **Given** updated photos on Etsy, **when** the documented refresh step runs, **then** the site serves the new images and the old ones are removed.
- Each new design gets authored story content (`authored.ts`) and passes the registry drift check (Story 2.4).
- **Blocked by** OQ-2.

### Story 5.5: Hide and unhide a design
- **Given** a design marked hidden, **when** any listing, search, collection or direct URL is requested, **then** the design is not shown (direct URL returns not found).
- **Given** the flag is removed, **then** it reappears with no other change.
- Default mechanism: a `hidden` field in repo-authored content (OQ-3).

---

## Epic 6: Brand alignment

Bring the site to the Master Brand Guidelines v1.0. Palette already matches and needs no work.

### Story 6.1: Anton for location wording
- Anton is loaded via `next/font` and exposed as a font token with uppercase, slightly tracked styling.
- Applied only to place names: the Sea Isle story heading, the collection label on design tiles, and place-collection page headings. A `kind: "place" | "brand"` field on collections decides it.
- The "Weathered Thread" brand heading and all other display type stay Fraunces.
- Verified in browser on the Deep Harbor block at mobile width (OQ-6). `DESIGN.md` documents four typefaces and Anton's single job.

### Story 6.2: Eyebrow and tagline copy
- Sea Isle eyebrow is "For places worth remembering" on the collection page and the home page block; both read it from `lib/collections.ts`. "Launch Collection" is removed.
- Remove the trailing "Made to remember." from the brand collection story and from `wt-horizontal-logo/authored.ts`. The exact tagline remains only on the home page, About page and page title.
- Meta description is unchanged.

### Story 6.3: Logos and brand rules
- **Given** the approved logo files (OQ-4), **when** the logo appears, **then** the exact files are used, unaltered, with clear space.
- Search confirms no lighthouse reference and no unlocked Weathered Clay.
- **Blocked by** OQ-4 (logo files).

---

## Epic 7: Simplified design-first picker

### Story 7.1: Design locked on the product page
- **Given** I chose a design on Shop or a collection, **when** I reach its product page, **then** I can change only style, color and size.
- The design switcher is removed from the product page.
- The bag and checkout flows are unchanged. Existing picker tests are updated, not deleted.

### Story 7.2: Color names on swatches
- **Given** any style's colors, **then** each swatch shows its name as visible text, and the selected color's name is announced to screen readers.
- Tap targets stay at least 44px.

### Story 7.3: Comfort Colors quality section
- A short section on the product page and the cotton line are written from the owner's Comfort Colors tile.
- No claim appears that the tile or supplier facts don't support (guide section 6).
- **Blocked by** OQ-4 (tile image).

---

## Epic 8: Homepage and About

Blocked on assets. Do last.

### Story 8.1: Homepage shows what the product is
- The approved logo and a few of Andrew's real photos show embroidered pieces clearly, in the baseline section order (FR15).
- Alt text describes the motif and place. No generated imagery.
- **Blocked by** OQ-4 (logo, photos).

### Story 8.2: About page
- The About page uses Andrew's supplied copy verbatim, ending with the "Shop the Collection" call to action linking to the Sea Isle collection.
- Photo slots hold placeholders until images arrive and are clearly marked for later.
- Unblocked now; only the photos wait.
