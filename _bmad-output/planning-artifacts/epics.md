---
stepsCompleted: [1, 2, 3]
inputDocuments:
  - '_bmad-output/planning-artifacts/ux-designs/ux-weathered-thread-2026-09-14/imports/website-build-handoff-prd.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-weathered-thread-2026-09-14/DESIGN.md'
  - '_bmad-output/planning-artifacts/ux-designs/ux-weathered-thread-2026-09-14/EXPERIENCE.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-weathered-thread-2026-09-14/ARCHITECTURE-SPINE.md'
---

# weathered-thread - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Weathered Thread, decomposing the requirements from the brand/structure PRD (`website-build-handoff-prd.md`), the UX design contract (`DESIGN.md` + `EXPERIENCE.md`), and the Architecture Spine into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Visitor can browse garment types (Sweatshirts, Tees, Hats if sellable) via a Shop grid — the garment-first entry path.
FR2: Visitor can browse the Sea Isle Collection Story (place/story narrative + motif gallery) — the collection-first entry path.
FR3: Visitor can select a motif from a Collection Story's motif gallery, then choose a garment (color, size) to pair it with.
FR4: Visitor can select a garment from the Shop grid, then choose a motif (scoped to the live collection) to pair with it.
FR5: The Product surface shows the selected garment × motif combination, including an on-garment preview image (composited placeholder until real photography exists).
FR6: Visitor can select garment color and size on the Product surface; unavailable combinations show disabled with out-of-stock messaging, never hidden entirely.
FR7: Visitor can add the selected garment × motif × color × size combination to bag, advancing to a Checkout Handoff interstitial.
FR8: The Checkout Handoff confirms the selection in plain language and links out to the exact matching Squarespace product page (at `shop.weatheredthread.com`) to complete payment.
FR9: Visitor can sign up for email updates from the homepage; submissions send via Resend.
FR10: Visitor can navigate via SHOP | COLLECTIONS | ABOUT plus search and bag icon from any surface.
FR11: Visitor can search text across garments and motifs; empty results show a plain "No matches" state, no fallback suggestions.
FR12: Product page renders, in fixed order: product images → name/price → color/size selectors → Add to Bag → emotional description → "THE GARMENT" → "THE EMBROIDERY" → fit/size → care → shipping/returns.
FR13: Catalog data (price, inventory, SKU, product name, Squarespace product URL) is synced from Squarespace's Products/Inventory API into the site's static content via a manually-run sync script.
FR14: Motif, story, and collection-grouping content is authored directly in the repo, keyed to synced garment data by SKU.
FR15: Homepage renders, in fixed order: Hero → Sea Isle feature → brand idea/story → shop/product grid → embroidery/detail section → email signup → footer.

### NonFunctional Requirements

NFR1: Site is mobile-first; every page and interaction is optimized at ~390px width and up, not just desktop.
NFR2: All interactive elements (motif tiles, swatches, nav icons) have tap targets ≥ 44×44px.
NFR3: Text/background contrast for Wet Ink-on-Sailcloth and Sailcloth-on-Deep-Harbor clears WCAG AA at body text size.
NFR4: Motif tiles, garment swatches, and all interactive elements carry a text label (never color/image-only identification); screen readers announce selection-state changes.
NFR5: No accounts, login, personalization, or session state (explicit launch exclusion).
NFR6: No carousels, popups, discount modals, countdown timers, or scarcity UI (explicit launch exclusion / brand voice rule).
NFR7: Catalog price/inventory/SKU displayed on the custom site never diverges from what Squarespace actually charges (sync integrity).
NFR8: The Checkout Handoff link always resolves to a URL on the `shop.weatheredthread.com` host — never Squarespace's default domain.
NFR9: Vercel Pro plan required (commercial project; Hobby plan disallowed for revenue-generating use).
NFR10: The site renders entirely from static/build-time-synced content at request time — no live runtime calls to Squarespace from a visitor-facing request.

### Additional Requirements

