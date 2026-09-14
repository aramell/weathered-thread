# Reviewer Gate — Rubric Walk

**Target:** `ARCHITECTURE-SPINE.md` (Weathered Thread, 2026-09-14)
**Method:** Independent fresh-context review against the good-spine checklist. Consulted only the spine file itself, its co-located `.memlog.md`, and the live repo (`package.json`, `app/` tree) to check brownfield ratification. No other conversation history consulted.

## Verdict

**Conditional pass — fix one high-severity naming contradiction and tighten two medium-severity gaps before this gates story writing.** The spine's structural bones are sound: AD-2 and AD-3 genuinely resolve cleanly (see below), the Stack table matches `package.json` exactly, the source-tree sketch sits coherently on top of the current create-next-app scaffold, both Mermaid diagrams are syntactically valid and non-empty, and the deployment/operational envelope is explicitly decided-or-deferred rather than silently missing. The blocking issue is that the document's own entity model contradicts itself about which entity actually carries the Squarespace SKU — exactly the kind of divergence point a story author needs resolved, not inferable.

## AD-2 / AD-3 cross-check (explicitly requested)

**These two resolve cleanly, not contradictorily.** AD-2 governs *how content/catalog/ gets populated* (a build-time pull from Squarespace's Products/Inventory API); AD-3 governs *what form that content takes at rest and how it's accessed* (static TS/JSON modules, no DB, no mutation endpoints). One is a data-source rule, the other a storage/access-pattern rule, and they compose without tension — AD-3's "static content" claim is exactly what AD-2's sync script produces. No fix needed here.

## Findings by Severity

### High

**H1 — Naming table contradicts itself on which entity is "the sellable SKU."**
Consistency Conventions → Naming row states: `garment` (**a sellable SKU**), `product` (one garment × motif pairing — **the sellable unit** `EXPERIENCE.md` calls "Product"). Two different nouns are each called the sellable/SKU-bearing thing in the same sentence. This is not a pedantic wording nit — it's the exact fact a story implementing the Checkout Handoff (AD-1) needs unambiguously: does "the exact matching Squarespace product URL" vary **per motif** (i.e., Squarespace has a distinct SKU/URL for every garment×motif combination), or is the URL keyed **per garment only** (i.e., every motif on the same garment hands off to the identical Squarespace page, and the motif choice isn't carried through checkout)? A builder reading "garment (a sellable SKU)" will implement one way; a builder reading "product... the sellable unit" will implement the other. Two independently-built stories (the picker's handoff logic and the sync script's SKU-keyed content shape) can diverge exactly on this point. **Fix:** state explicitly which entity carries the Squarespace SKU, and whether the checkout URL is per-garment or per-(garment×motif).

### Medium

**M1 — AD-3's "~10-12 SKU" scale premise is inconsistent with the product model, and conflicts with an item the spine itself marks unresolved in Deferred.**
AD-3's Prevents clause justifies skipping a database on "a ~10-12 SKU, batch-updated catalog." But per the Naming table, the actual checkout-URL-bearing unit is `product` = garment × motif (13 motifs, garment-to-motif assignment not finalized) — which, depending on the H1 resolution, could mean anywhere from ~10-12 up to 100+ sellable combinations. The Deferred section itself lists "final SKUs" as an *unresolved business decision carried from the UX spine* — so AD-3's rationale is built on a number the document elsewhere admits isn't settled. This doesn't necessarily invalidate the no-DB decision (static content scales fine well past 100 items), but the stated justification is shaky, and there's no stated threshold at which AD-3 would need revisiting if the real count is much larger. **Fix:** either decouple AD-3's rule from the specific SKU count, or state the threshold/trigger for reconsidering it.

**M2 — AD-1's Rule text is more absolute than the design actually is.**
AD-1's Rule states "The only integration point is outbound." AD-2 establishes a real (if build-time, non-visitor-facing) *inbound* integration point — the sync script reading Squarespace's Products/Inventory API. AD-6 establishes a separate outbound integration to Resend. Taken individually, none of these actually violate AD-1's intent (which — per its Prevents clause — is specifically about cart/session state, not integrations generally), but a story author skimming AD-1 in isolation could reasonably read "the only integration point is outbound" as ruling out AD-2's sync mechanism, or wonder why it doesn't. **Fix:** scope the claim precisely, e.g. "The only *visitor-facing runtime* integration point is outbound" — the Prevents clause already has the right scope; the Rule sentence should match it.

