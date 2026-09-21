---
title: 'Pivot commerce docs from Squarespace to Etsy'
type: 'chore'
created: '2026-09-21'
status: 'done'
baseline_commit: 'bfd614a1943e86344e91672ebc7e7b58a583248a'
route: 'dispatch'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Every living planning doc, the epic contexts, and the draft Story 2.1 name Squarespace as the store, catalog API and checkout. The catalog is actually on Etsy (Open API v3), so anyone building Epic 2 or 4 from these docs builds against the wrong platform.

**Approach:** Update the living docs (and three code comments) to Etsy, recording the confirmed facts and their necessary consequences. No scripts, env files, or behavior change; the sync build is a separate, deferred goal.

## Boundaries & Constraints

**Always:**
- Etsy facts stated are only: Open API v3; every call sends `x-api-key: <keystring>:<shared_secret>`; public read-only endpoints need no OAuth. Credential is `ETSY_API_KEY`, holding that full string; it stays out of Vercel build/runtime env, and the sync stays manual and never runs from `next build`.
- **Handoff:** the Checkout Handoff link is a `shop.weatheredthread.com` URL that forwards to the synced Etsy listing URL. NFR8 is rewritten as: handoff links always use the `shop.` host, never a raw etsy.com URL in site markup. Checkout itself runs on etsy.com.
- **Squarespace** remains only as registrar/DNS for `weatheredthread.com`. Every other mention becomes Etsy; `shop.` DNS now points at the Vercel app, which serves the forward.
- **Listing model:** one Etsy listing per design (motif), with three variation axes: garment style (long-sleeve tee, short-sleeve tee, heavyweight crew, lightweight crew), color (ivory, pepper, blue jean), and size (S/M/L on tees). A listing URL is per design, so the handoff cannot preselect style/color/size; the interstitial restates the selection and the visitor confirms it on Etsy. Motif is therefore no longer absent from the commerce source, so the "SKU = one garment, motif never in SKU" rules are rewritten to this model. The repo-motif-to-listing join key is left as an open architecture item for the sync story.
- Replace the Squarespace plan-tier open item with two Etsy items: app approval/access tier, and the Etsy API Terms limits on storing listing data (etsy.com/legal/api was unreadable, so unverified). Add: crew size options unconfirmed.

**Never:**
- Edit done specs, `reviews/`, `.memlog.md` files, `sprint-change-proposal-*`, or `imports/*` — they are history.
- Touch `scripts/`, `package.json`, or any `.env*` file, or change any code behavior.
- State unverified Etsy details (endpoint names, response fields, rate limits, approval steps).

</frozen-after-approval>

## Code Map

- `_bmad-output/planning-artifacts/epics.md` -- 27 refs: FR8, FR13, NFR7/8/10, sync + domain-split + catalog-structure bullets (l.52-56), coverage map (l.90/95), Epic 2 and Epic 4 headers, Stories 2.1, 2.2 (l.255), 4.2 (l.398-408)
- `_bmad-output/planning-artifacts/architecture/architecture-weathered-thread-2026-09-14/ARCHITECTURE-SPINE.md` -- 20 refs: scope, AD-1, AD-2, AD-7, Naming/Data/State rows, tech table, diagram (l.114-121), deployment, tree (l.146), roadmap (l.152), open item (l.158)
- `_bmad-output/planning-artifacts/ux-designs/ux-weathered-thread-2026-09-14/EXPERIENCE.md` (8 refs) and `DESIGN.md` (l.3, l.181) -- handoff and "only to pay" wording
- `_bmad-output/implementation-artifacts/epic-1-context.md` (l.35), `epic-2-context.md` (10 refs), `epic-3-context.md` (l.29, 35, 59) -- derived contexts; keep consistent with epics.md
- `_bmad-output/implementation-artifacts/spec-2-1-sync-squarespace-garment-data.md` -- draft; do not rename or re-plan here
- `lib/placeholder-motif-data.ts:9`, `lib/placeholder-shop-data.ts:6`, `lib/format-price.ts:5` -- comment-only mentions
- `_bmad-output/implementation-artifacts/sprint-status.yaml` does not exist, so nothing else keys off the 2.1 story name

## Tasks & Acceptance

