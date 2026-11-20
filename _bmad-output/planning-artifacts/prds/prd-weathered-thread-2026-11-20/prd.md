---
title: "PRD Update: Weathered Thread brand and shop revision (Nov 2026)"
status: draft
created: 2026-11-20
updated: 2026-11-20
baseline: _bmad-output/planning-artifacts/ux-designs/ux-weathered-thread-2026-09-14/imports/website-build-handoff-prd.md
---

# PRD Update: Weathered Thread brand and shop revision (Nov 2026)

## 0. Document Purpose

This is a delta PRD. It changes the September handoff PRD (the baseline) in response to the Master Brand Guidelines v1.0 (Nov 2026) and Andrew's review of the live shop. Anything not mentioned here stays as the baseline and `epics.md` say. Two baseline facts are superseded: checkout is now Square hosted checkout with an on-site bag (`spec-square-hosted-checkout.md`), not an Etsy hand-off, and Etsy remains the source of catalog data and photos only.

Status is `draft` on purpose: several requirements wait on files Andrew has not yet delivered (see section 8).

## 1. Vision

A visitor lands on the site and understands within seconds what Weathered Thread sells: small embroidered pieces that carry the meaning of a place. They pick a design, pick a shirt style, color and size, and the site never shows them a size, color or price that isn't real. The brand reads as warm, lived-in and understated, exactly as the guidelines describe, and Sea Isle is the first collection, not the whole brand.

## 2. Target User

People attached to a particular place (here, Sea Isle City) who want something to keep and wear, and gift buyers shopping for them. They arrive on a phone, often from Instagram or Etsy.

### 2.1 Jobs To Be Done
- When I see a design that reminds me of a place, let me get it in my style, color and size without second-guessing the choices.
- When I'm unsure about the shirt itself, tell me plainly what Comfort Colors is and why it's worth wearing.

### 2.3 Key User Journeys

**UJ-1. Maureen buys the water tower tee.** Maureen follows a link from Instagram to the home page. The logo and a few real photos of embroidered pieces tell her what this is. She taps Shop, taps the Water Tower design, and lands on its product page. The design stays fixed. She chooses Heavyweight Tee, steps through the colors and sees each one named (Ivory, Pepper, Blue Jean, Bay), picks Bay, picks M, sees the correct price, adds it to her bag and checks out.

**UJ-2. Dan browses by place.** Dan taps Collections, sees the Sea Isle collection under the line "For places worth remembering", and opens it. He finds the designs, taps one and continues as in UJ-1. At no point does he reach a 404.

## 3. Glossary
- **Design**: one embroidery motif and its Etsy listing (for example Water Tower).
- **Style**: garment type (Heavyweight Tee, Long Sleeve Tee, Heavyweight Crewneck, Lightweight Crewneck).
- **Location wording**: place names such as "SEA ISLE", set in Anton per the guidelines.
- **Hidden design**: a design that exists in the catalog but is not shown on the site, used to stage launches.

## 4. Features

### 4.1 Catalog accuracy and availability

Why: the guidelines say never imply an unoffered size or color, and the live shop currently shows wrong prices, wrong Bay availability and 9 of an expected 15 designs.

- **FR16.** Bay is offered only on the Heavyweight Tee (decided 2026-11-20). The rule is data-driven, not hard-coded per page.
- **FR17.** Every displayed price equals the owner's pricing chart for that style, color and size. Price parity is checked against the chart before release.
- **FR18.** Every active Etsy listing the owner intends to sell appears as a design (15 expected; 9 appear today).
- **FR19.** The owner can hide any design without deleting it, and unhide it later, so launches can be staged. *Mechanism is open (OQ-3).*
- **FR20.** Sizes and colors shown are exactly those in the synced data; nothing unlisted appears (S, M, L today).
- **FR21.** When the owner updates photos on Etsy, a repeatable step pulls them through to the site. The site's own image hosting stays.

