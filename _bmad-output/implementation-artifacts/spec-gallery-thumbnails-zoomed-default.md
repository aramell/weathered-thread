---
title: 'Gallery thumbnail strip and zoomed-design default photo'
type: 'feature'
created: '2026-10-27'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The product picker's hero gallery has only prev/next buttons, so a shopper cannot see or jump to the other photos, and choosing a design lands on the first Etsy photo rather than the zoomed-in view of the design (usually Etsy's second photo).

**Approach:** Add a thumbnail strip directly below the hero photo (one thumbnail per slide, including the garment preview), and make the hero open on the design's second photo when a design is chosen or arrived with (first photo when there is only one).

</frozen-after-approval>

## Implementation Notes

- `lib/picker-gallery.ts` gains `defaultPhotoIndex(imageCount)`; `components/product-picker-shell.tsx` uses it for the initial index and on design pick; `components/picker-gallery.tsx` renders the strip (`aria-current`, 44px targets, active thumbnail scrolled into view).

## Review Triage Log

- high: caption class typo `mt-2font-mono` — real; fixed.
- medium: duplicate "Photo N of M" label on hero slides and thumbnail buttons — real; thumbnails now say "Show photo N of M".
- low: reduced-motion for strip scroll — fixed (instant when reduced).
- low: strip lacked `relative` for `offsetLeft` math — fixed.
- false: 56px vs "44px" — 56px exceeds the 44px minimum.
- false: stale gallery index on other motif paths — design pick is the only place `motifSlug` changes after mount.
- false: eager thumbnail loading — `next/image` lazy-loads by default.
- rejected low: active-thumbnail contrast (ring plus `aria-current`); strip component tests (repo has no component harness).
