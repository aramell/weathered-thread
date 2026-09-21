---
title: 'Catalog Registry Drift Check'
type: 'feature'
created: '2026-09-21'
status: 'done'
baseline_commit: '3c447a802a11bbdae1fb65e3713144ee9ec3f9c9'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `content/catalog/registry.ts` is hand-maintained, so a listing added to `listings.json` (or a directory) but not to the registry, or a registry entry that is not its directory's `index.ts` listing, silently goes missing from the site. `check:catalog` checks each directory in isolation and never looks at the manifest or the registry.

**Approach:** Extend `check:catalog` to load `listings.json` and the registry and report every disagreement, naming the slug. No new script, no generated registry.

## Boundaries & Constraints

**Always:**
- The checker reads the registry from `{catalogDir}/registry.ts` (export `registry`) and the manifest from `{catalogDir}/listings.json`, using the same dynamic-import pattern as the other files. `checkCatalog(catalogDir)` keeps its signature and report shape (`{ ok, problems }`); every drift line starts `{slug}: `.
- Compare three slug sets: manifest keys, registry keys, directories. A slug in one but not another is a problem for each gap. For a slug in both registry and directory, `registry[slug]` must be `isDeepStrictEqual` to that directory's `index.ts` `listing`.
- A slug is `ok` only if no check (existing or new) reported a problem for it. Empty manifest, empty registry and no directories still prints "no listings yet" and exits 0.
- An unreadable, non-JSON or non-object `listings.json`, or a `registry.ts` that is missing or does not export an object `registry`, is one reported problem (not a throw); comparisons that need it are skipped.

**Never:**
- No change to `scripts/sync-etsy.ts`, `lib/catalog.ts`, the `registry` value, `{slug}/*`, or `package.json`'s `build`, `prebuild` or `postbuild` scripts; `check:catalog` is not run from `next build`.
- Do not validate manifest listing ids (the sync owns that) and do not edit any catalog file.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Agree | slug in manifest, registry, directory; registry entry equals `listing` | slug `ok` | N/A |
| Unregistered | slug in manifest and directory, not registry | `{slug}: …not in registry.ts` | exit 1 |
| Extra registry key | key not in manifest | `{key}: …not in listings.json` | exit 1 |
| Stray directory | directory not in manifest | `{slug}: …no slug in listings.json` | exit 1 |
| Not yet synced | manifest slug, no directory | `{slug}: …has no directory` | exit 1 |
| Different listing | registry entry differs from `index.ts` `listing` | `{slug}: …not the same listing` | exit 1 |
| All empty | `{}` manifest and registry, no directories | "no listings yet" | exit 0 |
| Bad manifest or registry | missing file or wrong shape | one problem line; other comparisons still run | exit 1 |

</frozen-after-approval>

## Code Map

- `scripts/check-catalog.ts` -- `checkCatalog` builds the directory list and calls `checkListing` per slug; add manifest and registry loading via `loadExport`, make `checkListing` also return the loaded `listing`, then add the set comparisons. `main` and the `no listings yet` branch stay.
- `scripts/check-catalog.test.ts` -- `writeListing`/`validFiles` temp-dir helpers; existing cases have no `listings.json` or `registry.ts` and must gain them (add a `writeCatalog` helper). The build-isolation test already covers the "never in build" AC.
- `content/catalog/registry.ts` and `content/catalog/README.md` -- both say `check:catalog` "does not verify this file yet (Story 2.4)"; update that wording only.
- `content/catalog/listings.json` (`{}`) -- slug to Etsy listing id; `scripts/sync-etsy.ts:127` `readManifest` rejects an empty manifest, so do not reuse it.

## Tasks & Acceptance

**Execution:**
- [x] `scripts/check-catalog.ts` -- load manifest and registry, compare the three slug sets and registry-vs-`index.ts` listing, and fold results into `ok`/`problems` -- the drift check
- [x] `scripts/check-catalog.test.ts` -- update existing cases to write `listings.json` and `registry.ts`; add one test per matrix row and a CLI case exiting 1 on drift -- proves each drift is caught and named
- [x] `content/catalog/registry.ts`, `content/catalog/README.md` -- state that `check:catalog` now verifies the registry against the manifest and directories -- owner workflow

**Acceptance Criteria:**
- Given the repo as committed, then `npx tsc --noEmit`, `npm run lint`, `npm run test:catalog`, `npm run test:sync` and `npm run check:catalog` pass (the last with "no listings yet"), and `npm run build` succeeds
- Given a throwaway listing added to the manifest and directory but not the registry, when `npm run check:catalog` runs, then it exits 1 naming the slug; the throwaway is removed afterward
- Given `package.json`, then `build` references neither `sync-etsy` nor `check-catalog`

## Implementation Notes