- No starter template needed — the repo is already a `create-next-app` Next.js 16.3.5 App Router scaffold (ratified, not re-derived). Epic 1 Story 1 must NOT scaffold a new app; it builds on what exists.
- Sync script (`scripts/sync-squarespace.ts`) pulling from Squarespace's Products + Inventory API (`SQUARESPACE_API_KEY`), run manually (local/CI) — never invoked from `next build`. Writes `content/catalog/{sku}/synced.ts` only; never touches `content/catalog/{sku}/authored.ts`.
- Resend email integration (`RESEND_API_KEY`, Vercel Marketplace) wired through one Server Action, `subscribeEmail` — no route handler, no second implementation.
- Domain/DNS split: `weatheredthread.com` registrar at Squarespace; app domain DNS → Vercel; `shop.weatheredthread.com` → Squarespace store.
- Vercel Pro hosting; automatic per-branch preview deployments (no extra setup).
- Catalog data structure: `content/catalog/{sku}/{synced.ts, authored.ts, index.ts}`; SKU = one Squarespace `garment` (color/size variant) only, never a motif combination; `product` (garment × motif) assembled in-repo.
- Single `ProductPickerShell` Client Component owns all picker state (motif, color, size); `motif-tile`, `garment-swatch`, sticky CTA are presentational islands underneath it.
- Closed image-field set: `garment.swatchImage`, `product.previewImage`, `motif.motifIcon` — no other ad hoc image fields.
- Next.js 16 `cacheComponents` flag stays off for v1 (no per-request dynamic data).

### UX Design Requirements

UX-DR1: Implement `nav-header` — Sailcloth surface, Wet Ink text, label-mono type for SHOP/COLLECTIONS/ABOUT + search/bag icons; sticky on scroll on mobile; no color fill or shadow, a Line hairline at most on scroll.
UX-DR2: Implement `button-primary` — Deep Harbor fill, Sailcloth label text, label-mono font, `rounded.sm` corners; exactly one per screen; disabled (not hidden) when its precondition isn't met.
UX-DR3: Implement `button-secondary` — transparent, Wet Ink border/text; never the primary conversion action; always paired with a `button-primary` elsewhere on the same screen.
UX-DR4: Implement `motif-tile` — Paper Raised surface, caption-mono motif-name label, `rounded.DEFAULT` corners; selected state is a thin Antique Brass border; tap selects and updates the on-garment preview elsewhere on screen; only one selected at a time per garment context.
UX-DR5: Implement `garment-swatch` — small circular (`rounded.full`) color swatch, Line border at rest / Wet Ink border selected; disabled (not hidden) for colors with no confirmed inventory.
UX-DR6: Implement `product-card` — Paper Raised surface, body-type title, price-mono price, `rounded.DEFAULT` corners; used in the Shop grid and search results.
UX-DR7: Implement `collection-story-block` — Deep Harbor surface, Sailcloth text, `display-lg` heading; scroll-triggered reveal only, no autoplay/carousel — the one place Deep Harbor covers a full section by design.
UX-DR8: Implement the `checkout-handoff` interstitial — Sailcloth surface, headline/body-sm text, confirms garment + motif + color/size in plain language, one `button-primary` forward ("Continue to Checkout"); not skippable-by-accident.
UX-DR9: Implement the 5-color brand palette + 2 supporting tones as real design tokens, exact hex values: Sailcloth `#EFEAE0`, Wet Ink `#2B2A26`, Deep Harbor `#2F4858`, Marsh Sage `#7C8567`, Antique Brass `#A8823C`, Paper Raised `#F7F4EC`, Line `#D9D2C2`.
UX-DR10: Implement typography tokens as real webfonts — Fraunces (display/headline/body) + IBM Plex Mono (label/price/caption) — replacing the system-font fallback used in the offline mockups.
UX-DR11: Implement spacing/radius tokens per `DESIGN.md`: spacing scale 1–7 plus `gutter-mobile`/`gutter-desktop`/`story-gap`; radii `sm`/`DEFAULT`/`md`/`full`.
UX-DR12: Tap targets ≥ 44×44px across all interactive elements (mobile-first accessibility floor).
UX-DR13: Alt text on all embroidery/product photography is descriptive of motif + story cue (e.g. "Water Tower motif embroidered on Blue Jean crewneck sweatshirt"), never filename-derived.
UX-DR14: Focus order on the Product surface follows visual order: images → garment/motif selection → Add to Bag → detail sections.
UX-DR15: Mobile layout: single column; motif gallery/product grids max 2 columns; sticky Add-to-Bag bar once the primary button scrolls out of view; icon-forward nav.
UX-DR16: Desktop layout: motif gallery/product grids up to 3 columns; text-label nav; wider `gutter-desktop` margin; story sections may run image + text side by side.
UX-DR17: Implement every State Pattern from `EXPERIENCE.md`: cold load (lazy-load placeholder, no spinner), motif-preview swap (feels like a photo swap, never a spinner over the garment), no-motif-selected prompt, out-of-stock disabled + microcopy, empty search "No matches", Checkout Handoff redirect-failure retry.

