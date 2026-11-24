# Launch checklist (24 Nov 2026)

Status of the Nov 2026 brand and shop revision, plus the Square launch work. Tick items off as they close.

## Launch blockers

- [ ] **Activate the Square account** at squareup.com/activate. Until then, live checkout cannot take real card payments. Owner only.
- [ ] **Production webhook subscription.** After activation, confirm it exists on the Production tab with event `payment.updated` and URL `https://www.weatheredthread.com/api/square/webhook`. If its signature key differs from the one in Vercel, update `SQUARE_WEBHOOK_SIGNATURE_KEY` (Production) and redeploy.
- [ ] **One real test purchase, then refund it.** A "New order:" email should reach `hello@weatheredthread.com` (check spam). Then check the production logs for the `POST /api/square/webhook` call.
- [ ] **Check Square Transactions** for what the earlier test purchase actually was. A receipt arrived, but an unactivated account should not produce a live one.

## Questions for the owner

- [ ] **Exit 17:** relisted (send the new Etsy listing ID), removed for good, or just inactive? It is hidden (`hidden: true` in `content/catalog/sic-exit-17/authored.ts`); the sync fails and emails every 6 hours until this is settled.
- [ ] **Two inactive Etsy listings:** reactivate them, or say which designs they are, so the shop reaches 15 instead of 13.
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