- Implemented by a fresh subagent from this spec alone; the diff since `baseline_commit` was then read and every command below re-run in the main session.
- `checkCatalog` now takes the union of directory, manifest and registry slugs. `checkListing` returns `{ problems, listing? }` so the registry entry can be compared to the loaded `index.ts` `listing` with `isDeepStrictEqual`. Drift lines: `not in registry.ts, so the site will not show it`, `in registry.ts but not in listings.json`, `directory has no slug in listings.json`, `has no directory (…)`, `registry.ts entry is not the same listing as index.ts \`listing\``. A slug with two gaps gets one line per gap.
- An unusable `listings.json` or `registry.ts` is one file-level line (not slug-prefixed, starts with the file name); the comparisons that need it are skipped and the rest still run. A slug can still be `ok` in that case, but the run exits 1 through the file-level line.
- Runs: `test:catalog` 47/47 (24 existing + 23 new), `test:sync` 14/14, `tsc --noEmit` and `lint` clean, `check:catalog` prints "no listings yet", `build` succeeds and is still just `next build`.
- A throwaway slug in `listings.json` with a valid three-file directory and no registry entry made `check:catalog` fail with `FAIL zz-throwaway: not in registry.ts…`; the directory was removed and `listings.json` restored to `{}` afterward. The exit code of that manual run was not captured; exit 1 is covered by the passing CLI drift test.
- Matrix audit: every matrix row has a covering test that ran and passed (none skipped).
- Review patches applied by the same implementation subagent (see Review Triage Log #1–3): a test pinning the `manifest &&` guard (mutation-checked in the main session: removing the guard fails exactly that test), a corrected `ok` doc comment, and one README sentence on renaming or removing a listing. Final runs: `test:catalog` 48/48, `test:sync` 14/14, `tsc`, lint, `check:catalog` and `build` clean.

## Spec Change Log

## Review Triage Log

Three layers ran (blind hunter, edge-case hunter, verification-gap), as subagents. Layers: BH, EC, VG.

| # | Finding (layer) | Verdict | Route | Evidence |
|---|---|---|---|---|
| 1 | The `manifest &&` guard on the "in registry.ts but not in listings.json" rule is unpinned: every unusable-manifest test uses an empty registry, so dropping the guard left all 47 tests green (VG) | low | patch | Pre-verified by the layer (guard removed, 47/47 still passed). Confirmed at `scripts/check-catalog.ts` and in the test file: no case combines a bad `listings.json` with a populated registry. Test added. |
| 2 | `CatalogReport.ok` claims slugs "passed every check (directory, manifest and registry)", but when `listings.json` or `registry.ts` is unusable its comparisons are skipped and a clean slug is still `ok`, so the CLI prints `ok x` beside a FAIL line (BH, EC) | low | patch | Confirmed in `checkCatalog`: `ok` is pushed whenever no problem was reported for the slug. Behavior is the spec's own (skip what needs the file; the run still exits 1 through the file-level line), so the doc comment is the defect and is reworded. |
| 3 | The README documents adding a listing but not renaming or removing one, which is the story's stated motivation (BH) | low | patch | Confirmed by reading the README. One added sentence; no code change. The other README points in the same finding (FAIL-message-to-fix table, run-on step 5) are preferences and are not acted on. |
| 4 | A registry that statically imports one broken directory fails to load, so all registry comparisons are skipped and one file-level line hides the rest of the drift (BH, EC) | low | rejected | Real, and it is the matrix row "Bad manifest or registry: one problem line; other comparisons still run" as approved. The load error names the missing or throwing module and the per-directory problem is still reported. The fix (per-slug registry loading) cannot work with a static-import registry and adds machinery. |
| 5 | The "has no directory" message does not say which file lists the slug, and one root cause can yield two lines (BH) | low | rejected | The message names both files and the likely cause; one line per gap is the approved rule ("a problem for each gap"). Cosmetic. |
| 6 | Manifest and registry keys with no directory are not checked against `SLUG_PATTERN`; the manifest error text mentions listing ids that are not validated (BH, EC) | low | rejected | The sync already validates manifest slugs and ids, the spec excludes id validation, and the bad key is still named in the "has no directory" line. The fix adds a branch for a cosmetic gain. |
| 7 | Missing tests: registry entry with an unloadable listing, CLI exit 1 on a bad manifest or registry, stale registry key whose directory is also unlisted, and a run against the real repo (BH) | false | rejected | The first is pinned by the exact `deepEqual` in "missing index.ts" (registry has the key, `listing` is undefined); the third is the "extra registry key" test; the real-repo run is the spec's Verification command, run in step 3; `main` sets the exit code from `problems.length` for every problem kind. |
| 8 | Brittle assertions (order-coupled `problems[n]`, regex not spanning newlines, one id for every slug in `writeCatalog`) (BH) | low | rejected | Test style with no named harm today; the `boom` message is single-line, and ids are out of scope. Rewriting the assertions is more than a correction. |
| 9 | `writeCatalog` defaults to a static-import registry, so a test that forgets `inlineRegistry` fails on an unrelated registry error (BH) | low | rejected | Developer-only and it fails loudly at once; every current test pairs them correctly. |
| 10 | `checkListing` carries a redundant `loaded` variable, and the `checkCatalog` loop would read better as a `compareSlug` function (BH) | low | rejected | No named harm; a refactor of code that works and is tested. |
| 11 | A symlinked listing directory is not seen by `Dirent.isDirectory()`, so it would be reported "has no directory" (EC) | low | rejected | The directory filter is pre-existing. Listing directories are real directories (written by hand or by the sync), so a symlink is unlikely, and the fix adds a branch. |

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no type errors
- `npm run lint` -- expected: passes
- `npm run test:catalog` -- expected: existing and new tests pass
- `npm run test:sync` -- expected: still passes
- `npm run check:catalog` -- expected: exit 0, "no listings yet"
- `npm run build` -- expected: succeeds
