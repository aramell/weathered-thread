---
title: 'Sync Etsy Catalog Data'
type: 'feature'
created: '2026-09-21'
status: 'done'
baseline_commit: 'd5ec0dfefba511e6ac3e69d432de0e2328dcef85'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The storefront has no real commerce data: prices and names are placeholder strings in `lib/placeholder-shop-data.ts`, and nothing connects the site to the Etsy shop that is the commerce source of truth. Browsing, the picker and the checkout handoff cannot use real catalog facts until a sync exists.

**Approach:** Add a manually-run `scripts/sync-etsy.ts` that calls Etsy Open API v3 and writes one `content/catalog/{listing}/synced.ts` per design listing (name, listing URL, state, listing-level price in cents and quantity) — all-or-nothing, never touching human-authored content, never invoked from `next build`.

## Boundaries & Constraints

**Always:**
- All-or-nothing: any API failure (network, non-2xx including 401/403/429, malformed response) or bad listing URL aborts the run with zero files written and a clear stderr message.
- Listings come from a human-owned manifest `content/catalog/listings.json` mapping motif slug → Etsy `listing_id` (e.g. `{"pickleball": 4012345678}`); the script only reads it, never writes it. The slug is used byte-for-byte as the `content/catalog/{slug}/` directory and future `product/[slug]` route segment, and must match `^[a-z0-9-]+$`. A missing, empty or malformed manifest, or a bad slug, fails the run with zero files written.
- Listing-level data only: per-variation (style/color/size) price and quantity need OAuth `listings_r` (verified live: `getListingInventory` returns 401 with the key alone), so the script calls only `getListing` and records the price and quantity Etsy reports for the listing. No OAuth in this story; per-variation inventory is deferred (see `deferred-work.md`).
- A real sync is run once as verification when the manifest holds at least one of the owner's listings.
- Every call sends `x-api-key: <keystring>:<shared_secret>`; `ETSY_API_KEY` holds that full string, is read via bare `process.env` only inside `scripts/sync-etsy.ts`, and gets a blank entry in `.env.example`. It is never set in Vercel env.
- A returned listing `url` must be `https:` with host `etsy.com` or a subdomain; anything else fails the whole run naming the listing.
- `synced.ts` is fully owned and overwritten each run; the script never creates, reads or writes `authored.ts` or `index.ts`.
- Prices are integer cents (Etsy `amount / divisor`, USD only — any other `currency_code` fails the run).
- The regression check compares the listing price against `git show main:<synced.ts>`; a price lower than `main`'s prints a warning naming the listing and both prices, but the file is still written and the run finishes (exit 0). If `main` or the file isn't resolvable, skip that check and say so in the output.
- A previously-synced listing directory no longer in the run is left untouched and listed in a warning; the script never deletes.
- Listings that are not `active` are still written with their `state` recorded, and warned about.

**Never:**
- No `sync-etsy` reference in the `build` script; no Etsy call from any Next.js route, component or build step.
- No UI wiring — nothing under `app/` or `components/` reads `content/catalog/` yet.
- No git automation, and no OAuth flow. No test-framework installation.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Happy path | Valid key; every listing found, URLs on etsy.com | One `synced.ts` per listing written | N/A |
| Bad manifest | `listings.json` missing, empty, malformed, or a slug fails the pattern | No API calls | Exit 1, names the problem |
| Missing key | `ETSY_API_KEY` unset/blank | No API calls | Exit 1, clear message |
| API failure | Any call fails, incl. 401/403 (unapproved app) or 429 | No files written | Exit 1, stderr names call and status |
| Bad URL host | Returned `url` not on etsy.com | No files written | Exit 1, names listing and URL |
| Missing listing | A configured listing returns 404 | No files written | Exit 1, names listing |
| Inactive listing | `state` is not `active` | Written with `state` recorded | Warning printed |
| Price regression | New listing price below `main`'s | File still written, run finishes | Warning names listing, old and new price; exit 0 |
| No `main` ref | Fresh clone | Regression check skipped, run proceeds | Note printed |
| Orphaned listing | Directory on disk, not in this run | Left untouched | Warning lists it |

</frozen-after-approval>

## Code Map

