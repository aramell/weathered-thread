---
title: 'Square hosted checkout with a cart (ad-hoc line items)'
type: 'feature'
created: '2026-10-28'
status: 'done'
route: 'dispatch'
baseline_commit: '1ab6a2b74d8b137f1c0444e8db1a69821a800d67'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Etsy's checkout lives on etsy.com and cannot take the visitor's style/color/size from this site, and the site has no cart: "Add to Bag" is a single-item hand-off.

**Approach:** Square is payments and orders only. This site stays the source of truth for designs, photos, variations and prices. Visitors build a bag on this site (several designs/picks, quantities). Checkout re-prices the whole bag on the server and creates one Square hosted Payment Link with one ad-hoc line item per pick, $5.99 flat shipping once per order, no tax, and a redirect back to this site. The owner sees what to make in the Square Dashboard and app (orders carry every line item and the shipping address); an order-email webhook is built but not enabled.

## Boundaries & Constraints

**Always:** Square token, location id and Payment Link urls stay server-side (NFR8). The bag stores picks and quantities only, in the visitor's browser; prices are never read from it. Every pick is re-resolved with `resolveSelection` on the server at checkout. Quantity per line is 1 to 10. Shipping is `checkout_options.shipping_fee` of 599 cents per order, address required, US only. No tax. No sold-out gate: every pick is orderable (made-to-order). If the webhook is enabled, signatures are verified and the email is idempotent per order. Build and verify on Square sandbox first. The Etsy shop stays open and its account is not touched.

**Never:** Close, edit or delete anything in the Etsy account. Delete Etsy sync/auth scripts until the Square flow is verified in production. Print or commit credentials. Commit without the user's say-so. Read prices or stock from Square.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Add to Bag | Valid pick on a product page | Stay on page, brief "Added" with link to bag, header count updates; same pick again raises quantity | N/A |
| Quantity bounds | Set below 1 or above 10 | Clamped to 1 to 10 | N/A |
| Happy path | Bag of N picks, Checkout | One link with N line items at site prices + one $5.99 shipping, 303 to Square | N/A |
| Stale or tampered bag | Pick no longer resolves, or bad stored data | Bag page flags that line and offers removal; checkout refuses until removed; unreadable storage reads as an empty bag | No Square call |
| Empty bag | Checkout with no items | Bag page shows empty state | No Square call |
| Square API failure | 4xx/5xx/timeout on create | Back to bag with the retry notice | Logged server-side, no token in log |
| Paid | Square completes the payment | Order appears in the Square Dashboard with every line item and the shipping address; buyer gets Square's receipt; bag cleared on return | N/A |
| Return from Square | Visitor lands on thank-you | Static confirmation, bag cleared | Not treated as proof of payment |

</frozen-after-approval>

## Code Map

- `lib/etsy-inventory.ts` -- `SyncedVariation` shape; stays the price source.
- `lib/checkout.ts` -- `parseSelection`/`resolveSelection` reused; `handoffPath`, `forwardHref`, `listingUrlWithSelection`, `shopOrigin` die with the Handoff.
- `lib/square-checkout.ts` -- S2 single-item builder; becomes a list of items, one line item each, per-line `metadata` (order metadata caps at 10 entries).
- `components/product-picker-shell.tsx:98-101` -- `addToBag` does `router.push(handoffPath(...))`; becomes cart add + confirmation. `components/add-to-bag-bar.tsx` label still says "Buy on Etsy".
- `components/nav-header.tsx` -- bag icon is a non-interactive span; becomes a link with a count.
- `app/(site)/layout.tsx` -- stays static; cart state is client-side (localStorage) so pages are not made dynamic.
- `app/go/[slug]/route.ts`, `app/(site)/checkout/[motif]/page.tsx` -- Etsy forward and single-item Handoff; removed.
- `content/catalog/{slug}/synced.ts` -- Etsy snapshot incl. hotlinked `images[]` (blank alt).
- `.github/workflows/sync-etsy.yml`, `scripts/*etsy*`, `lib/etsy-live.ts`, `lib/live-catalog.ts` -- retired after go-live.

## Tasks & Acceptance

