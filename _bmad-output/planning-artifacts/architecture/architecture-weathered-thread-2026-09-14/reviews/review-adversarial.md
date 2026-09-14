---
name: 'Adversarial Review — Architecture Spine (Weathered Thread)'
type: review
reviews: '{planning_artifacts}/architecture/architecture-weathered-thread-2026-09-14/ARCHITECTURE-SPINE.md'
created: '2026-09-14'
---

# Adversarial Review — ARCHITECTURE-SPINE.md

**Method:** For each Invariant/AD and each row of the Consistency Conventions table, I tried to construct two independent implementers (or two sessions/PRs by the same implementer, separated in time) who each satisfy the literal Rule text but make a different reasonable choice on everything the Rule left unstated. Findings below are ordered roughly by severity — sharpest structural contradiction first, then downstream ambiguities it causes, then process/race issues, then smaller gaps.

---

## Finding 1 (sharpest) — "Product" is simultaneously the synced Squarespace entity and the garment×motif entity

**The clash:** The Naming convention row defines two entities with overlapping claims to being "the sellable thing":

> `garment` (a sellable SKU) ... `product` (one garment × motif pairing — the sellable unit `EXPERIENCE.md` calls "Product")

Both are called "sellable." Then AD-2's Rule says:

> Price, inventory, SKU, and product name are fetched from Squarespace's Products API ... The repo directly authors ... keyed to the **synced product** by SKU.

Squarespace, per the naming table's own definition, only knows `garment` — a single SKU with a price and inventory count. It has no concept of a garment×motif pairing (motif is repo-authored, not in Squarespace's model at all, per AD-2's own sentence). So "synced product" in AD-2's Rule is either (a) loose shorthand for "synced garment," or (b) an assertion that Squarespace SKUs are actually minted per garment×motif combination (i.e., each motif variant is its own Squarespace SKU/product). The spine never says which.

**Concrete divergence:** Two sessions each build against the letter of AD-2 + the naming table and produce incompatible `content/catalog/` shapes:

- **Session A** (builds `scripts/sync-squarespace.ts` first) reads AD-2 literally: Squarespace SKUs = garments, one row per color/size, motif-agnostic. It writes `content/catalog/garments/{sku}.ts`, one file per garment, with no motif dimension at all — motif is a separate authored layer applied later by pairing every garment with every motif in the collection.
- **Session B** (builds `app/product/[sku]/page.tsx` first) reads the naming table literally: `product` is "the sellable unit," so the `[sku]` route param must resolve one-to-one to a product = garment×motif pairing, meaning it expects Squarespace to mint a distinct SKU per motif variant, and expects `content/catalog/{sku}.ts` to already contain a `motif` field on the synced object.

Both are fully AD-2-compliant readings. The result: Session B's route 404s or crashes on every SKU, because Session A's sync output has no motif field and no per-motif SKUs — there's a whole extra dimension of product that either does or doesn't exist in Squarespace, and the spine asserts both.

**Fix — tighten AD-2's Rule (and the Naming row) to pin the SKU granularity explicitly:**

> Add a sentence to AD-2: "Each Squarespace SKU identifies exactly one **garment** (color/size variant), never a motif combination — motif has no representation in Squarespace and is never part of the SKU. The sellable-unit `product` entity (garment × motif) is assembled entirely in the repo by cross-joining every synced `garment` against the motifs authored for its collection; it is never looked up from Squarespace by its own SKU." And correct the Naming row so only `garment` is called "a sellable SKU" — drop "sellable" from the `product` definition or rephrase to "the sellable-*to-the-customer* unit assembled in-repo," so the two rows stop contradicting each other in isolation.

---

## Finding 2 — "the exact matching Squarespace product URL" has no operational definition

**The clash:** AD-1's Rule and the Structural Seed both use "the matching Squarespace product URL" as if it's self-evidently a single, unambiguous field. It resolves at least three different ways, none of which AD-1 or AD-2 rules out:

