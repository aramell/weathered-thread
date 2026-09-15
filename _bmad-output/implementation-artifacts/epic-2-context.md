# Epic 2 Context: Catalog Data Pipeline

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

The site owner needs real garment commerce data (price, inventory, SKU, name, product URL) synced from Squarespace into the site, and a place to author the motif/story content Squarespace has no model for — together producing the single structured catalog that every later epic (browsing, the picker, checkout handoff) renders from. Squarespace remains the commerce source of truth; nothing here duplicates or hand-maintains price/inventory/SKU independently, and nothing here builds visitor-facing UI.

## Stories

- Story 2.1: Sync Squarespace Garment Data
- Story 2.2: Author Motif & Story Content Per Garment

## Requirements & Constraints

- Catalog data (price, inventory, SKU, product name, Squarespace product URL) must be synced from Squarespace's Products + Inventory API into the site's static content via a manually-run sync script — never invoked from `next build` or any Vercel build/runtime step.
- Motif, story, and collection-grouping content is authored directly in the repo, keyed to synced garment data by SKU.
- The site renders entirely from static/build-time-synced content at request time — no live runtime calls to Squarespace from a visitor-facing request.
- Catalog price/inventory/SKU shown on the custom site must never diverge from what Squarespace actually charges (sync integrity).
- Every synced product URL's host must be `shop.weatheredthread.com`; a URL on any other host must fail the sync loudly rather than be written.

## Technical Decisions

- Each Squarespace SKU identifies exactly one `garment` (a color/size variant). Motif has no representation in Squarespace and is never part of the SKU. `product` (garment × motif) is assembled entirely in-repo, never looked up from Squarespace by its own SKU.
- `scripts/sync-squarespace.ts` runs manually only (local or one-off CI job). It fetches price, inventory, SKU, name, and product `url` via API-key auth (`SQUARESPACE_API_KEY`) and writes `content/catalog/{sku}/synced.ts` — a file it fully owns and overwrites on every run, all-or-nothing: any fetch error means it writes nothing rather than a partial file, and it exits with a clear error message.
- It validates each returned product URL's host is `shop.weatheredthread.com` at sync time, failing loudly (writing nothing) if any URL resolves elsewhere.
- The script never writes to `content/catalog/{sku}/authored.ts` — that file is human-edited only (motif name, place/story copy, collection grouping) and must be left untouched by every sync run, even when it overwrites `synced.ts`.
- Before writing, the script diffs against `main`'s current tip and flags it rather than silently overwriting if a new run would regress a previously-synced field (e.g. an older price) — a stale snapshot must not silently clobber newer data. The exact mechanic (warn-and-write / skip-that-SKU / abort-the-run) is a per-story decision, not fixed here.
- A sync run's output is always its own catalog-only commit, never bundled into a feature branch.
- `content/catalog/{sku}/index.ts` re-exports the merge of `synced.ts` and `authored.ts` as one object — this merged object is what the rest of the app imports.
- `package.json`'s `build` script must never reference `sync-squarespace.ts`.
- SKU is the join key between synced and authored content — never re-derived or guessed; the stored SKU string is used byte-for-byte (no case-folding or slugification) elsewhere in the app (e.g. the `[sku]` route segment).
- Price is stored as an integer in cents, never a formatted string or float.
- `SQUARESPACE_API_KEY` exists only where the sync script is manually run — never in the Vercel production/preview build or runtime environment — and is never referenced from a Client Component.
- All catalog and narrative content is plain TypeScript/JSON modules under `content/`, imported at build/request time — no database, ORM, or CMS for this batch-updated catalog (current scale: ~10-12 garment SKUs).
- Image fields follow a closed set defined elsewhere (`garment.swatchImage`, `product.previewImage`, `motif.motifIcon`) — Epic 2's authored/synced content should populate these, not invent new image fields.
- Squarespace plan tier for Inventory API access is unconfirmed (may require a higher Commerce tier than Basic) — verify access before relying on the sync script working end-to-end.

## Cross-Story Dependencies

- Story 2.2 depends on Story 2.1 having already produced `content/catalog/{sku}/synced.ts` for a garment before `authored.ts` can be created against it.
- Every later epic (Epic 1's homepage/collection content, Epic 3's browsing/picker, Epic 4's checkout handoff URL) reads from the merged `content/catalog/{sku}/index.ts` this epic produces — Epic 2 is a hard prerequisite for real (non-placeholder) data anywhere else in the app.
