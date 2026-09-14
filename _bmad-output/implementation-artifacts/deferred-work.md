- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page.md`
  summary: No automated test framework exists in this repo, so nothing verifies the homepage's `/collections/sea-isle` link keeps resolving (rather than 404ing) if the hardcoded slug strings on either side ever drift, and no test accompanies the new route or `MotifTile` component.
  evidence: Repo-wide search finds no test files, no jest/vitest/playwright dependency, and no test script in package.json; standing up test infrastructure is bigger than this story's scope.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page.md`
  summary: The Sea Isle story paragraph is duplicated verbatim between the homepage teaser (`app/(site)/page.tsx`, Story 1.1) and the new Collection Story page, with no shared source — the two can drift out of sync on future edits.
  evidence: Confirmed byte-for-byte duplicate; accepted for now as a consequence of this story's spec-directed "hardcode inline" approach (matching Story 1.1's `shopItems` precedent) ahead of Epic 2's real content pipeline, which will replace hardcoded data entirely.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page.md`
  summary: `motif-tile` has no stable `slug`/`id` — only the display name — so Epic 3's picker will need to define how a tile links to picker state beyond string-matching the name.
  evidence: Confirmed `motif.name` is the sole identifier used as both label and React key; out of this story's scope since tap-to-select/picker wiring is explicitly Epic 3's, but worth deciding before that story starts.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page.md`
  summary: `nav-header`'s "Collections" link points to `/collections`, which 404s — there is no `app/(site)/collections/page.tsx` (an index of all collections).
  evidence: Confirmed via route listing; pre-existing from Story 1.2, not caused by this story, surfaced while tracing this route's consumers.
