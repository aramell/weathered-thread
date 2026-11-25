# Launch checklist (24 Nov 2026)

Status of the Nov 2026 brand and shop revision, plus the Square launch work. Tick items off as they close.

## Launch blockers

- [x] **Activate the Square account** at squareup.com/activate. Until then, live checkout cannot take real card payments. Owner only. Done 24 Nov: the production location is `ACTIVE` with card processing enabled.
- [x] **Production webhook subscription.** After activation, confirm it exists on the Production tab with event `payment.updated` and URL `https://www.weatheredthread.com/api/square/webhook`. If its signature key differs from the one in Vercel, update `SQUARE_WEBHOOK_SIGNATURE_KEY` (Production) and redeploy. Done 24 Nov: the subscription was created, the key in Vercel replaced with the production one, and production redeployed. Before the fix the webhook returned 401.
- [ ] **One real test purchase, then refund it.** A "New order:" email should reach `hello@weatheredthread.com` (check spam). Then check the production logs for the `POST /api/square/webhook` call. Purchase done 24 Nov: the webhook returned 200 and the email was delivered. Still to do: refund both test payments (about $43.99 and $41.99) in the Square Dashboard.
- [ ] **Check Square Transactions** for what the earlier test purchase actually was. A receipt arrived, but an unactivated account should not produce a live one.

## Questions for the owner

- [x] **Exit 17:** just inactive on Etsy for the time being. Stays hidden (`hidden: true` in `content/catalog/sic-exit-17/authored.ts`); unhide it once the listing is active again. The sync now skips a hidden design that Etsy 404s without failing, so there are no more 6-hourly emails. A visible design that goes missing still fails the run.
- [x] **Inactive Etsy listings:** Beach Cruiser, Exit 17 and Beach Chair. Decision (25 Nov): skip them for launch. Beach Cruiser and Beach Chair are not in the manifest, so there is nothing to change; reactivate and add them to `listings.json` later.
- [ ] **"Prices aren't right" screenshot:** send it. `lib/price-chart.test.ts` checks every synced price against the pricing chart and passes, so the screenshot is needed to find the price in question.
- [ ] **Sandbox test now, or wait for activation?** Sandbox would test the order email before activation; it needs a separate sandbox subscription for Preview.

## Owner only

- [ ] Send the homepage photos (the hero uses stand-ins).
- [ ] Send the About page photos (slots are marked as placeholders in `app/(site)/about/page.tsx`).
- [ ] Try the product gallery swipe on a real phone (it may fight programmatic scrolling).
- [ ] Check GitHub notification settings so Actions failure emails reach the owner.

## Developer (me)

- [ ] Author story content for any reactivated listing; run the registry drift check.
- [ ] Hide or unhide designs on request (`hidden: true`).
- [ ] Move motifs off `lib/placeholder-motif-data.ts` onto the catalog.
- [ ] Refresh stale planning docs (`epics.md`, the Etsy-era specs) to reflect Square.
- [ ] Real per-style garment photography replaces the four shared color photos (needs photos).

## Known behavior to keep in mind

- US-only shipping is not enforced by Square. A non-US address gets the flat US rate; the order email is marked `[NON-US]` with a banner so the owner can contact the buyer first. Decision (24 Nov): keep this flag.
- Prices come from Etsy (synced every 6 hours); Square only charges what the catalog says.

## Done

- [x] Brand alignment: Anton for place names, eyebrow and tagline copy, approved logos.
- [x] Collections index fixes the 404; a test fails the build on a dead nav link.
- [x] Bay only on the Heavyweight Tee; S, M and L only.
- [x] Prices checked against the owner's chart, with a test.
- [x] Design locked on the product page; color names on swatches.
- [x] About page with the owner's copy.
- [x] Hide a design with `hidden: true`; Etsy photo refresh with `npm run sync:photos`.
- [x] Square webhook: signature check, refunded and stale payments skipped, non-US flag, tested glue (PR #4).
- [x] CI runs `tsc`, `test:catalog` and `test:sync` (PR #4).
- [x] Sync skips a listing Etsy no longer has and alerts by failing after it pushes (PR #5).
- [x] Exit 17 hidden (PR #5).
- [x] Dead stock code removed (PR #6).
- [x] Pointer cursor on buttons (PR #7).
- [x] Comfort Colors section, tile-based garment blurbs and cotton line (PR #8).
- [x] Resend sending domain `weatheredthread.com` verified (DKIM and SPF records added at Squarespace DNS). Until then every order email failed with `Resend: validation_error`.
- [x] Square account activated, production webhook subscription created, and a real order's email delivered end to end (24 Nov).
- [x] Checkout showed a false "That didn't go through" while opening Square: fixed in PR #9, merged 25 Nov.
