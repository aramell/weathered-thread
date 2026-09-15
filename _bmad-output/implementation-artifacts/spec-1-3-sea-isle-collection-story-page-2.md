---
title: 'Sea Isle Collection Story Page — Motif Name Correction'
type: 'feature'
created: '2026-09-15'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
baseline_commit: 'db05388234fb59ddf19d52c63e627e50ab1a8267'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The shipped Sea Isle Collection Story page (`app/(site)/collections/[slug]/page.tsx`, Story 1.3) still shows the original 13 motif names. Those names are superseded by the corrected list approved in `sprint-change-proposal-2026-09-15.md` and already reflected in `epics.md`'s Story 1.3 AC and `epic-1-context.md` — it drops "Nautical Map – Fish Alley" and splits the single generic "Boat" into two distinct boat/shoreline motifs.

**Approach:** Replace the 13 entries in the hardcoded `motifs` array in `app/(site)/collections/[slug]/page.tsx` with the corrected names, in the order given by the approved AC: Sea Isle City Waves, Pickleball, Beach Chair, Seagull, Bicycle, Turtle, Life Preserver / N.J., Exit 17 / Sea Isle City, Sea Isle shoreline / sailboat, SIC Water Tower, Sea Isle Boat, Lobster Loft, Smile You're in Sea Isle. No structural, component, or styling changes — `motif-tile.tsx` and `collection-story-block.tsx` are untouched; only the `name` values (and their count, still 13) change.

</frozen-after-approval>

## Implementation Notes

- Replaced the 13 `motifs` entries in `app/(site)/collections/[slug]/page.tsx` with the corrected names, in the approved AC order. Count stays 13; no other part of the array (slug, eyebrow, heading, story copy) or any other file changed.
- Left the `collection-story-block` prose copy ("A water tower on the skyline, a life ring at the marina, the exit you take...") untouched — the approved change (Technical Impact §, sprint-change-proposal-2026-09-15.md) scopes the rework to the `motifs` array only, not the narrative copy.
- `motif-tile.tsx` takes only a `name` string prop and needed no changes.
- Verified: `npm run lint` (no errors) and `npm run build` (compiles, prerenders `/collections/sea-isle` statically, no type errors).

## Review Triage Log

- **Cross-Story Dependencies bullet on `subscribeEmail`/AD-6 appears dropped from the regenerated `epic-1-context.md`** — `false`. The substance is preserved verbatim in the new Technical Decisions section ("Every email-capture entry point posts to exactly one Server Action, `subscribeEmail`... never a route handler or second implementation"); only the `AD-6` citation was dropped, which matches `compile-epic-context.md`'s own "describe by purpose, not by source" rule.
- **`product-card`'s cross-epic reuse note (Epic 3's Shop surface will also use it) dropped from the regenerated `epic-1-context.md`** — `low` / `patch`. Confirmed genuinely absent from both Technical Decisions and UX & Interaction Patterns in the new file; `components/product-card.tsx` exists, so the note is real and useful. Fixed: restored a one-line Cross-Story Dependencies bullet.
- **`collection-story-block` narrative prose still references pre-correction motif phrasing ("life ring," "the exit")** — `low` / `defer`. Real, but out of this story's approved scope — `sprint-change-proposal-2026-09-15.md`'s Technical Impact section scopes the rework to the `motifs` array only, not narrative copy; rewriting brand-voice prose needs its own sign-off. Logged to `deferred-work.md`.
- **Corrected motif captions mix casing conventions (Title Case vs. "SIC" initialism vs. lowercase "shoreline/sailboat")** — `low` / `defer`. Verified these are the exact strings approved in the proposal/`epics.md` AC, not an implementation choice; normalizing them would mean altering brand-approved copy without sign-off. Logged to `deferred-work.md`.
- **Spec `status` still `in-progress` while Implementation Notes describe finished, verified work** — `false`. Expected mid-workflow state; resolved by this same Finalize step setting `status: done`.
- **Longer motif captions ("Life Preserver / N.J.", "Exit 17 / Sea Isle City", "Sea Isle shoreline / sailboat") may wrap awkwardly in the `grid-cols-2` mobile gallery** — `false`. `motif-tile.tsx`'s caption `<p>` has no `whitespace-nowrap`, `truncate`, or fixed width — it wraps normally at any name length within the tile; no horizontal-scroll risk.
- **`DESIGN.md`'s `motif-tile` example still cites "Water Tower"** — `low`, rejected. An illustrative example in a UX doc, not an authoritative motif-name source (`epics.md` is); not in the sprint-change-proposal's approved diff list, so out of scope to edit unprompted.
- **`epic-1-context.md` documents not-yet-built target state (product philosophy/lifestyle imagery sections, Libre Franklin) without an in-file "pending" flag** — `false`. This doc's job is to state the epic's requirements/target state, not the current shipped state; the gap is intentional and already tracked by the sprint-change-proposal's own handoff plan (Story 1.1 reopens separately to build it).

