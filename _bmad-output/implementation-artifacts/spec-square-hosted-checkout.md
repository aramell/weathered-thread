---
title: 'Square hosted checkout with a cart (ad-hoc line items)'
type: 'feature'
created: '2026-10-28'
status: 'in-progress'
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

## Verification

**Commands:**
- `npm run test:catalog` -- expected: all pass
- `npx tsc --noEmit && npm run lint && npm run build` -- expected: clean