**Execution:**
- [x] `epics.md` -- rewrite all Squarespace refs to the Etsy model above; retitle Story 2.1 "Sync Etsy Catalog Data" and Epic 4 "Checkout Handoff to Etsy"; Story 4.2 redirects via the `shop.` host -- source of truth for stories
- [x] `ARCHITECTURE-SPINE.md` -- rewrite AD-1/AD-2/AD-7 and dependent rows/diagram/tree/open items per Always; keep the manual-sync, no-shared-cart and env-scope rules
- [x] `EXPERIENCE.md`, `DESIGN.md` -- swap handoff wording to Etsy; note that selection is re-confirmed on Etsy
- [x] `epic-1/2/3-context.md` -- align with the rewritten epics; drop the "Epic 3 gated on Squarespace setup" line
- [x] `spec-2-1-sync-squarespace-garment-data.md` -- add one `Open Questions` entry marking it stale: the Etsy per-design listing model supersedes its Squarespace intent; re-plan in the deferred sync goal
- [x] three `lib/*.ts` comments -- Squarespace → Etsy, no code changes

**Acceptance Criteria:**
- Given the edited living docs, when grepping for "squarespace", then remaining hits are only registrar/DNS lines and the stale marker on spec 2.1
- Given the docs, when read end to end, then no doc says a SKU is one garment with motif absent, or that checkout lands on a Squarespace domain
- Given the repo, when linted, then it passes and no non-comment code changed

## Verification

**Commands:**
- `grep -rIn -i squarespace _bmad-output/planning-artifacts _bmad-output/implementation-artifacts/epic-*-context.md lib --exclude-dir=reviews --exclude-dir=imports --exclude=.memlog.md --exclude=sprint-change-proposal-2026-09-15.md` -- expected: only registrar/DNS lines
- `npm run lint` -- expected: exits 0
- `git diff --stat -- lib` -- expected: 3 files, comment lines only

## Implementation Notes

- Implemented by a subagent, then patched in review by the orchestrator (the implementer was not re-engaged; the fixes were small enough to apply directly).
- Placeholders chosen by the implementer: script name `scripts/sync-etsy.ts`, catalog directory key `{listing}`, route segment `product/[listing]`. Route identity remains an open item.
- Added beyond the spec: Story 2.2 retitled "Author Motif & Story Content Per Design Listing"; sync validates the listing URL host is etsy.com or a subdomain (replaces the old `shop.` host check).

## Review Triage Log

Layers run: Blind Hunter, Edge Case Hunter, Verification Gap (no gaps). No loopback.

- product route `product/[listing]` cannot identify garment × motif — medium — patch: route comment in Spine tree now marks identity as an open item; folded into the join-key open item in Spine, epics, epic-2-context.
- garment-level content (`swatchImage`, style/color) has no home under per-listing directories — medium — patch: recorded in the same open item.
- listing name (synced) vs motif name (authored) — low — patch: recorded in the open item (which name is displayed).
- style/color combinations a design is not offered in; garment-to-motif assignment under the Etsy model — low — patch: recorded in the open item.
- placeholder colors/sizes/types (bay, XL, crewneck-sweatshirt) and "garment style" vs "garment type" wording — low — patch: reconciliation added to the open item.
- inventory readable without OAuth is unverified — low — patch: added to the open item. The "no cart API" claim was not asserted; AD-1 only says cart/checkout run on etsy.com.
- raw Etsy `url` could reach a client payload despite NFR8 — medium — patch: AD-1 and epic-2-context now require it be read server-side only.
- "Epic 3 gated on setup" line deleted with no replacement — medium — patch: Etsy-flavored gating line added to epic-3-context (the Squarespace claim stays removed).
- spec 2.1 stale marker only halfway down — medium — patch: banner added at the top of that file. Status left `draft`; the banner is the warning.
- Deferred "Sync automation" still offers Vercel Cron, which the env-scope rule forbids — low — patch: note added.
- `updated:` not bumped on DESIGN.md / EXPERIENCE.md — low — patch.
- DESIGN.md "because Etsy offers them" anti-pattern and awkward description — low — patch: reworded.
- `shop.` forward gaps (stale listing, root/unmatched path, noindex, host routing, preview hosts) and "Continue to Checkout" label mismatch — low — defer: story-planning items for Epic 4.
- Story 2.1 Etsy failure cases and NFR7 price semantics — low — defer: belongs to the deferred sync story.
- host validation allows `evil-etsy.com` or http — false: the docs say "etsy.com (or a subdomain)", which excludes `evil-etsy.com`; no validation code exists in this diff.
- Etsy caps listings at two variation types — false: Etsy allows up to three (Etsy Help "How to Add Variations to Your Listings"; Etsy Open API v3 "Third Variation Tutorial").
- verification grep narrower than the AC; `deferred-work.md` still mentions Squarespace — rejected: the fix edits this build's spec, and those deferred entries are append-only history.
- deferred-work entry mixes concerns; `.env.local` may not be gitignored — false: `git check-ignore .env.local` returns `.env.local`, and the entry covers one deferred goal.
- "design" used in story titles despite the Naming rule — low, rejected: the rule confines "design" to prose, which titles are; the fix would be cosmetic churn.