### FR Coverage Map

FR1: Epic 3 - Browse garments (Shop-first entry)
FR2: Epic 1 - Browse the Sea Isle Collection Story
FR3: Epic 3 - Select motif then garment (collection-first)
FR4: Epic 3 - Select garment then motif (garment-first)
FR5: Epic 3 - Product surface shows selected combination
FR6: Epic 3 - Color/size selection with out-of-stock states
FR7: Epic 4 - Add to bag advances to Checkout Handoff
FR8: Epic 4 - Checkout Handoff links to matching Squarespace product
FR9: Epic 1 - Homepage email signup via Resend
FR10: Epic 1 - Site navigation (SHOP/COLLECTIONS/ABOUT/search/bag)
FR11: Epic 3 - Search across garments and motifs
FR12: Epic 3 - Product page fixed content sequence
FR13: Epic 2 - Squarespace catalog sync (price/inventory/SKU/URL)
FR14: Epic 2 - Repo-authored motif/story content keyed by SKU
FR15: Epic 1 - Homepage fixed section order

## Epic List

### Epic 1: Site Foundation, Brand System & Storytelling
A visitor can land on the site with the full brand identity applied, navigate SHOP/COLLECTIONS/ABOUT + search/bag, browse the homepage in its fixed order, read the Sea Isle Collection Story, visit About, and sign up for email updates.
**FRs covered:** FR2, FR9, FR10, FR15

### Epic 2: Catalog Data Pipeline
The site owner can sync real garment data (price, inventory, SKU, Squarespace URL) from Squarespace and author motif/story content alongside it — producing the structured catalog every later epic renders from.
**FRs covered:** FR13, FR14

### Epic 3: Garment × Motif Discovery & Picker
A visitor can browse garments (Shop-first) or motifs (Collection-first), select a garment×motif combination with color/size, see it previewed on the Product surface, search across garments/motifs, and hit correct empty/out-of-stock states throughout.
**FRs covered:** FR1, FR3, FR4, FR5, FR6, FR11, FR12

### Epic 4: Checkout Handoff to Squarespace
A visitor can add a selection to bag, review it in plain language, and get handed to the exact matching Squarespace product page to pay — always landing on the correct branded subdomain.
**FRs covered:** FR7, FR8

## Epic 1: Site Foundation, Brand System & Storytelling

A visitor can land on the site with the full brand identity applied, navigate SHOP/COLLECTIONS/ABOUT + search/bag, browse the homepage in its fixed order, read the Sea Isle Collection Story, visit About, and sign up for email updates.

### Story 1.1: Homepage Renders With Brand Identity

As a visitor,
I want to land on the homepage and see the brand's look and content in the right order,
So that I immediately understand what Weathered Thread is and what's in the current collection.

**Acceptance Criteria:**

