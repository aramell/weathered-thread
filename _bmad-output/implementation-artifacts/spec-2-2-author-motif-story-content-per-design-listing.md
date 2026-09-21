---
title: 'Author Motif & Story Content Per Design Listing'
type: 'feature'
created: '2026-09-21'
status: 'done'
baseline_commit: '9cbf216c717404d6f4dd8a419ea1f6674b2eee8f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Story 2.1 produces `content/catalog/{listing}/synced.ts`, but nowhere to author the motif name, place/story copy and collection grouping the Etsy listing lacks, and nothing merges the two into the single object the rest of the app will import.

**Approach:** Define the authored-content shape and the per-listing `authored.ts` + `index.ts` (merge) convention, document it with copy-paste templates, and add a `check:catalog` command that verifies every listing directory follows it. No visitor-facing UI.

## Boundaries & Constraints

**Always:**
- Per listing directory `content/catalog/{slug}/`: `synced.ts` (sync-owned), `authored.ts` (human-owned), `index.ts` (human-owned, ~3 lines). `{slug}` is the manifest slug from Story 2.1, matching `^[a-z0-9-]+$`.
- `authored.ts` exports `authored` with exactly `motifName`, `story` (one string), `collection` (a collection slug, e.g. `sea-isle`), typed by `AuthoredContent` in `content/catalog/types.ts` via `satisfies`, so tsc flags a missing or misspelled field.
- `index.ts` exports `listing = { ...synced, ...authored }`. Authored keys must never collide with synced keys (`listingId`, `name`, `url`, `state`, `priceCents`, `quantity`): `motifName` is deliberately not `name`, so the merge shadows nothing. Which of the two names the site displays is left to the consumer, decided when Epic 3 wires it.
- `check:catalog` fails (exit 1, names the directory and problem) on: a directory name that fails the slug pattern; a missing `synced.ts`, `authored.ts` or `index.ts`; an empty/whitespace `motifName`, `story` or `collection`, or a `collection` failing the slug pattern; an `index.ts` `listing` that is not deep-equal to the merge or that shares a key between the two. A catalog with no listing directories passes with a note.
- The sync script's guarantee that `authored.ts` is never read, written or created already holds and is covered by `scripts/sync-etsy.test.ts`.

**Never:**
- No change to `scripts/sync-etsy.ts`, `content/catalog/listings.json` or `package.json`'s `build` script; nothing under `app/` or `components/` imports `content/catalog/` yet.
- No seeded listing directories: `synced.ts` may only be written by the sync, and no live listing exists yet (`listings.json` is `{}`), so the owner authors real listings after their first sync. Do not import or copy `lib/placeholder-*.ts`.
- No image fields (`motifIcon` etc.), no collection registry, no display-name decision.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid listing | all three files present, fields filled, `index.ts` merges both | Reported ok | N/A |
| Empty catalog | no listing directories | Exit 0, "no listings yet" | N/A |
| Synced, not yet authored | only `synced.ts` | Reported as needing `authored.ts` and `index.ts` | Exit 1 |
| Missing `index.ts` | `synced.ts` + `authored.ts` | Reported | Exit 1 |
| Blank field | `story` is `"  "` | Reported, names the field | Exit 1 |
| Key collision | authored exports a synced key | Reported, names the key | Exit 1 |
| Wrong merge | `index.ts` exports `synced` only | Reported | Exit 1 |
| Bad names | directory `Sea_Isle`; `collection: "Sea Isle"` | Reported | Exit 1 |

</frozen-after-approval>

## Code Map

