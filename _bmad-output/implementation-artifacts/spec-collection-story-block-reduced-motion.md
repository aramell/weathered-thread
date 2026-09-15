---
title: 'Respect prefers-reduced-motion in Collection Story Block'
type: 'bugfix'
created: '2026-09-15'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `components/collection-story-block.tsx`'s scroll-triggered fade-reveal always animates opacity over 700ms (`transition-opacity duration-700 ease-out`), with no `prefers-reduced-motion` check — visitors who've opted out of motion still get the animation. Flagged in `_bmad-output/implementation-artifacts/deferred-work.md` during Story 1.2's review.

**Approach:** Use Tailwind's built-in `motion-reduce:` variant to remove the transition duration when the user has `prefers-reduced-motion: reduce` set, so the section still reveals on scroll (same logic, untouched) but without an animated opacity ramp. No change to the scroll/IntersectionObserver reveal logic itself — only the CSS transition is motion-gated.

</frozen-after-approval>

## Implementation Notes

- Added `motion-reduce:transition-none` to `components/collection-story-block.tsx`'s section `className` (alongside the existing `transition-opacity duration-700 ease-out`). Reveal logic (scroll/IntersectionObserver) untouched — only the CSS transition is motion-gated.
- Verified: `npm run lint` passes, `npm run build` succeeds with no new errors. Confirmed via the dev server's compiled CSS output that Tailwind v4 generates `@media (prefers-reduced-motion: reduce) { .motion-reduce\:transition-none { transition-property: none; } }` — the section still reveals (opacity 0→100) but instantly under reduced motion, and unchanged (700ms ease-out) otherwise. No visual regression to the normal-motion path since only `transition-property` is gated, not the base transition declaration.

## Review Triage Log

- **Blind Hunter, "uncommitted `app/(site)/page.tsx` hero edit contradicts spec-1-1-2 / duplicates About's `<h1>` / drops the sitewide eyebrow pattern"** — verdict: `medium`, real, but not caused by this story (pre-existing uncommitted edit the site owner asked to leave alone). Deferred: see `deferred-work.md`.
- **Blind Hunter, "spec status still `in-progress` despite Implementation Notes being complete"** — verdict: `false`. Workflow ordering: Finalize Spec (which sets `status: done`) runs after Classify; this log entry and the status flip are that step.
- **Blind Hunter, "`epic-2-context.md` states the price-regression mechanic as settled fact while `spec-2-1`'s Open Questions treat it as unresolved"** — verdict: `low`, real, simple fix. Patched: reworded `epic-2-context.md`'s Technical Decisions bullet to say the exact mechanic is a per-story decision, not fixed.
- **Blind Hunter, "`spec-2-1`'s regression check only covers `price`, not inventory-zero/name/URL changes"** — verdict: `low`/`medium` if true, real gap, but Story 2.1 is blocked (Squarespace commerce not yet configured) and unapproved. Deferred: see `deferred-work.md`.
- **Blind Hunter, "`spec-2-1` has two unresolved Open Questions with no owner/deadline"** — verdict: `false`. This is the intended `draft` state per the workflow until a human answers; the underlying blocker is already recorded in project memory (`squarespace_not_configured.md`).