**Execution:**
- [x] S1 `lib/square-client.ts`, `.env.example` -- server-only token, location id, environment; sandbox default
- [x] S2 `lib/square-checkout.ts` -- sandbox spike; single-item Payment Link builder (superseded by C2)
- [x] C1 `lib/cart.ts` -- pure cart: add/merge, set quantity (clamp 1-10), remove, defensive parse/serialize, price lines via `resolveSelection`; tests
- [x] C2 `lib/square-checkout.ts` -- multi-item builder, per-line metadata; sandbox verify; tests
- [x] C3 cart store and UI -- localStorage store (`useSyncExternalStore`), header bag link + count, picker Add to Bag adds with confirmation, bar label fixed
- [x] C4 `app/(site)/bag/page.tsx`, `app/(site)/bag/actions.ts` -- bag page (priced server-side, quantities, remove, stale flag, empty state) and `startCheckout` Server Action; remove `app/go`, Handoff page, dead helpers
- [x] S4 `app/(site)/checkout/thank-you/page.tsx` -- static confirmation that clears the bag
- [x] S5 `app/api/square/webhook/route.ts`, `lib/square-webhook.ts` -- built and tested, NOT enabled (no subscription, no `ORDER_NOTIFY_EMAIL`, Resend domain unverified); owner uses the Square Dashboard instead
- [x] S0 Own the photos -- 80 photos (66 unique) copied to `public/images/designs/{slug}/` (1600px max, q80, 18 MB), `authored.ts` `photos` with real alt text, `lib/motifs.ts` reads them, `check:catalog` verifies each file and alt, Etsy image host removed from `next.config.ts`. Price/variation data still comes from `synced.ts`; freezing it and turning `listings.json` into a slug list moves to S6 with the sync retirement.
- [ ] S6 Go-live -- production env in Vercel, one real purchase and refund, then retire Etsy sync, workflow and `ETSY_*` vars
- [ ] `package.json` -- test script entries

**Acceptance Criteria:**
- Given a valid pick, when the visitor taps Add to Bag, then they stay on the page, see the confirmation, and the header count reflects the bag.
- Given a bag of several picks, when the visitor checks out, then Square opens with each pick as its own line at the site price, one $5.99 shipping charge, and no tax.
- Given a bag whose stored data was edited by hand, when checkout runs, then prices come from the site's data, never the bag.
- Given a completed payment, when the owner opens the Square Dashboard, then the order shows every line item and the shipping address.
- Given the built client bundle, when searched, then no Square token or link url is present.
- Given the Etsy listings are closed, when any design page renders, then all photos still load.

## Implementation Notes

- Spike (sandbox, API 2025-10-16): `shipping_fee` lands as a $5.99 service charge, total = price + 5.99, no tax, `ask_for_shipping_address` and `redirect_url` accepted, order `metadata` round-trips. Ad-hoc line items take no image, so the photo is not on Square's page; the line name carries the pick. Payment Links has no shipping-country restriction, so US-only is not enforced by Square.
- Live check of S5 (signed test events, local): bad signature 401, valid event fetched the real sandbox order and reached the email step, which failed because Resend has no verified sending domain. Enabling it needs a verified domain, `ORDER_NOTIFY_EMAIL`, and a Square webhook subscription with its signature key and exact url.
- Local and test runs use the sandbox variables only; production `SQUARE_*` is used in Vercel at go-live (S6).
- Cart state is client-side so the (site) layout and product pages stay static; the bag page asks the server to price the stored picks.

## Spec Change Log

- 2026-11-02: S0 narrowed to photos (owner chose photos in the repo, option A); making price/variation data owned moves to S6.
- 2026-11-02: Owner chose Square-only order visibility. S5 webhook email stays built but disabled; revisit if Square's own notifications prove insufficient at the S6 test purchase.
- 2026-11-01: Rewritten from catalog-backed Square to ad-hoc line items; added webhook and catalog-ownership stories; shipping $5.99 flat, no tax (owner decision).
- 2026-11-02: Renegotiated by owner to add a cart (stay on page with count after add, quantity 1-10 per line). Single-item Handoff replaced by a bag page; S3 replaced by C1-C4; S2 builder generalized in C2.

## Review Triage Log

### Review Findings

Code review of `main...HEAD` (2026-11-03): 1 decision-needed, 5 patch, 5 defer, 17 rejected.