- `scripts/sync-etsy.ts:28` -- `SyncedListing` (`listingId, name, url, state, priceCents, quantity`); `renderSynced` emits `export const synced = {...} as const;`. `SLUG_PATTERN` is not exported: re-declare it, do not edit the script.
- `scripts/sync-etsy.test.ts` -- pattern to copy: `node:test`, temp-dir fixtures, `afterEach` cleanup. Line 105 already asserts `authored.ts` stays untouched.
- `package.json` -- `sync:etsy` and `test:sync` show the `tsx` convention; add `check:catalog` and `test:catalog`.
- `content/catalog/` -- only `listings.json` (`{}`) today.
- `app/(site)/collections/[slug]/page.tsx:15` -- collections are identified by slug (`sea-isle`), defined inline in the page; hence `collection` is a slug string, validated by pattern only.
- `lib/placeholder-motif-data.ts` -- its `emotionalDescription` (single string) is what `story` will eventually replace; do not touch it.
- `tsconfig.json` -- `**/*.ts` included, so `content/` and `scripts/` are type-checked; `import type` only from `content/catalog/types.ts`.

## Tasks & Acceptance

**Execution:**
- [x] `content/catalog/types.ts` -- export `AuthoredContent` (`motifName`, `story`, `collection`, all `string`) -- the one authored shape
- [x] `scripts/check-catalog.ts` -- export `checkCatalog(catalogDir)` returning per-directory problems; CLI prints them and sets the exit code; dynamic-imports each `index.ts`, `synced.ts`, `authored.ts` -- proves the merge, not just file presence
- [x] `scripts/check-catalog.test.ts` -- one temp-dir fixture per matrix row -- verifies every row without touching the real catalog
- [x] `content/catalog/README.md` -- three-file layout, the `authored.ts`/`index.ts` templates, the sync → author → `npm run check:catalog` workflow -- how the owner creates a listing
- [x] `package.json` -- add `"check:catalog": "tsx scripts/check-catalog.ts"` and `"test:catalog": "tsx --test scripts/check-catalog.test.ts"` -- standalone commands

**Acceptance Criteria:**
- Given a directory with `synced.ts`, `authored.ts` and `index.ts` written from the README templates, when `npm run check:catalog` runs, then it passes and `listing` holds every synced and authored field
- Given `authored.ts` with content, when `npm run sync:etsy` overwrites `synced.ts`, then `authored.ts` is unchanged (the sync test at `scripts/sync-etsy.test.ts:105`)
- Given `package.json`, then `build` references neither script

## Implementation Notes

- Built directly (no subagent). `check-catalog.ts` dynamic-imports each listing's modules via `pathToFileURL` (works under `tsx` for temp-dir fixtures); a key collision skips the deep-equal check so the collision is the single reported problem.
- Verified beyond the tests: the README templates were run end-to-end in a throwaway listing directory (tsc clean, `check:catalog` ok) and a misspelled `authored.ts` field (`motifNam`) was rejected by tsc via `satisfies`. The directory was removed afterward.
- Test runs after review patches: `test:catalog` 15/15 (8 matrix rows, 2 load-failure, 4 CLI exit-code, 1 build-isolation), `test:sync` 14/14, `tsc --noEmit` and `lint` clean, `check:catalog` exits 0 with "no listings yet".
- Review patches applied directly (see Review Triage Log): CLI and load-failure tests, `main()` error handling, exhaustive `AUTHORED_FIELDS`, `renderSynced`-based fixture, README `tsc` note, restored epic-context blockers.

## Spec Change Log

## Review Triage Log

Three layers ran (blind hunter, edge-case hunter, verification-gap). Layers: BH, EC, VG.

| # | Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|---|
| 1 | CLI entry, exit codes and "no listings yet" output are untested (VG, EC, BH) | medium | patch | Every test called `checkCatalog` directly; deleting `process.exitCode = 1` left 8/8 green. Added four CLI tests that spawn the script. |
| 2 | Load-failure and wrong-export paths in `loadExport` untested (VG, EC) | medium | patch | No fixture threw on import or renamed `listing`. Added two fixtures. |
| 3 | `readdir` ENOENT and rejection inside `main()` give a raw stack trace (EC, BH) | low | patch | Reachable by running from a directory without `content/catalog`. `main()` now prints a clear message and exits 1; test added. |
| 4 | Build-isolation test only checks the `sync-etsy` substring, so `prebuild: check:catalog` would pass (VG) | medium | patch | Verified `sync-etsy.test.ts:285-294` matches only `sync-etsy`. Added a `build`/`prebuild`/`postbuild` test for `check-catalog`/`check:catalog`. |
| 5 | `AUTHORED_FIELDS` duplicates `AuthoredContent`'s keys and can drift (BH) | low | patch | A field added to the type was not enforced. Now built from a `satisfies Record<keyof AuthoredContent, true>` object, so tsc fails on drift. |
| 6 | README step 4 omits `tsc`; extra or misspelled authored keys pass `check:catalog` (BH, EC) | low | patch | `check:catalog` runs under `tsx` and does not type-check; only `satisfies` under tsc flags an extra key. Documented in README step 4. A runtime unknown-key check was not added: low, and the fix adds a branch. |
| 7 | Test fixture `synced.ts` is hand-written, not the sync's real output (VG) | low | patch | The checker depends on the sync's `export const synced =` shape. The fixture now comes from `renderSynced`. |
| 8 | `epic-2-context.md` recompile dropped open blockers, sync invariants and the decided join key (BH, EC) | medium | patch | Verified against the diff: the OAuth limit, Etsy Terms, access tier, crew sizes, all-or-nothing, own-commit and build-isolation rules were gone, and the join key still read as undecided. Restored compactly. |
| 9 | `collection` typos pass because it is checked by pattern only (BH) | low | defer | The frozen block rules out a collection registry and collections live inline in a page. Logged in `deferred-work.md`. |
| 10 | Catalog is not compared to `listings.json` (BH, EC) | low | rejected | Intent covers "every listing directory". A never-synced listing has no directory and is visibly absent. The fix adds a manifest parse and new branches. |
| 11 | `key in synced` walks the prototype chain (EC) | low | rejected | `authored` has exactly three fixed fields, so no inherited name can appear. Negligible. |
| 12 | Authored key could shadow a synced key the file lacks (EC) | low | rejected | `synced.ts` is fully generated with all six keys. A hand-trimmed file is an unsupported edit. |
| 13 | Early return hides further problems per run (BH, EC) | low | rejected | Cosmetic. The fix restructures `checkListing`. |
| 14 | Symlinked listing directories skipped (EC) | low | rejected | Nothing in the workflow creates symlinks. |
| 15 | Dynamic `import()` cache stale on repeat calls (EC) | false | rejected | The CLI is one-shot; tests use a fresh temp directory per test. |
| 16 | CLI guard is silent if the script is invoked under another name (BH, EC) | low | rejected | Same convention as `scripts/sync-etsy.ts`. `npm run check:catalog` invokes it by name, and the CLI tests now prove it. |
| 17 | `SLUG_PATTERN` is re-declared instead of shared (BH) | low | rejected | The fix is to edit `scripts/sync-etsy.ts`, which the spec forbids. |
| 18 | `synced.ts` values are not sanity-checked (BH) | false | rejected | The sync validates URL host, currency and price before writing. The checker is about structure. |
| 19 | Lifecycle guidance (slug rename or retire), apostrophe or line-break advice, `as const` no-op, pinned line numbers, more ACs, empty logs (BH) | low | rejected | Documentation preferences with no failing scenario, or fixes that edit this spec. |
| 20 | Nothing runs `test:catalog` or `test:sync` automatically (VG) | low | rejected | Pre-existing and project-wide (the spine defers a testing strategy). Not caused by this change. |

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no type errors
- `npm run lint` -- expected: passes
- `npm run test:catalog` -- expected: every matrix row passes
- `npm run test:sync` -- expected: still passes
- `npm run check:catalog` -- expected: exit 0, "no listings yet"