- `scripts/`, `content/` -- neither exists; create `scripts/sync-etsy.ts` and `content/catalog/{listing}/synced.ts`. No prior art.
- `package.json` -- no TS runner installed; add `tsx` devDependency and `"sync:etsy"`; `build` stays `next build`.
- `content/catalog/listings.json` -- new, human-owned manifest (slug → `listing_id`); no Etsy shop name or listing IDs exist anywhere in the repo yet, so the owner supplies them.
- `.env.example` -- has `RESEND_API_KEY=`; add blank `ETSY_API_KEY=`. `.env.local` is gitignored (`.env*`); never read or print its values.
- `app/(site)/actions.ts` -- bare `process.env` convention to match.
- `lib/placeholder-shop-data.ts`, `lib/placeholder-motif-data.ts` -- placeholders explicitly kept separate from `content/catalog/`; do not import or mimic. Style/color/size mismatches (bay, XL, sweatshirt) reconcile in Epic 3, not here.
- `lib/format-price.ts` -- consumes integer cents; synced price must match that unit.
- `tsconfig.json` -- `strict`, `@/*` alias; script must pass `npx tsc --noEmit`.
- Etsy Open API v3: `GET /v3/application/listings/{listing_id}` (public: `title`, `url`, `state`, `price`, `quantity`), `GET .../listings/{listing_id}/inventory` (per-variation data; needs OAuth `listings_r` — NOT used here), `GET /v3/application/shops` (`shop_name`), `GET .../shops/{shop_id}/listings` (`limit` ≤100, `offset`). Spec: `https://www.etsy.com/openapi/generated/oas/3.0.0.json`. Etsy API Terms (etsy.com/legal/api) returned 403 to fetchers: read them before committing synced output.

## Tasks & Acceptance

**Execution:**
- [x] `package.json` -- add `tsx` devDependency and `sync:etsy` script -- run the TS script standalone, `build` untouched
- [x] `content/catalog/listings.json` -- create the slug → `listing_id` manifest; committed as `{}` because no Etsy shop name or listing IDs exist in the repo, so the owner adds their pairs before the first live sync (until then `npm run sync:etsy` exits 1 with "manifest ... is empty") -- the sync's only listing source
- [x] `.env.example` -- add blank `ETSY_API_KEY` -- documents the credential
- [x] `scripts/sync-etsy.ts` -- fetch, validate URL host/currency, regression-check against `main`, all-or-nothing write `content/catalog/{listing}/synced.ts` -- the story's deliverable
- [x] `scripts/sync-etsy.ts` -- exercise the I/O matrix's failure rows against stubbed responses -- verifies all-or-nothing without a test framework

**Acceptance Criteria:**
- Given a valid `ETSY_API_KEY`, when the owner runs `npm run sync:etsy`, then every design listing gets exactly one `synced.ts` with name, URL, state, price (cents) and quantity, and `authored.ts` is never touched
- Given any Etsy call fails, when the script hits the error, then nothing is written and it exits non-zero with a clear message
- Given a listing URL outside etsy.com, when validated, then the whole run fails and writes nothing
- Given `package.json`, then no script reachable from `build` references `sync-etsy.ts`
- Given prior synced data on `main`, when a price would regress, then a warning naming the listing and both prices is printed, the file is still written, and the run exits 0

## Implementation Notes

- Built directly (no subagent). `scripts/sync-etsy.ts` exports `runSync(deps)` with injected fetch/git/log so `scripts/sync-etsy.test.ts` (built-in `node:test`, `npm run test:sync`) covers every matrix row against stubs.
- Choices beyond the spec: `sync:etsy` loads `.env.local` via `tsx --env-file-if-exists`; HTML entities in Etsy titles/option values are decoded once; files are staged as temp files then renamed.
- **Renegotiated 2026-09-21:** live probe showed `getListingInventory` returns 401 (`requires scope: listings_r`) with the key alone; `includes=Inventory` on `getListing` returns 400. Owner chose listing-level sync now, OAuth per-variation inventory later; the frozen block was rewritten accordingly. `content/catalog/listings.json` stays `{}` until the owner supplies slug -> listing_id pairs.

## Spec Change Log

## Review Triage Log

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: no type errors
- `npm run lint` -- expected: passes
- `npm run sync:etsy` -- expected: live run against the owner's Etsy shop succeeds and writes `synced.ts` files; with no key, exits 1 with a clear message