**Given** a visitor navigates to weatheredthread.com
**When** the homepage loads
**Then** it renders sections in this fixed order: Hero, Sea Isle feature, brand idea/story, shop/product grid, embroidery/detail section, email signup, footer
**And** Sailcloth, Wet Ink, Deep Harbor, Marsh Sage, and Antique Brass render as the only brand colors used, with Paper Raised/Line as supporting tones
**And** headings/body copy render in Fraunces and labels/prices render in IBM Plex Mono
**And** Deep Harbor covers the Sea Isle feature section as a full-bleed block — its one sanctioned large-area use
**And** cards/raised surfaces use `rounded.DEFAULT` corners, buttons use `rounded.sm`, and no shape exceeds `rounded.md` except the circular `rounded.full` swatches introduced in Epic 3

**Given** a visitor on a mobile device (~390px width)
**When** the homepage loads
**Then** all sections render single-column with `gutter-mobile` padding and no horizontal scroll
**And** every interactive element has a tap target of at least 44×44px
**And** images lazy-load behind a Paper Raised/Sailcloth placeholder — no loading spinner anywhere on cold load

### Story 1.2: Site-Wide Navigation

As a visitor,
I want consistent navigation on every page,
So that I can move between Shop, Collections, About, search, and my bag from anywhere.

**Acceptance Criteria:**

**Given** a visitor is on any page
**When** the page renders
**Then** a `nav-header` shows SHOP, COLLECTIONS, ABOUT, a search icon, and a bag icon
**And** on mobile it becomes sticky once scrolled past; on desktop items render as text labels, on mobile icon-forward
**And** it shows no color fill or shadow — only a Line hairline once scrolled

**Given** a visitor taps SHOP, COLLECTIONS, or ABOUT
**When** the tap registers
**Then** they land on the corresponding surface (Shop garment-type grid, Collections list, About page)

### Story 1.3: Sea Isle Collection Story Page

As a visitor,
I want to read the story behind Sea Isle before picking anything,
So that the collection feels like a place worth remembering, not just a product grid.

**Acceptance Criteria:**

**Given** a visitor navigates to the Sea Isle Collection Story
**When** the page loads
**Then** it renders `collection-story-block` first (Deep Harbor surface, Sailcloth text, PLACE → STORY copy) via scroll-triggered reveal — never autoplay/carousel
**And** a motif gallery renders below it

