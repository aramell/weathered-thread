---
title: 'Product Page Content Sequence & Accessibility (Epic 3 Story 3.4)'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: 'dd8921a1e61f0a11e6f666832ab71b7030b9dc37'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `ProductPickerShell` (Story 3.3) stops at Add to Bag — no emotional description, THE GARMENT, THE EMBROIDERY, fit/size, care, or shipping/returns content exists yet, leaving the Product surface content-incomplete against the epic's fixed order (FR12).

**Approach:** Extend `ProductPickerShell` with five static sections after Add to Bag, in the epic's fixed order, sourced from `key-product.html`'s reference copy plus new per-garment-type/per-motif fields, with TODO-flagged placeholder copy wherever real business content isn't finalized yet.

## Boundaries & Constraints

**Always:**
- Fixed order after Add to Bag: emotional description → THE GARMENT → THE EMBROIDERY → fit/size → care → shipping/returns.
- Flat/static sections (`<section>` + `<h2>`, matching `key-product.html`'s `.section`) — no accordion.
- THE EMBROIDERY + emotional description depend on selected motif; THE GARMENT depends on selected garment type. Omit a section only when its dependency is unselected; fit/size, care, shipping/returns always render.
- **Decided:** THE GARMENT copy — write a TODO-flagged placeholder blurb for all 4 garment types (not just Crewneck Sweatshirt, which has the real mockup text), per the About-page precedent (`spec-1-4-about-page.md`).
- **Decided:** Emotional description + THE EMBROIDERY copy — write a short TODO-flagged placeholder emotional-description line for all 13 motifs (only Water Tower has reference narrative); THE EMBROIDERY stays the reusable template line derived from `motif.name`.
- **Decided:** Fit/size, care, shipping/returns — one shared TODO-flagged placeholder block per section (not per-garment), per the About-page "processing time" precedent.
- Every placeholder sentence carries a `{/* TODO: unconfirmed placeholder */}` comment in source, flagging it for replacement before launch, while reading naturally to a visitor.
- New sections stay inside `ProductPickerShell` (same Client Component) — they need live selected-motif/garment-type state.

**Never:**
- Never add Squarespace calls, per-size inventory, or a `[sku]` route — still gated on Epic 2.
- Never present placeholder facts (measurements, fabric composition, delivery windows) as final beyond the TODO comment marking them provisional.
- Never make these sections an accordion/collapsible widget.
- Never touch the sticky Add-to-Bag bar's a11y handling — that fix is deferred separately (see `deferred-work.md`), out of scope here.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Garment + motif selected | Full combination chosen | All 5 sections render, personalized to selection | N/A |
| Garment-first, no motif | Type/color chosen only | THE GARMENT + fit/care/shipping render; THE EMBROIDERY/description omitted | N/A |
| Motif-first, no garment | Motif chosen only | THE EMBROIDERY + description render; THE GARMENT omitted; fit/care/shipping still render | N/A |
| Tab order | Any selection state | images → selection controls → Add to Bag → detail sections | N/A |

</frozen-after-approval>

## Code Map

- `components/product-picker-shell.tsx` -- insert 5 sections after Add to Bag/`ButtonSecondary`, before `<AddToBagBar>`; read `garmentType.garmentBlurb` / `motif.emotionalDescription`.
- `lib/placeholder-shop-data.ts` -- add `garmentBlurb: string` to `GarmentType`; fill all 4 entries (TODO-flagged placeholder copy, Crewneck Sweatshirt can reuse `key-product.html`'s real text verbatim).
- `lib/placeholder-motif-data.ts` -- add `emotionalDescription: string` to `Motif`; fill all 13 entries (TODO-flagged, Water Tower reuses `key-product.html`'s real text verbatim). THE EMBROIDERY stays a computed template in the shell, not a stored field.
- `.../mockups/key-product.html` -- reference only (`.section`/`.desc`, lines 81-137); don't modify.
- `spec-1-4-about-page.md` -- reference only, TODO-placeholder-copy precedent (line 26).
- Don't touch the two route files (already just render `ProductPickerShell`) or `motif-tile.tsx`/`garment-swatch.tsx`/`add-to-bag-bar.tsx` (Story 3.3's units, out of scope).

## Tasks & Acceptance

**Execution:**
- [x] `lib/placeholder-shop-data.ts` -- add `garmentBlurb` + copy for all 4 garment types
- [x] `lib/placeholder-motif-data.ts` -- add `emotionalDescription` + copy for all 13 motifs
- [x] `components/product-picker-shell.tsx` -- add 5 sections in fixed order after Add to Bag -- FR12/AC content sequence

**Acceptance Criteria:**
- Given any selection state, when the Product surface renders, content appears in the fixed order (images → name/price → selectors → Add to Bag → description → THE GARMENT → THE EMBROIDERY → fit/size → care → shipping/returns), omitting only motif-/garment-dependent sections when that selection is absent.
- Given a screen-reader user, tab order follows images → selection controls → Add to Bag → detail sections.
- Given motif/swatch/preview images, each still carries story-cue alt text (unchanged from Story 3.3).
- Given any placeholder section, the visible copy reads as a finished sentence while its source carries a TODO comment marking it provisional.

## Implementation Notes

- `lib/placeholder-shop-data.ts`: added `garmentBlurb: string` to `GarmentType` and filled all 4 entries. Crewneck Sweatshirt reuses `key-product.html`'s real THE GARMENT paragraph verbatim (`// Real reference copy, reused verbatim...` comment, no TODO). Heavyweight Tee, Lightweight Crewneck, and Long Sleeve Tee each get a short `// TODO: unconfirmed placeholder` blurb in the same voice, ending on the same "pending final spec sheet" phrase as the real Crewneck copy.
- `lib/placeholder-motif-data.ts`: added `emotionalDescription: string` to `Motif` and filled all 13 entries. SIC Water Tower reuses `key-product.html`'s real narrative verbatim (no TODO). The other 12 motifs get a short `// TODO: unconfirmed placeholder` line each, written to read as a finished sentence. THE EMBROIDERY was deliberately *not* added as a stored field — it stays a computed template string in the shell (`${motif.name} — one motif from the Sea Isle collection. Stitched in navy thread, part of the "PLACE → STORY → MOTIF → OBJECT" line.`), per the spec's Decided note.
- `components/product-picker-shell.tsx`: inserted a new `<div className="divide-y divide-line border-t border-line">` block after the two-column grid (images/selectors/Add to Bag/Back button) and before `<AddToBagBar>`, containing 5 flat `<section>` blocks in fixed order: emotional description (motif-gated) → THE GARMENT (garmentType-gated) → THE EMBROIDERY (motif-gated) → Fit & Size (always) → Care (always) → Shipping & Returns (always). Each of the 3 shared sections' copy is a literal JSX-authored placeholder with an inline `{/* TODO: unconfirmed placeholder */}` comment directly above it, mirroring the About-page precedent exactly since that copy lives directly in the `.tsx` file rather than a data file. `<h2>` headings use `font-mono text-label-mono uppercase text-antique-brass` (matches `key-product.html`'s `.section h2` color/style, `#A8823C` = the existing `--color-antique-brass` token); paragraph copy uses `font-body text-body-sm` (matches the existing pattern already in this file/`email-signup-form.tsx`). No accordion/collapsible behavior — plain static sections, no `useState`/interactivity added for them.
- Tab order: the new sections contain no focusable elements (plain `<h2>`/`<p>` text only), so they add nothing to the tab sequence; DOM order (images → selectors → Add to Bag → detail sections) is preserved by construction since the block is inserted after the Add-to-Bag/Back-button column and before the sticky `<AddToBagBar>`.
- Did not touch the route files, `motif-tile.tsx`, `garment-swatch.tsx`, or `add-to-bag-bar.tsx`. Did not touch the sticky Add-to-Bag bar's a11y handling (deferred separately per `deferred-work.md`). No Squarespace calls, per-size inventory, or `[sku]` route added.
- Verified via built output: `curl`'d the running `next start` server for both manual-check routes. `/shop/crewneck-sweatshirt/pepper` (garment-first, no motif selected) renders THE GARMENT + Fit & Size/Care/Shipping & Returns, and omits the emotional description/THE EMBROIDERY. `/collections/sea-isle/sic-water-tower` (motif-first, no garment selected) renders the emotional description + THE EMBROIDERY + Fit & Size/Care/Shipping & Returns, and omits THE GARMENT — matching the I/O matrix exactly.
- Matrix Test Audit: no row has an automated covering test — this repo has no test framework at all (pre-existing, project-wide gap; every prior Epic 1/3 spec logs the same, e.g. `spec-3-3-product-picker-live-preview.md`). Not introduced by this story. Coverage instead: rows 1-3 (garment+motif / garment-first / motif-first) verified via the `curl` checks above; row 4 (tab order) verified by code inspection — the new sections add zero focusable elements, so DOM insertion order after Add to Bag is sufficient by construction.

## Spec Change Log

## Review Triage Log

- **THE EMBROIDERY's computed template silently drops `: a specific landmark, remembered.` from `key-product.html`'s "reused verbatim" reference text, with no comment documenting the deliberate generalization** (blind-hunter) — verdict `low`. Confirmed at `components/product-picker-shell.tsx:358-361`: the template ends after `...line."`, omitting the reference copy's closing clause. Reasonable once reused across non-landmark motifs (Pickleball, Turtle), but undocumented as intentional — reads as an accidental truncation. Fix is a trivial one-line comment. Route: `patch`.
- **The 5 new detail sections don't follow this file's established `id`+`aria-labelledby` landmark pattern (Color/Size/Design/Garment Type all have it), and the emotional-description section has no heading at all** (blind-hunter, two findings/one root cause) — verdict `medium`. Confirmed: `product-picker-shell.tsx:338-397`'s new `<h2>`s have no `id`, sections have no `aria-labelledby`, unlike `colorHeadingId`/`sizeHeadingId`/`motifHeadingId`/`garmentTypeHeadingId` earlier in the same file; the description section (`:338-342`) has no `<h2>` at all. Real landmark-navigation gap for screen-reader users on a story titled "...& Accessibility." Fix is mechanical (mirror the existing pattern; add an `sr-only` heading for description). Route: `patch`.
- **Inconsistent placeholder phrasing: `lib/placeholder-shop-data.ts`'s garment blurbs end "...pending final spec sheet." but the new Care section says "...pending the final spec sheet."** (blind-hunter) — verdict `low`. Confirmed at `lib/placeholder-shop-data.ts` (3 entries) vs `product-picker-shell.tsx:382-383`; both render on the same page for 3 of 4 garment types. Trivial word-level fix. Route: `patch`.
- **`generateMetadata` in both route files still ships thin, generic descriptions instead of the new richer `garmentBlurb`/`emotionalDescription` copy** (blind-hunter) — verdict: real opportunity, but pre-existing (both `generateMetadata` functions predate this diff and are unchanged by it) and outside this story's intent (visible content order, not `<meta>` tags). Route: `defer`.
- **Sticky-bar a11y issue (deferred to `deferred-work.md` by this story) has "no owner or trigger for follow-up," having now been logged twice** (blind-hunter) — verdict `false`. Refuted: `deferred-work.md` is this project's established mechanism for exactly this, and no other entry in the file (checked in full) carries an "owner/trigger" field either — nothing is actually missing relative to convention.
- **Fit & Size / Shipping & Returns placeholders have no `deferred-work.md` entry, unlike the sticky-bar issue** (blind-hunter) — verdict `false`. Refuted: confirmed via `grep` that `spec-1-4-about-page.md`'s processing-time placeholder (the exact precedent this story follows) also has no `deferred-work.md` entry — the inline TODO comment is this project's established, sufficient tracking mechanism for placeholder business copy; `deferred-work.md` is used for code-level defects, a different category.
- **Edge case: seed resolves to no known `garmentType`/`motif` (stale/invalid deep link), leaving both undefined with no indication the selection failed to resolve** (edge-case-hunter) — verdict `false`. Refuted: both `app/(site)/shop/[type]/[color]/page.tsx` and `app/(site)/collections/[slug]/[motif]/page.tsx` call `notFound()` before ever rendering `ProductPickerShell` when their route param doesn't resolve, and no UI path can null out an already-set selection — the described state is unreachable.
- **Spec claims "five static sections" while the code renders six `<section>` elements** (edge-case-hunter, claim check) — verdict `low`, rejected. The only fix is editing this spec's wording (Intent/Code Map/Tasks miscounted the epic's 6 named content pieces as 5); code is correct. Rejected per "never edit the spec to fix a finding."
- **Verification claim overstates coverage: the spec's Matrix Test Audit says rows 1-3 were "curl-verified," but the two curl checks are both single-kind-seeded routes and can never produce the row-1 combined `motif && garmentType` state** (verification-gap) — verdict `low`, rejected. Confirmed the claim is imprecise, but the underlying risk it worries about (section order breaking specifically in the combined state) is structurally impossible: order comes from fixed JSX position, and each section is independently gated by its own condition, not by a separate "combined" branch — the same order guarantee holds in every state exercised by the actual curl checks. Only fix is a spec wording correction. Rejected per "never edit the spec to fix a finding."

## Verification

**Commands:**
- `npx tsc --noEmit` -- no type errors
- `npm run lint` -- no errors
- `npm run build` -- all routes prerender

**Manual checks (if no CLI):**
- Load `/shop/crewneck-sweatshirt/pepper` and `/collections/sea-isle/sic-water-tower` at mobile (~390px) and desktop: all 5 sections render in order and personalize correctly for both entry paths.
