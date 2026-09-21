---
title: 'Catalog Read Layer'
type: 'feature'
created: '2026-09-21'
status: 'done'
baseline_commit: '69425c794362f808a7e646f5f0cdd123e1c2100a'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Stories 2.1 and 2.2 produce merged `content/catalog/{slug}/index.ts` listings, but nothing aggregates them, so every page still reads `lib/placeholder-*.ts` and Story 4.2 has no server-only way to look up a listing's synced Etsy `url`.

**Approach:** Add a hand-maintained registry of the merged listings and one server-only module of typed accessors over it. No page is migrated, and registry drift is not yet checked (Story 2.4).

## Boundaries & Constraints

**Always:**
- `content/catalog/registry.ts` exports `registry`, a plain object keyed by manifest slug whose values are each directory's `listing` (static imports, no server-only). Adding a listing means adding one import and one key; the README says so.
- `lib/catalog.ts` starts with `import "server-only"` and exports `createCatalog(registry)` plus `getListings()`, `getListing(slug)`, `getListingsByCollection(collection)` bound to the real registry. Results are entries `{ slug, ...listing }`, sorted by slug. Unknown slug → `undefined`; unknown collection or empty registry → `[]`. Nothing throws.
- Entry type is `SyncedListing & AuthoredContent & { slug }`, reusing `SyncedListing` by `import type` from `scripts/sync-etsy.ts`; do not redeclare its fields.

**Never:**
- No change to `scripts/sync-etsy.ts`, `scripts/check-catalog.ts`, `content/catalog/{slug}/*`, or `package.json`'s `build` script.
- Nothing under `app/` or `components/` imports `lib/catalog.ts` or `registry.ts`, and `lib/placeholder-*.ts` is untouched; migrating pages is follow-up work.
- No seeded listings (`registry` stays `{}`, `listings.json` stays `{}`), no display-name decision, no image fields, no collection registry.
- No generated registry and no script that edits it.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Lookup hit | slug in registry | `{ slug, ...synced, ...authored }` | N/A |
| Lookup miss | unknown slug | `undefined` | N/A |
| List | registry with 2+ listings | all entries, sorted by slug | N/A |
| Empty registry | `{}` | `getListings()` and `getListingsByCollection(x)` return `[]` | N/A |
| By collection | `"sea-isle"` | only entries whose `collection` matches | unknown collection → `[]` |
| Client import | Client Component imports `lib/catalog.ts` | `next build` fails | build error |

</frozen-after-approval>

## Code Map

- `content/catalog/types.ts` -- `AuthoredContent`; add the exported `CatalogListing` / `CatalogEntry` types here.
- `scripts/sync-etsy.ts:28` -- `SyncedListing` (`listingId, name, url, state, priceCents, quantity`); type-import only.
- `content/catalog/README.md` -- layout and add-a-listing steps (step 3 creates `index.ts`, step 4 runs `check:catalog`); add `registry.ts` to the layout and a "register it" step, noting `check:catalog` does not verify the registry yet.
- `scripts/check-catalog.test.ts` -- pattern to copy for `node:test`; `package.json`'s `test:catalog` runs only this file today, and `server-only` is not a dependency yet.
- `lib/format-price.ts` -- example of the `lib/` module style.
- `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md:528` -- `server-only` guidance (installing is optional in Next, needed under `tsx`).

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- `npm install server-only`; extend `test:catalog` to also run `lib/catalog.test.ts` with `--conditions react-server` -- the marker resolves to an empty module under tests
- [x] `content/catalog/types.ts` -- export `CatalogListing` (`SyncedListing & AuthoredContent`) and `CatalogEntry` (`& { slug: string }`) -- one shared shape
- [x] `content/catalog/registry.ts` -- `export const registry = {} as const satisfies Record<string, CatalogListing>` with a comment on how to add a listing -- the app's single source list
- [x] `lib/catalog.ts` -- `createCatalog` and the three bound accessors per the frozen rules -- the read layer
- [x] `lib/catalog.test.ts` -- fixture-registry tests for every matrix row except the client import -- proves lookup, sort, collection filter, empties
- [x] `content/catalog/README.md` -- `registry.ts` in the layout plus the "register it" step -- owner workflow

**Acceptance Criteria:**
- Given the repo as committed, then `npx tsc --noEmit`, `npm run lint`, `npm run test:catalog`, `npm run test:sync` and `npm run check:catalog` pass, and `npm run build` succeeds with the still-empty registry
- Given a throwaway `"use client"` component that imports `lib/catalog.ts`, when `npm run build` runs, then it fails; the file is removed afterward
- Given `package.json`, then `build` references neither `sync-etsy` nor `check-catalog`

## Implementation Notes