### 4.2 Navigation integrity

- **FR22.** `/collections` resolves to a page listing collections, and each collection page resolves. No navigation link returns a 404.

### 4.3 Simplified design-first picker

- **FR23.** A design chosen from the Shop or a collection is fixed on its product page. The visitor changes only style, color and size there. There is no design switcher on the product page.
- **FR24.** Every color choice shows its name as visible text, including while stepping through colored shirts.
- **FR25.** The product page includes a short section on Comfort Colors garment quality, and the cotton language is rewritten to reflect the owner's supplied Comfort Colors tile. Claims come only from verified supplier facts; none are invented.

### 4.4 Brand alignment

- **FR26.** Location wording is set in Anton, uppercase, slightly tracked. Anton is not used for headlines generally or to recreate the logo.
- **FR27.** The Sea Isle collection eyebrow reads "For places worth remembering". "Launch Collection" appears nowhere.
- **FR28.** The tagline appears only as exactly "Made to Remember. Stitched in." and is not used as a trailing fragment in product or collection copy.
- **FR29.** The approved logo files are used unaltered wherever the logo appears. The logo is never recreated in a font or redrawn.
- **FR30.** No lighthouse imagery or reference appears anywhere. Weathered Clay is not used until its hex is confirmed.

### 4.5 Homepage and About

- **FR31.** The homepage shows the approved logo and a few real product photos that make clear what is sold. The section order in baseline FR15 is kept unless the owner says otherwise. Photos come from the owner; none are generated.
- **FR32.** The About page uses the owner's supplied copy as written, ends with a "Shop the Collection" call to action, and holds placeholders for photos until they arrive.

## 5. Non-Goals
- Redesigning or recreating the logo.
- Inventing a Weathered Clay color value.
- Site-wide headline typography change to Anton.
- Restoring the stashed Square checkout WIP (`stash@{0}`); tracked separately.
- Custom embroidery, kids, accessories, accounts, carousels and popups (baseline exclusions stand).

## 6. MVP Scope
### 6.1 In Scope
FR16 through FR32, delivered as Epics 5 to 8 in `epics-2026-11-brand-and-shop.md`.
### 6.2 Out of Scope
Anything in section 5; new collections; new product categories.

## 7. Success Metrics
- Zero 404s on every header, footer and in-page navigation link (checked by test and by hand).
- 100% of style, color and size combinations match the owner's pricing chart.
- Designs shown equals the owner's list of active, unhidden listings.
- Counter-metric: no new fonts, colors or visual effects beyond the guidelines are introduced.

## 8. Open Questions

Phase-blockers are marked **[B]**.

- **OQ-1** Resolved 2026-11-20: Bay is Heavyweight Tee only.
- **OQ-2 [B]** Are the 6 missing designs active on Etsy? Pulling them in needs a sync, which needs Andrew to run `npm run auth:etsy` once. *Owner: Andrew.*
- **OQ-3** Is a simple per-design `hidden` flag in repo content enough, or should hiding follow the Etsy listing state? *Owner: Andrew; default: repo flag.*
- **OQ-4 [B]** Files not received: logos, homepage photos, color/size/pricing charts, Comfort Colors tile, price screenshot. FR17, FR25, FR29 and FR31 cannot be finished without them. *Owner: Andrew.*
- **OQ-5** Why are prices wrong? Hypothesis: the shop takes the lowest price across listings for each combination. Unconfirmed until the pricing chart is compared. *Owner: dev.*
- **OQ-6** Does Anton hold up on the dark Deep Harbor block at mobile size? Check in browser before merge. *Owner: dev.*

## 9. Assumptions Index
- **A-1** `/collections` 404s because only `collections/[slug]` exists on the branch; the index page lives in the stash. Verify in browser.
- **A-2** Sizes are S, M, L only for every listing (verified in synced data, 432 variations).
- **A-3** The Etsy sync remains the source for price and variations; Square is payments only.
