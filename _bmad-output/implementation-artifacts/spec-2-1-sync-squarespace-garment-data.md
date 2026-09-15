---
title: 'Sync Squarespace Garment Data'
type: 'feature'
created: '2026-09-15'
status: 'draft'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The storefront has zero real commerce data. Prices and product info are hardcoded placeholder strings (e.g. `components/product-card.tsx`'s `"$68"`), with no SKU concept anywhere in the codebase, and no connection to Squarespace — the actual commerce system of record. Nothing downstream (browsing, the picker, checkout handoff) can build on real catalog facts until this exists.

**Approach:** Add a manually-run `scripts/sync-squarespace.ts` that fetches price, inventory, SKU, name, and product URL from Squarespace's Products + Inventory API and writes one `content/catalog/{sku}/synced.ts` per garment — all-or-nothing, never touching human-authored content, never invoked from `next build`.

## Boundaries & Constraints

**Always:**
- All-or-nothing: any API failure, or any returned product URL whose host isn't `shop.weatheredthread.com`, aborts the whole run with zero files written.
- The script only runs as a standalone manual command (`npm run sync:squarespace`); `build` never references it.
- SKU is the byte-for-byte join key; each garment's directory is `content/catalog/{sku}/`, named exactly as Squarespace returns it.
- `synced.ts` is fully owned/overwritten by the script every run; the script never creates, reads, or writes `authored.ts`.
- Price is stored as an integer in cents.
- `SQUARESPACE_API_KEY` is read via bare `process.env` only inside `scripts/sync-squarespace.ts` (matching `RESEND_API_KEY`'s pattern) — never in a Client or Server Component. Add a blank entry to `.env.example`.
- Before writing a SKU, if `content/catalog/{sku}/synced.ts` already exists on `main` (`git show main:...`), compare its `price` to the newly-fetched price; a lower new price is a regression.
- If `main` (or the file on it) isn't resolvable — fresh clone, no local ref — skip the regression check for that SKU and proceed, noting it in the run's output.
- An orphaned SKU (previously synced, no longer returned) is left untouched on disk; the script warns listing it but never deletes.

**Never:**
- No `content/catalog/{sku}/index.ts` or `authored.ts` creation — that merge is Story 2.2's job.
- No UI wiring — nothing under `app/` or `components/` reads `content/catalog/` yet.
- No test-framework installation (pre-existing repo-wide gap, out of scope for this story).
- No git automation — the script never runs `git add`/`git commit`; committing the synced output is a manual step the site owner takes after reviewing the diff.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path | Valid API key; N garments returned, all URLs on `shop.weatheredthread.com` | Writes `content/catalog/{sku}/synced.ts` for every garment | N/A |
| Missing API key | `SQUARESPACE_API_KEY` unset | No API calls made | Exits 1 immediately with a clear message |
| API call fails | Squarespace API errors or times out mid-run | No files written for any SKU | Exits 1, stderr names the failure |
| Bad product URL host | A returned product URL isn't on `shop.weatheredthread.com` | No files written for the whole run | Exits 1, stderr names the offending SKU/URL |
| Price regression vs. `main` | Fetched price for a SKU is lower than `main`'s `synced.ts` | Per regression-handling decision below | N/A |
| No local `main` ref | Fresh clone / `git show main:...` fails | Regression check skipped for that SKU; run proceeds | Note printed, not an error |
| Orphaned SKU | A SKU has `synced.ts` on disk but Squarespace no longer returns it | Left on disk, unchanged | Warning printed listing the SKU |

</frozen-after-approval>

## Open Questions

- **Live verification path** — do we have a working `SQUARESPACE_API_KEY` (and confirmed Inventory-API-capable Squarespace plan tier) to run this script against the real API as this story's verification step? — options: **A)** Yes, provide it via `.env.local` now and I'll run a real end-to-end sync as verification (matches the AC's "Given a valid `SQUARESPACE_API_KEY`" precondition directly) / **B)** No key/tier confirmed yet — verify with a local fixture standing in for the Squarespace responses (fetch swapped behind an injectable client for the test run only), and treat the first live run as your own follow-up once credentials exist.
- **Price-regression handling** — when the script detects a SKU's fetched price is lower than what's on `main`, should it — options: **A)** Warn to stderr but still write the new (lower) price and finish the run (soft warning, sync always completes) / **B)** Skip writing that one SKU (old `synced.ts` stays as-is), continue syncing the rest, exit non-zero listing every skipped SKU / **C)** Abort the entire run and write nothing, identical to an API failure.

## Code Map

- `content/`, `scripts/` -- neither exists yet. Create `content/catalog/{sku}/synced.ts` (one dir per SKU) and `scripts/sync-squarespace.ts`. No prior art to pattern-match.
- `package.json` -- no TS runner installed (`tsx`/`ts-node`/`bun` all absent). Add `tsx` devDependency + `"sync:squarespace": "tsx scripts/sync-squarespace.ts"`; `build` stays `next build`.
- `.env.example`, `.env.local` -- follow the existing bare-`process.env` convention (`RESEND_API_KEY` in `app/(site)/actions.ts`); add a blank `SQUARESPACE_API_KEY` entry to both.
- `components/product-card.tsx`, `components/motif-tile.tsx`, `app/(site)/collections/[slug]/page.tsx` -- existing "product"/"motif" types are all local placeholders (price-as-string, no SKU/image fields); nothing here is reused, `synced.ts`'s shape is defined fresh.
- `tsconfig.json` -- `strict: true`, `@/*` alias — write the script to satisfy strict mode.
- Squarespace Commerce API reference: `https://developers.squarespace.com/commerce-apis` — exact endpoint paths/response fields must be pulled from live docs/API during implementation; planning-time doc fetches couldn't resolve full field-level detail.

## Tasks & Acceptance

**Execution:**
- [ ] `package.json` -- add `tsx` devDependency + `sync:squarespace` script -- run the TS script standalone without touching `build`
- [ ] `.env.example` -- add blank `SQUARESPACE_API_KEY` entry -- documents the required credential, matches existing convention
- [ ] `scripts/sync-squarespace.ts` -- implement fetch (Products + Inventory) → URL-host validation → regression check → all-or-nothing write of `content/catalog/{sku}/synced.ts` -- the story's entire deliverable

**Acceptance Criteria:**
- Given a valid `SQUARESPACE_API_KEY`, when the site owner runs `scripts/sync-squarespace.ts`, then it fetches price/inventory/SKU/name/URL for every garment and writes exactly one `content/catalog/{sku}/synced.ts` per garment, never touching `authored.ts`
- Given any Squarespace API call fails, when the script encounters the error, then it writes nothing and exits with a clear error message
- Given a garment's returned product URL, when the script validates it, then a host other than `shop.weatheredthread.com` fails the whole run loudly, writing nothing
- Given `package.json`, then `sync-squarespace.ts` is never referenced by the `build` script
- Given synced data already on `main`, when a new run would regress a previously-synced field, then the script handles it per the answered Open Question above, before writing

## Implementation Notes

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no new type errors
- `npm run lint` -- expected: passes
- `npm run sync:squarespace` -- expected: per the answered Open Question (live run or fixture-backed dry run)

**Manual checks (if no CLI):**
- Inspect a written `content/catalog/{sku}/synced.ts` for correct shape: SKU matches Squarespace exactly, price is an integer (cents), URL host is `shop.weatheredthread.com`.