- Built directly (no subagent, per the owner's choice). `tsx` honored `--conditions react-server` and the `@/` alias, so the Design Notes fallback (splitting `createCatalog` out of the marker file) was not needed.
- Verified beyond the tests: a throwaway listing built from the README templates (real `renderSynced` output) type-checked against `registry.ts`'s `satisfies`, `check:catalog` reported it ok, and the real `getListing` / `getListingsByCollection` returned it. A throwaway `"use client"` component importing `lib/catalog.ts` failed `next build` with the `server-only` error and an import trace naming it. Both throwaways and the registry edit were removed afterward.
- Runs: `test:catalog` 22/22 (15 existing + 7 accessor), `test:sync` 14/14, `tsc --noEmit` and `lint` clean, `check:catalog` exits 0 with "no listings yet", `build` succeeds with the empty registry.
- Matrix audit: every accessor row has a test that ran and passed; the client-import row is covered by the manual build check above (the spec's own AC), not an automated test.
- Review patches applied directly (see Review Triage Log): server-only guard child-process test, registry-independent bound-accessor test, frozen entries, manifest-slug precedence, doc/snippet fixes. Final runs: `test:catalog` 24/24, `test:sync` 14/14, `tsc`, lint, `check:catalog` and `build` clean.
- `server-only@^0.0.1` added to `dependencies` (package-lock updated). Not wired anywhere yet: nothing under `app/` or `components/` imports the catalog.

## Spec Change Log

## Review Triage Log

Three layers ran (blind hunter, edge-case hunter, verification-gap), as subagents. Layers: BH, EC, VG.

| # | Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|---|
| 1 | `server-only` guard is untested: tests run with `react-server`, so deleting the import left every test green (VG) | medium | patch | Reproduced by reading `package.json`'s `test:catalog`. Added a child-process test importing `lib/catalog.ts` without the condition; with the import removed it fails (mutation-checked). |
| 2 | Bound-accessor test asserts an empty registry, so it breaks on the first real listing and cannot detect miswiring (BH, EC, VG) | medium | patch | The test compared against `[]`/`undefined`. It now compares the bound exports with `createCatalog(committedRegistry)`, whatever is registered. |
| 3 | `{ slug, ...listing }` lets a `slug` field on a listing overwrite the manifest slug (BH, EC, VG) | low | patch | Order confirmed at `lib/catalog.ts`. Neither synced nor authored has such a field today; the fix is a one-line reorder. Test added. |
| 4 | Entries are shared references; the "copies" test only covers the array (BH, EC, VG) | low | patch | Confirmed: the test popped an array and never touched an entry. Entries are now `Object.freeze`d and the test asserts a write throws. |
| 5 | `server-only` covers `lib/catalog.ts` only: `registry.ts` or a `{slug}/index.ts` can be imported by a client file, and an entry can be passed as a prop, so the README/header overstate the `url` guarantee (BH, EC) | low | patch | Confirmed by reading the imports. The epic's AC is met (the catalog module fails the build); the overstatement is the fix. README, `registry.ts` and `lib/catalog.ts` headers now say the guard is per-module and forbid passing entries as props. A client-safe projection is deferred (see #6). |
| 6 | No client-safe entry type without `url`; `registry.ts` itself has no `server-only` (BH, EC) | low | defer | Real risk once pages migrate, since `components/product-picker-shell.tsx` is a Client Component. The fix adds public surface and the epic context already fixes the convention. Logged in `deferred-work.md`. |
| 7 | `test:catalog` runs `--conditions react-server` with no explanation (BH) | low | patch | Confirmed: bare `tsx --test lib/catalog.test.ts` throws on `server-only`. Header comment added to `lib/catalog.test.ts`. |
| 8 | README and `registry.ts` snippets omit `import type { CatalogListing }` (BH) | low | patch | Confirmed in both; copy-paste fails tsc. Import added to both. |
| 9 | `content/catalog/types.ts` imports `SyncedListing` from `scripts/sync-etsy` (BH) | low | rejected | The frozen block mandates that type import and forbids editing `sync-etsy.ts`, so the fix is to edit this build's spec. A rename fails `tsc` at once. |
| 10 | A listing missing from `registry.ts` is silently absent and no check flags it (VG, BH) | medium | rejected | Real, but the intent excludes it and names Story 2.4 (already in `epics.md` and `deferred-work.md`). |
| 11 | A registry key of `__proto__`, or a mistyped key, vanishes or becomes a wrong slug (EC, BH) | low | rejected | `__proto__` fails the slug pattern (`^[a-z0-9-]+$`) enforced by the sync and `check:catalog`. Key/manifest agreement is Story 2.4. |
| 12 | Duplicate `listingId` across slugs is unchecked (BH, EC) | low | rejected | A manifest-level rule, not the read layer's; the fix adds a branch. |
| 13 | Non-active or sold-out listings are returned unfiltered (BH, EC) | false | rejected | The read layer is raw by design: out-of-stock must render as disabled with microcopy (UX-DR17), so filtering here would remove that state. Status handling belongs to consumers and the deferred sync-semantics entry. |
| 14 | `getListing` is a linear `find`; use a `Map` (BH) | false | rejected | About 13 listings; no harm to name. |
| 15 | Accessors lack a way to enumerate collections (BH) | low | rejected | Intent lists exactly three accessors; the fix adds public surface. |
| 16 | Stale-registry failure modes and hard-coded "Story 2.4" references undocumented or brittle (BH) | low | rejected | A dead import fails `tsc` loudly; the Story 2.4 pointer is deliberate and easy to update. Documentation preferences. |
| 17 | `test:catalog` is a catch-all script and nothing runs it in CI (BH, VG) | low | rejected | Pre-existing and project-wide (2.2's review rejected the same). |

## Design Notes

`server-only` throws under plain Node, so `lib/catalog.test.ts` runs with `--conditions react-server` (the package's `react-server` export is empty). If `tsx` does not honor that flag, keep `createCatalog` and the types in a file without the marker and import the marker only from a thin `lib/catalog.ts`, so the logic stays testable.

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no type errors
- `npm run lint` -- expected: passes
- `npm run test:catalog` -- expected: existing tests and the new accessor tests pass
- `npm run test:sync` -- expected: still passes
- `npm run check:catalog` -- expected: exit 0, "no listings yet"
- `npm run build` -- expected: succeeds; fails while the throwaway Client Component exists