1. A `url` (or similar) field returned directly by the Squarespace Products API and copied verbatim into `content/catalog/` by the sync script.
2. A URL *constructed* by the app at render time from a template + slug/SKU (e.g. `` `https://shop.weatheredthread.com/product/${slug}` ``), because the API's own URL field may point at Squarespace's default domain (`*.squarespace.com`) rather than the custom-mapped `shop.weatheredthread.com` subdomain established in AD-7 — DNS mapping is a separate concern from what the Products API reports.
3. A URL keyed by `garment` SKU vs. one that somehow encodes the selected `motif` too (relevant once Finding 1 is resolved and `product` ≠ Squarespace's unit).

**Concrete divergence:** Session A's sync script stores whatever `url` Squarespace's API returns, unmodified. Session B's Checkout Handoff component, tested only against Squarespace's admin preview (which shows the custom domain), assumes the stored URL already reflects `shop.weatheredthread.com` and never checks. Both comply with AD-1 and AD-7's literal text. In production, every handoff link sends a paying customer to `weatheredthread.squarespace.com/...` — off-brand mid-checkout, which is the exact continuity failure AD-7 exists to prevent, achieved while both builders followed every AD to the letter.

**Fix — add a Rule clause to AD-1 (or a new short AD-1a):**

> "The synced `url` field is the single source of truth for the Checkout Handoff target and MUST be validated (in the sync script, at sync time — not at render time) to have host `shop.weatheredthread.com`; the sync script fails loudly if Squarespace returns a URL on any other host, rather than allowing it to reach `content/catalog/` unmodified. Handoff components never construct or rewrite this URL themselves — they render the stored field as-is."

---

## Finding 3 — Synced fields vs. authored fields sharing one file invites silent overwrite

**The clash:** AD-2 says the repo "directly authors" motif/story/grouping fields "keyed to the synced product by SKU," and AD-3 says catalog content lives in TS/JSON modules "under `content/`." Neither AD says whether the synced fields (price, inventory, SKU, name, url) and the authored fields (motif name, story copy, collection grouping) live in the **same file per SKU** (one object, two kinds of keys) or **separate files merged at import** (e.g. `content/catalog/synced/{sku}.ts` generated by the script + `content/catalog/authored/{sku}.ts` hand-written, joined by an index).

**Concrete divergence:** Session A (content/copy work) hand-edits fields directly into `content/catalog/{sku}.ts` because that's the only file that exists and it satisfies "TS module under `content/`." Session B, months later, re-runs the sync script per AD-2's "manually triggered" cadence; the script — reasonably, since nothing says otherwise — regenerates `content/catalog/{sku}.ts` wholesale from the API response, because it has no way to know which fields on that file are "its" fields vs. hand-authored ones. Every authored motif name and story paragraph is silently deleted on the next sync run. Both sessions followed AD-2 and AD-3 exactly.

**Fix — add to AD-2's Rule:**

> "Synced and authored data are physically separate files, never merged by a script into one file a human also hand-edits: the sync script owns `content/catalog/{sku}/synced.ts` exclusively (full overwrite on every run is safe) and never writes to `content/catalog/{sku}/authored.ts`, which only a human edits. A per-SKU `index.ts` re-exports the merge of both for consumers."

---

## Finding 4 — Sync script race against concurrent commits/deploys (git-level, not DB-level)

**The clash:** The Deferred section describes the v1 workflow as "run script, commit, redeploy" but no AD assigns ownership of *when* that commit happens relative to other work, or requires the sync commit to be isolated.

**Concrete scenario:** Dev A runs the sync script at 2pm (Squarespace shows price $48), starts a feature branch, and includes the regenerated `content/catalog/` in the same commit as unrelated UI work — a large, slow-moving PR. Dev B runs the sync script independently at 3pm (Squarespace now shows a markdown to $52, or a SKU renamed), on a short-lived branch, commits and merges to `main` immediately. Main now has $52. Dev A's PR, opened before Dev B's change and never rebased, still carries the $48 snapshot bundled inside otherwise-unrelated feature code; when it merges (reviewers approve the UI, don't scrutinize the bundled catalog diff), `main` silently reverts to $48. Nothing violates AD-2 — it never says the sync output must be its own atomic, rebase-checked commit, or that a feature PR must not carry catalog data.

**Fix — add to AD-2's Rule / Deferred:**

> "A sync run's output is always committed on its own, catalog-only commit/PR — never bundled into a feature branch. Any PR touching files under `content/catalog/*/synced.ts` outside of a dedicated sync commit fails review. Before merging a sync commit, the script diffs against the current `main` tip (not the branch's base) so a stale snapshot cannot silently regress newer data."

---

## Finding 5 — "Build-time sync script" is ambiguous between "part of `next build`" and "a manual pre-commit step"

**The clash:** AD-2's Rule calls it a "build-time sync script"; the Deferred section separately says v1 is "manually triggered (run script, commit, redeploy)." These two descriptions point at different execution models and the spine never reconciles them.

**Concrete divergence:** Session A wires `scripts/sync-squarespace.ts` into `package.json`'s `build` script, reading "build-time" literally — it now runs on every Vercel build, requires the Squarespace API key to be present in the **production build environment** (contradicting the Consistency Conventions row's implication that this is a local/CI-triggered credential use, not a prod-runtime one), and — because Vercel's build filesystem is ephemeral and never writes back to git — its output silently vanishes after each deploy, so the catalog actually served is always whatever was last hand-committed, even though the build logs show a "successful sync" every time. Session B (a different route/feature built later, e.g. an admin or debug page) assumes, per the Deferred section, that sync only ever happens manually and offline, and is safe to assume `content/catalog/` is always exactly what's in git with no build-time mutation — and builds a feature (e.g. a "data last synced" timestamp display) that reads a value the build-time version of the script would have silently discarded.

**Fix — rewrite AD-2's Rule to remove the term "build-time" entirely and match the Deferred section:**

> "The sync script is run manually, locally or in a one-off CI job — never invoked from `next build` or any Vercel build/runtime step. Its only effect is writing files that are then committed like any other source change; the Squarespace API key is only ever present in the environment where the script is manually run, never in the Vercel production/preview build or runtime environment."

---

## Finding 6 — Price representation (type/units) unspecified

**The clash:** The Data & formats convention row says prices are "the Squarespace-synced value, formatted for display, never hand-edited" — but never states the *stored* representation: integer cents, a float dollar amount, a pre-formatted currency string, or Squarespace's own price object shape.

**Concrete divergence:** The sync script author stores `price: "$48.00"` (copying Squarespace's display-ready string) since that's the simplest reading of "synced value." The Product-surface author writes `formatPrice(cents: number)` and a price-sort/filter helper for a future Shop listing page, expecting `price: 4800`. One of the two either breaks at import (type error) or silently double-formats/misparses (`"$48.00"` through a cents-formatter renders `"$4800.00"` or `NaN`).

**Fix — add to the Data & formats row:** "Synced price is stored as an integer in the smallest currency unit (cents), never as a formatted string or float; all display formatting happens at render time via one shared `formatPrice()` util in `content/` or `lib/`, never re-implemented per component."

---

## Finding 7 — Image path cardinality/shape unspecified (per-garment vs. per-motif vs. per-product)

**The clash:** AD-4 + the Data & formats row say image paths are "stored on the `product` entity" — singular "path," singular reference — but the picker needs at least: a garment color swatch thumbnail, a motif icon/thumbnail, and an on-garment composite preview per garment×motif pairing (per the paradigm's "live on-garment preview swap"). "Stored on the product entity" doesn't say whether that's one field or a keyed collection, and (per Finding 1) it isn't even settled which entity is "the product."

**Concrete divergence:** The swatch-island builder expects `garment.swatchImage: string`. The Product-surface composite-preview builder expects `product.previewImages: Record<motifId, string>`. Both satisfy "image paths ... stored on the product entity, referenced by path" in isolation; neither's shape matches the other's consumer, so the picker's live-swap either can't find the right image key or the swatch tile has nothing to render.

**Fix — add to AD-4's Rule:** "Every `garment` carries one `swatchImage`. Every `product` (garment×motif pairing) carries one `previewImage` (the on-garment composite). Motifs carry one `motifIcon`. These three fields are the complete, closed set of image references — no other ad hoc image fields are added without a spine update."

---

## Finding 8 — SKU casing/format not pinned; `[sku]` route param vs. stored SKU can mismatch

**The clash:** AD-2 calls SKU "the join key ... never re-derived or guessed" but never constrains its character set, casing, or whether the URL segment `app/product/[sku]/` carries the SKU verbatim or a slugified/lowercased version of it.

**Concrete divergence:** The sync script stores SKU exactly as Squarespace returns it, e.g. `"ST-BeachPlum-M"` (mixed case). A separate session building internal links to the Product surface lowercases and dashes it for URL aesthetics (`/product/st-beachplum-m`), reasoning that's just "the SKU in the URL." Next.js route matching + a straight object lookup by SKU is case-sensitive, so the link 404s or the lookup misses, even though nobody "guessed" or "re-derived" the SKU value in either place — they just disagree on whether the URL segment is the SKU or a case-folded view of it.

**Fix — add to the Data & formats row:** "The `[sku]` route segment is byte-for-byte the stored SKU string, no case-folding or slugification. All internal links use the stored SKU field directly, never a locally re-cased copy."

---

## Finding 9 — Shared picker state across islands has no lifting/ownership rule

**The clash:** The paradigm and AD-5/Consistency table say picker selection is "local component state ... not global, not persisted" — correct for avoiding a global store, but the Product surface has *multiple* separate client islands per the Structural Seed (`motif-tile`, `garment-swatch`, `sticky CTA`) that must all reflect one coherent in-progress selection. "Local" doesn't say where the shared state actually lives (a single wrapping Client Component all three mount under, vs. each with its own `useState` synced some other way).

**Concrete divergence:** Session A (Product surface) creates one `'use client' ProductPickerShell` that owns `useState` for motif+color+size and passes it down as props to all three islands — one shared local state, zero global store, fully AD-5-compliant. Session B, reusing the `sticky-cta` island on a different surface (e.g. a Collection Story page that also lets you jump into a quick-pick), gives it its own independent `useState`, since nothing says islands can't each manage their own local slice — also fully compliant, and also correct in isolation. When both patterns exist in the same codebase, a third builder wiring the two together on one page gets desynced state (the swatch shows one color, the sticky bar's Add-to-Bag reflects another) with no AD violated anywhere.

**Fix — add to the paradigm section or a new short AD:** "Exactly one Client Component per Product surface instance — `ProductPickerShell` — owns all picker `useState`; every island under it (`motif-tile`, `garment-swatch`, `sticky-cta`) is presentational, receiving selection state and a setter via props/context, never instantiating its own selection state."

---

## Finding 10 — AD-6's "server action / route handler" leaves the mechanism (and validation/response contract) unchosen

**The clash:** AD-6 explicitly offers two mechanisms ("a server action / route handler") as interchangeable, with no shared contract for validation, error shape, or success response required either way.

**Concrete divergence:** If the email-capture form appears in more than one place (homepage banner now; a footer or exit-intent variant later — plausible given "homepage email signup" is scoped narrowly but Resend integration invites reuse), one session implements it as a Server Action returning a redirect/`useActionState` error object, the other as a POST route handler returning JSON, each with its own ad hoc email-regex validation. Both satisfy AD-6's Rule ("posts to a server action / route handler that calls Resend... key never reaches client") to the letter, but produce two different error-handling UX patterns and duplicate/diverging validation logic (e.g. one accepts `user@localhost`, the other doesn't).

**Fix — tighten AD-6's Rule:** "The signup form posts to a single Server Action, `subscribeEmail` in `app/(site)/actions.ts` — not a route handler. All email-capture entry points on the site call this same action; email validation lives once, in this action, never re-implemented client-side or in a second entry point."

---

## Finding 11 — Env var names for credentials aren't pinned

**The clash:** The State & cross-cutting row says credentials "live only in Vercel environment variables, never committed" but never names the variables. AD-2 and AD-6 each imply a credential exists (Squarespace API key, Resend key) without naming its env var key.

**Concrete divergence:** The sync script author sets/reads `SQUARESPACE_API_KEY`; a later session adding a build-log/status route or a second script (e.g. a manual "check sync freshness" CLI) reads `SS_API_KEY` or `SQUARESPACE_TOKEN`, guessing at a name since none is specified — gets `undefined`, and either the script fails loudly (best case) or, if not defensively coded, silently no-ops.

**Fix — add a small table to the State & cross-cutting row or Stack section:** pin `SQUARESPACE_API_KEY` and `RESEND_API_KEY` as the exact, only-ever-used variable names, declared once in the spine so every consumer reads the same key.

---

## Summary table

| # | Divergent pair | Root cause in spine | Proposed fix |
|---|---|---|---|
| 1 | Sync script's per-garment SKU model vs. Product route's per-(garment×motif) SKU model | AD-2 says "synced product," naming table calls both `garment` and `product` "sellable" | Tighten AD-2 Rule + fix Naming row wording |
| 2 | Sync script storing raw Squarespace API URL vs. Handoff component assuming custom-domain URL | AD-1 "matching product URL" undefined operationally | Add validation clause to AD-1 |
| 3 | Hand-authored motif/story fields vs. sync script's full-file regeneration | AD-2 doesn't separate synced vs. authored files | Split into `synced.ts` / `authored.ts` per SKU |
| 4 | Two devs' independent sync-and-commit timings clobbering each other on merge | AD-2/Deferred don't isolate sync commits or require freshness checks | Dedicated sync-only commits, diff-against-main-tip check |
| 5 | Sync wired into `next build` (ephemeral, silently lossy) vs. treated as manual-only | AD-2 says "build-time," Deferred says "manually triggered" — contradictory | Remove "build-time" language; sync is manual/CI-only, never in Vercel build |
| 6 | Price stored as formatted string vs. integer cents | Data & formats row doesn't specify stored type/units | Pin integer cents + one shared `formatPrice()` |
| 7 | `garment.swatchImage` vs. `product.previewImages[motifId]` shape mismatch | AD-4 says "stored on the product entity" without specifying cardinality | Enumerate the closed set of image fields per entity |
| 8 | Verbatim-case SKU vs. lowercased/slugified SKU in route links | AD-2 doesn't pin SKU casing/format | Route segment = stored SKU, byte-for-byte |
| 9 | One shared `ProductPickerShell` state owner vs. each island with its own local state | "Local component state" doesn't say which component | Name the single state-owning shell component |
| 10 | Server Action vs. Route Handler for email capture, each with its own validation | AD-6 offers both mechanisms as equivalent | Pick Server Action only, name the file/function |
| 11 | `SQUARESPACE_API_KEY` vs. `SS_API_KEY` vs. `SQUARESPACE_TOKEN` | No canonical env var names given anywhere | Pin exact env var names in the Stack/State row |

**Overall assessment:** The spine correctly rules out the *obvious* divergences (no DB, no global store, no shared cart, no auth) but leaves the *shape* of its central shared artifact — the synced+authored catalog keyed by SKU, and what "the matching product URL" concretely is — underspecified enough that two AD-compliant builders would produce catalog data and consuming code that cannot import each other. Finding 1 is the load-bearing one: nearly every other finding (2, 3, 6, 7, 8) is a downstream symptom of "product" and "SKU granularity" not being pinned to a single entity.