**M3 — Design Paradigm is silent on Next 16's Cache Components / PPR model.**
Confirmed against the repo: `next.config.ts` does not set `cacheComponents`, so it defaults off and the older caching/rendering model applies for now — but this is a genuine, versioned, opt-in paradigm shift in the exact Next.js version this spine is written against (per the bundled docs at `node_modules/next/dist/docs/01-app/01-getting-started/08-caching.md` and `.../02-guides/migrating-to-cache-components.md`), and `AGENTS.md` explicitly instructs reading these breaking-change guides before writing code. The Design Paradigm section states an RSC-first / client-islands model but never takes a position on whether Cache Components (`'use cache'`, PPR-by-default, explicit Suspense-for-dynamic requirements) is in scope for v1 or explicitly out of scope. This is exactly the kind of "whole dimension this altitude owns" the checklist calls out — leaving it silent risks one story enabling `cacheComponents: true` mid-build (changing how every other route must handle async/runtime data) while others assume the conventional model. **Fix:** one sentence in Design Paradigm or Deferred: either "Cache Components stays off for v1" or "adopt on route X once Y."

### Low

**L1 — AD-2's API claim lacks the provenance marker AD-1 uses.**
AD-1 explicitly flags its no-headless-checkout-API claim "(web-confirmed)." AD-2's claim that Squarespace exposes a Products API + Inventory API with API-key auth — arguably just as load-bearing, since the entire sync architecture depends on it — carries no such marker in the spine document, even though `.memlog.md` line 19 indicates this actually was verified (`developers.squarespace.com/commerce-apis`). A reader of the spine alone can't tell verified claims from assumed ones. **Fix:** add "(web-confirmed)" to AD-2 and the Stack table's "Commerce data source" row, matching AD-1's convention.

**L2 — Sync script failure/staleness handling isn't addressed.**
AD-2 describes the happy path (build-time pull → `content/catalog/`) but neither AD-2 nor Deferred says what happens if the Squarespace API call fails, times out, or returns partial data during a build. Does the build fail hard, or does it silently proceed on stale committed data? This is a small but real divergence point for whoever writes `scripts/sync-squarespace.ts`. **Fix:** one line, even if the answer is "deferred, fail loudly for v1."

**L3 — "Live on-garment preview swap" wording momentarily suggests runtime compositing.**
Design Paradigm calls out "the live on-garment preview swap" as client-island behavior. Read alone, this could imply client-side canvas/CSS layering of separate garment + motif images at runtime. Cross-referencing Consistency Conventions ("Image paths ... stored on the product entity, not reconstructed from naming conventions") and the memlog's photo-strategy note (motifs pre-composited onto blank garments) resolves it — the swap is between pre-composited per-product images, not live compositing — but a story author reading only the Design Paradigm section could build the wrong thing. **Fix:** one clarifying clause where "preview swap" is introduced.

## Checklist Items Confirmed Clean (no finding)

- **Brownfield ratification:** Stack table (Next.js 16.3.5, React 19.2.8, TypeScript 5.x, Tailwind 4.x, ESLint 9.x) matches `package.json` verbatim. Current `app/` contains only the default create-next-app scaffold (`layout.tsx`, `page.tsx`, `globals.css`, `favicon.ico`); the Structural Seed source-tree sketch is presented as a build target, not a claim about current state, and doesn't contradict what's actually on disk.
- **Deployment/environments/operations dimension:** explicitly decided (Vercel Pro, per-branch previews, env vars via `vercel env pull`, domain split) or explicitly deferred (analytics/observability) — not silently missing.
- **Mermaid diagrams:** both the Design Paradigm `graph LR` and the Structural Seed `flowchart TB` (including the subgraph-with-title and database-shape node syntax) parse as valid, non-empty Mermaid.
- **Most AD rules are concretely enforceable:** AD-1 (no cart/session calls), AD-3 (no DB/mutation endpoints), AD-5 (no auth middleware/session store), AD-6 (server-side-only API key) are all things a code reviewer or lint rule could actually check.