**Given** Sea Isle currently has 13 authored motifs
**When** the gallery renders
**Then** all 13 motif-tiles show with their real names (Seagull, Wave, Smile You're in Sea Isle, Water Tower, Life Ring, Turtle, Bike, Boat, Exit 17, Nautical Map – Fish Alley, Beach Chair, Pickleball, Lobster Loft)
**And** this story covers browsing/reading only — tapping a motif to start the picker is Epic 3's

### Story 1.4: About Page

As a visitor,
I want to read about the brand's philosophy,
So that I understand what Weathered Thread stands for beyond the products.

**Acceptance Criteria:**

**Given** a visitor navigates to About
**When** the page loads
**Then** it renders the brand idea, philosophy, and tagline using the same brand tokens as the rest of the site
**And** the page contains no product grid, picker, or purchase path

### Story 1.5: Homepage Email Signup

As a visitor,
I want to sign up for email updates,
So that I can hear about new collections without creating an account.

**Acceptance Criteria:**

**Given** a visitor enters a valid email in the signup section and submits
**When** the form submits
**Then** it calls the `subscribeEmail` Server Action, which sends to Resend
**And** the visitor sees a plain-language success confirmation

**Given** a visitor submits an invalid or empty email
**When** they submit
**Then** validation runs inside `subscribeEmail` only, and they see a plain-language error

**Given** the form is deployed
**Then** the Resend key is read only from `RESEND_API_KEY` and never reaches the client bundle

## Epic 2: Catalog Data Pipeline

The site owner can sync real garment data (price, inventory, SKU, Squarespace URL) from Squarespace and author motif/story content alongside it — producing the structured catalog every later epic renders from.

### Story 2.1: Sync Squarespace Garment Data

As a site owner,
I want to pull real garment data (price, inventory, SKU, name, product URL) from Squarespace into the site,
So that the storefront always reflects real commerce facts without hand-typing them.

**Acceptance Criteria:**

**Given** a valid `SQUARESPACE_API_KEY` in the local/CI environment
**When** the site owner runs `scripts/sync-squarespace.ts`
**Then** it fetches price, inventory, SKU, name, and product URL for every garment from Squarespace's Products + Inventory API
**And** it writes exactly one `content/catalog/{sku}/synced.ts` per garment, fully overwriting any prior version
**And** it never writes to `content/catalog/{sku}/authored.ts`

**Given** any Squarespace API call fails during a run
**When** the script encounters the error
**Then** it writes nothing (all-or-nothing) rather than a partial file, and exits with a clear error message

**Given** a garment's returned product URL
**When** the script validates it
**Then** it verifies the host is `shop.weatheredthread.com` and fails loudly, writing nothing, if any URL resolves to a different host

**Given** the repo's `package.json`
**Then** `sync-squarespace.ts` is never referenced from the `build` script — it only runs as a standalone command, never from `next build` or any Vercel build/runtime step

**Given** synced data already exists on `main`
**When** a new sync run would regress a previously-synced field (e.g. an older price)
**Then** the script warns before writing, rather than silently overwriting with stale data

### Story 2.2: Author Motif & Story Content Per Garment

As a site owner,
I want to write motif name, story copy, and collection grouping for each synced garment,
So that the catalog carries the storytelling Squarespace has no model for.

**Acceptance Criteria:**

**Given** a garment's `content/catalog/{sku}/synced.ts` exists
**When** the site owner creates or edits `content/catalog/{sku}/authored.ts`
**Then** they can set motif name, place/story copy, and collection grouping for that garment
**And** `content/catalog/{sku}/index.ts` re-exports the merge of `synced.ts` and `authored.ts` as one object

**Given** `authored.ts` already has content for a garment
**When** the sync script re-runs and overwrites `synced.ts`
**Then** `authored.ts` is left completely untouched

## Epic 3: Garment × Motif Discovery & Picker

A visitor can browse garments (Shop-first) or motifs (Collection-first), select a garment×motif combination with color/size, see it previewed on the Product surface, search across garments/motifs, and hit correct empty/out-of-stock states throughout.

### Story 3.1: Shop Garment Browsing (Shop-first entry)

As a visitor,
I want to browse garment types then colors,
So that I can start by picking the blank I like before choosing a design.

**Acceptance Criteria:**

**Given** a visitor taps SHOP
**When** the Shop page loads
**Then** it shows garment-type `product-card`s (Sweatshirts, Tees, and Hats if sellable)

**Given** a visitor taps a garment type
**When** the Garment Type List loads
**Then** it shows that type's colors as `product-card`s, sourced from real synced inventory (e.g. Pepper, Blue Jean, Ivory, Bay)

**Given** a visitor taps a specific garment + color
**When** the tap registers
**Then** they land on the Product surface with that garment selected and no motif chosen yet

### Story 3.2: Motif Selection on Collection Story (Collection-first entry)

As a visitor,
I want to tap a motif on the Sea Isle Collection Story,
So that I can start by picking the design I like before choosing a garment.

**Acceptance Criteria:**

**Given** a visitor is on the Sea Isle Collection Story and taps a `motif-tile`
**When** the tap registers
**Then** the tile shows selected state (Antique Brass border) and the visitor lands on the Product surface with that motif selected and no garment chosen yet
**And** only one motif can be selected at a time in this context

### Story 3.3: Product Picker — Garment & Motif Selection With Live Preview

As a visitor,
I want to choose garment color/size and see my motif shown on it,
So that I can see exactly what I'm buying before adding to bag.

**Acceptance Criteria:**

**Given** a visitor lands on the Product surface with either garment or motif pre-selected (from Story 3.1 or 3.2)
**When** they complete the missing selection (motif if they entered garment-first, garment if motif-first)
**Then** the preview image updates to that combination's `product.previewImage`

**Given** a visitor changes color or size
**When** they tap a `garment-swatch` or a size
**Then** the swatch's selected state updates (Wet Ink border) and the preview/price update accordingly
**And** all of this state is owned by one `ProductPickerShell`; `motif-tile`, `garment-swatch`, and the sticky Add-to-Bag bar stay presentational, reading state via props

**Given** a color has no confirmed inventory
**When** the Product surface renders
**Then** its swatch shows disabled (not hidden) with out-of-stock microcopy, and Add to Bag stays disabled until a valid combination is chosen

**Given** no motif is selected yet (garment-first entry)
**When** the Product surface renders
**Then** it shows "Choose a design for this piece." and Add to Bag stays disabled

**Given** a visitor on mobile scrolls the Product surface until the main Add to Bag button leaves the viewport
**When** it scrolls out of view
**Then** a sticky Add-to-Bag bar appears, keeping the primary action reachable without duplicating the full header

**Given** the motif gallery or product grid renders on the Product/Shop surfaces
**When** viewed on mobile vs. desktop
**Then** it shows at most 2 columns on mobile and up to 3 columns on desktop, never more than the imagery can carry at readable size

**Given** a visitor arrived at the Product surface from Shop or a Collection Story
**When** the page renders
**Then** a `button-secondary` "Back to Shop" or "Back to Collection" link (matching the entry path) sits alongside the primary Add to Bag action — never standing alone as the only action on screen

### Story 3.4: Product Page Content Sequence & Accessibility

As a visitor,
I want full details about the garment and the embroidery on the product page,
So that I can decide confidently before buying.

**Acceptance Criteria:**

**Given** a visitor is on the Product surface
**When** the page renders
**Then** content appears in fixed order: product images → name/price → color/size selectors → Add to Bag → emotional description → THE GARMENT → THE EMBROIDERY → fit/size → care → shipping/returns

**Given** a screen-reader user
**When** they navigate the Product surface
**Then** focus order follows: images → garment/motif selection → Add to Bag → detail sections

**Given** the motif icon, garment swatch, and on-garment preview images
**When** they render
**Then** each carries alt text describing motif + story cue (e.g. "Water Tower motif embroidered on Blue Jean crewneck sweatshirt"), never filename-derived

### Story 3.5: Site Search

As a visitor,
I want to search for garments and motifs by name,
So that I can jump straight to what I'm looking for.

**Acceptance Criteria:**

**Given** a visitor taps the search icon and enters a query
**When** matches exist among garments/motifs
**Then** matching `product-card`s/`motif-tile`s render as results

**Given** a query has no matches
**When** results render
**Then** a plain "No matches." message shows, with no fallback suggestions

## Epic 4: Checkout Handoff to Squarespace

A visitor can add a selection to bag, review it in plain language, and get handed to the exact matching Squarespace product page to pay — always landing on the correct branded subdomain.

### Story 4.1: Add to Bag Advances to Checkout Handoff

As a visitor,
I want to add my selected garment+motif+color+size to bag,
So that I can review it before paying.

**Acceptance Criteria:**

**Given** a visitor has a valid garment+motif+color+size selected on the Product surface (Add to Bag enabled per Story 3.3)
**When** they tap Add to Bag (`button-primary`)
**Then** they advance to the Checkout Handoff interstitial

**Given** the Checkout Handoff renders
**Then** it shows a Sailcloth surface with headline/body-sm text confirming garment + motif + color/size in plain language, and one `button-primary` forward ("Continue to Checkout")
**And** it is not skippable-by-accident — a deliberate pause, not a spinner or auto-redirect

### Story 4.2: Checkout Handoff Links to the Correct Squarespace Product

As a visitor,
I want to be sent to the exact matching Squarespace product page,
So that I can pay for the exact item I selected.

**Acceptance Criteria:**

**Given** a visitor is on Checkout Handoff and taps "Continue to Checkout"
**When** the tap registers
**Then** they're redirected to that product's stored `url` field (from synced Squarespace data), rendered as-is — never constructed or rewritten client-side
**And** that URL's host is always `shop.weatheredthread.com` (validated at sync time in Epic 2)

**Given** the redirect fails (network error, broken link)
**When** the failure occurs
**Then** the visitor sees plain retry copy ("That didn't go through — try again") with the same Continue button — never a silent failure
