---
title: 'Homepage — Hero Eyebrow Restoration'
type: 'bugfix'
created: '2026-09-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** An uncommitted edit to `app/(site)/page.tsx`'s hero section removed the eyebrow label above the `<h1>` and replaced the `<h1>` text with what was previously the eyebrow's copy ("Made to Remember. Stitched in."). This makes Home's `<h1>` byte-for-byte identical to About's `<h1>` (`app/(site)/about/page.tsx:30`), and leaves Home as the only section on the site (About, Sea Isle's `CollectionStoryBlock`) with no eyebrow above its heading.

**Approach:** Keep the new `<h1>` text ("Made to Remember. Stitched in.") as the site owner intends. Restore an eyebrow `<p>` above it, using the same markup/classes as About's eyebrow (`mb-4 font-mono text-label-mono uppercase text-marsh-sage`), with the text "Weathered Thread" (site owner's choice, distinct from the removed eyebrow's old copy). No other homepage content changes.

</frozen-after-approval>

## Implementation Notes

- `app/(site)/page.tsx`: restored the eyebrow `<p>` above the hero `<h1>`, using the exact markup/classes as About's eyebrow (`mb-4 font-mono text-label-mono uppercase text-marsh-sage`), with text "Weathered Thread". Left the `<h1>` ("Made to Remember. Stitched in.") and everything else in the hero/rest of the page untouched.
- Verified: `npm run lint` (no errors) and `npm run build` (compiles, all four routes prerender, no type errors).
- This spec renegotiates `spec-1-1-homepage-renders-with-brand-identity-2.md`'s frozen constraint to leave "every mono/label element (nav wordmark, nav links, eyebrows, prices, footer) untouched" — that constraint scoped a font migration, not this hero's copy; the site owner (this session's human) explicitly authorized restoring the eyebrow with new text, superseding it for this one element only. All other frozen mono/label elements remain untouched.
- Eyebrow copy "Weathered Thread" was chosen by the site owner from three options offered: "Weathered Thread", "Embroidered Apparel", "Est. for the towns worth remembering". Review flagged that it repeats the nav wordmark (`components/nav-header.tsx:24`) and root `<title>` (`app/layout.tsx:28`); deferred to `deferred-work.md` rather than changed unilaterally, since it's the human's explicit copy choice.
- `deferred-work.md` already tracks (from Story 1.3's review) that `CollectionStoryBlock`'s narrative paragraph is duplicated verbatim on this same page (`app/(site)/page.tsx`); that item remains open and out of this fix's scope.

## Review Triage Log

- **[defer]** (blind-hunter) Home's `<h1>` ("Made to Remember. Stitched in.") is now word-for-word identical to About's `<h1>` (`app/(site)/about/page.tsx:30`). Confirmed real; predates this fix (was already in the uncommitted edit before this session) and the site owner explicitly chose to keep the new `<h1>` text over reverting to spec. Logged to `deferred-work.md`.
- **[false]** (blind-hunter) Claimed About's `<h1>` reads "...Stitched In." (capital I) vs. Home's lowercase "in.", citing `spec-1-4-about-page.md:63`. Disproved: `grep -n "Stitched"` across `app/(site)/about/page.tsx`, `app/(site)/page.tsx`, and `app/layout.tsx` shows all three now read lowercase "in." — the capital-I mismatch spec-1-4 once flagged was already patched since that review was written.
- **[defer]** (blind-hunter) Eyebrow "Weathered Thread" duplicates the nav wordmark (`components/nav-header.tsx:24`) and appears a third time in the root `<title>` (`app/layout.tsx:28`), unlike every other eyebrow on the site which is section-specific. Confirmed real; it's the site owner's explicit copy choice from three options offered this session, not an oversight. Logged to `deferred-work.md`.
- **[patch]** (blind-hunter) Spec didn't acknowledge that restoring the eyebrow renegotiates `spec-1-1-2`'s frozen "eyebrows... untouched" constraint. Fixed: added a note in Implementation Notes explaining the renegotiation without editing the frozen block.
- **[patch]** (blind-hunter) No rationale recorded for choosing "Weathered Thread" over alternatives. Fixed: added a note in Implementation Notes recording the three options offered and the site owner's choice.
- **[false]** (blind-hunter) `status: 'in-progress'` looks stale relative to completed Implementation Notes. Expected at review time — this Finalize Spec step sets `status: 'done'`.
- **[patch]** (blind-hunter) No cross-reference to `deferred-work.md`'s existing entry about `CollectionStoryBlock`'s narrative duplication on this same page. Fixed: added a one-line cross-reference in Implementation Notes.