- [x] [Review][Patch] Owner decided (2026-11-03): pages read the synced snapshot so the site owns prices and variations (option b). Make the shop, collection and picker pages use `getShop`/synced listings instead of `getLiveShop`/`getLiveMotifShops`, so they agree with the bag. Original finding: The bag prices from the synced snapshot while product pages show live Etsy prices and variations — `lib/bag.ts` calls `getListing` (synced files), but the shop, collection and picker pages read `getLiveShop()` (live overlay via `lib/live-merge.ts`). If Etsy's price or a variation changes between syncs, the page shows one price and the bag/charge uses another, or reports "no longer available". Options: (a) price the bag from `getLiveListing`; (b) make pages read the synced snapshot, so the site owns prices (the S6 plan); (c) accept until S6. (medium; blind-hunter+edge-case-hunter)
- [x] [Review][Patch] "Added to your bag" shows when nothing was added — `addItem` returns the cart unchanged once 20 lines exist and clamps quantity at 10, yet `addToBag` always calls `setAddedKey`; the status and the "Added · View bag" bar appear for a dropped or capped pick [lib/cart.ts:addItem, components/product-picker-shell.tsx:106-110] (medium; acceptance-auditor+blind-hunter+edge-case-hunter)
- [x] [Review][Patch] Bag error handling: if `priceBagAction` rejects the bag stays on "Loading…" with Checkout disabled and no retry, and `failure` is never cleared on a later success; a rejected `startCheckout` is not caught, so the visitor gets no message [components/bag-view.tsx:36-42, 75-79] (low; blind-hunter+edge-case-hunter)
- [x] [Review][Patch] `/bag` renders "Your bag is empty." in the server HTML and during hydration for a visitor who has a stored bag, then swaps; render a neutral state until the store has hydrated [components/bag-view.tsx, components/use-cart.ts] (low; edge-case-hunter)
- [x] [Review][Patch] `startCheckout` wiring is untested: the redirect url path (`/checkout/thank-you`) and the missing-config → `{error:"failed"}` mapping can change with every test still passing; move the redirect-url construction into a pure helper and test it [app/(site)/bag/actions.ts:20-32, lib/checkout.test.ts] (low; verification-gap)
- [x] [Review][Patch] Misleading comments: `thank-you/page.tsx` says "the real record is the order webhook" (webhook is not enabled; the owner uses the Square Dashboard) and `square-checkout.ts:55` says the webhook reads line metadata, but `describeOrder` only prints `line.name` [app/(site)/checkout/thank-you/page.tsx, lib/square-checkout.ts:55] (low; acceptance-auditor+blind-hunter)
- [x] [Review][Defer] US-only shipping is not enforced; the bag says "flat rate, US" but Payment Links has no country restriction — deferred: the spec's Implementation Notes already record this Square limitation; settle at the S6 test purchase (restrict by checking the address in the order, or reword the copy) [components/bag-view.tsx, lib/square-checkout.ts]
- [x] [Review][Defer] Webhook is unverified at its edges: the route's order fetch and Resend wiring are untested, it emails for any COMPLETED payment on the location (POS, Dashboard, other links), and dedupe relies on Resend's 24-hour idempotency window — deferred: the webhook is built but not enabled (owner chose Square-only visibility); fix before subscribing [app/api/square/webhook/route.ts, lib/square-webhook.ts]
- [x] [Review][Defer] `SHOP_ORIGIN` may still be set to the old `https://shop.weatheredthread.com` in the deployed environment, which would send paid visitors to the old host (unverified, medium if true) — deferred: check the production value with `vercel env ls` before go-live (S6); the code default is now `https://weatheredthread.com` [lib/checkout.ts]
- [x] [Review][Defer] Dead code after hard-coding `inStock: true`: the `sold-out` branch in `resolveSelection`, the picker's out-of-stock UI, `lowest`, and `lib/live-catalog.ts` / `live-merge.ts` / `etsy-live.ts` lost their checkout consumer — deferred: cleanup; depends on the pricing-source decision above [lib/shop.ts:58, lib/checkout.ts, components/product-picker-shell.tsx]
- [x] [Review][Defer] The new payment tests (`bag`, `cart`, `cart-store`, `square-*`) only run through `npm run test:catalog`; the only workflow is `sync-etsy.yml` — deferred: no CI runs the test suite (pre-existing gap, see the first deferred-work item); add a test/tsc job [package.json, .github/workflows]

#### Rejected

- Sandbox as the default `SQUARE_ENVIRONMENT` is unsafe in production (false): deliberate per the spec and `.env.example`; with live credentials unset the client throws a `SquareConfigError`, which `startCheckout` logs and reports as "failed", so nothing is charged to the wrong account.
- Webhook answers 500 when unconfigured (low): harmless while nothing is subscribed.
- Webhook crashes on an invalid `SQUARE_ENVIRONMENT` (low): webhook not enabled.
- "Added" confirmation is not brief (low): persists only until the pick changes; not worth a timer.
- Square failure shows inline rather than "back to bag" (low): functionally equivalent to the spec's retry notice.
- Server action redirect is not literally a 303 (low): same behavior; wording only.
- Thank-you page clears the bag on any visit (low): the spec requires clearing there and the page claims nothing.
- Thank-you copy says Square emails a receipt, which is not guaranteed (low): cosmetic.
- Thank-you page has no cancel/return path (low): fix adds a new flow.
- Unauthenticated server actions can create unlimited payment links (low): creating a link charges no one; rate limiting adds infrastructure.
- `itemKey` joins on `|` (low): catalog values never contain it, and a hand-edited bag only affects that visitor, whose pick resolves as unavailable.
- Catalog price of 0 or a non-integer would make checkout throw (low): not shown reachable; the catalog check guards synced data.
- Old `/go/{slug}` and `/checkout/{motif}` urls now 404 (low): the hand-off was days old; redirects add config for little benefit.
- 66 unique photos but 80 files, 18 MB in git (low): the owner chose photos in the repo (spec Change Log, 2026-11-02).
- Photo dimension check only tests for positive integers (low): a wrong size only affects layout.
- Spec tasks and status are stale (rejected): the fix edits the spec under review.
- No tax or returns/delivery note on the bag (rejected): "no tax" is an owner decision in the spec.

## Verification

**Commands:**
- `npm run test:catalog` -- expected: all pass
- `npx tsc --noEmit && npm run lint && npm run build` -- expected: clean
