# Epic 2 Context: Catalog Data Pipeline

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

The site owner needs real design-listing commerce data (price, inventory, name, Etsy listing URL) synced from Etsy into the site, and a place to author the motif/story content the commerce listing doesn't carry — together producing the single structured catalog that every later epic (browsing, the picker, checkout handoff) renders from. Etsy remains the commerce source of truth; nothing here duplicates or hand-maintains price/inventory independently, and nothing here builds visitor-facing UI.

## Stories

- Story 2.1: Sync Etsy Catalog Data
- Story 2.2: Author Motif & Story Content Per Design Listing

## Requirements & Constraints

- Catalog data (price, inventory, name, Etsy listing URL) must be synced from Etsy's Open API v3 into the site's static content via a manually-run sync script — never invoked from `next build` or any Vercel build/runtime step.
- Motif, story, and collection-grouping content is authored directly in the repo and joined to each design's synced Etsy listing data (join key: open architecture item for Story 2.1).
- The site renders entirely from static/build-time-synced content at request time — no live runtime calls to Etsy from a visitor-facing request.
- Catalog price/inventory shown on the custom site must never diverge from what Etsy actually charges (sync integrity).
- Every synced listing URL's host must be etsy.com (or a subdomain); a URL on any other host must fail the sync loudly rather than be written. The raw etsy.com URL never appears in site markup — handoff links use the `shop.weatheredthread.com` host (Epic 4). The synced `url` is read server-side only and never passed as a prop to a Client Component.

## Technical Decisions

- The catalog is one Etsy listing per design (motif), with three variation axes: garment style (long-sleeve tee, short-sleeve tee, heavyweight crew, lightweight crew), color (ivory, pepper, blue jean), and size (S/M/L on tees). Motif is therefore present in the commerce source, one listing per motif. `product` (garment × motif) is still assembled in-repo and shares its motif's listing URL. A listing URL is per design, so the handoff cannot preselect style/color/size.
- `scripts/sync-etsy.ts` runs manually only (local or one-off CI job). Every call sends `x-api-key: <keystring>:<shared_secret>` to Etsy's Open API v3 (the public read-only endpoints it uses need no OAuth). It fetches price, inventory, name, and listing `url` and writes `content/catalog/{listing}/synced.ts` — a file it fully owns and overwrites on every run, all-or-nothing: any fetch error means it writes nothing rather than a partial file, and it exits with a clear error message.
- It validates each returned listing URL's host is etsy.com (or a subdomain) at sync time, failing loudly (writing nothing) if any URL resolves elsewhere.
- The script never writes to `content/catalog/{listing}/authored.ts` — that file is human-edited only (motif name, place/story copy, collection grouping) and must be left untouched by every sync run, even when it overwrites `synced.ts`.
- Before writing, the script diffs against `main`'s current tip and flags it rather than silently overwriting if a new run would regress a previously-synced field (e.g. an older price) — a stale snapshot must not silently clobber newer data. The exact mechanic (warn-and-write / skip-that-listing / abort-the-run) is a per-story decision, not fixed here.
- A sync run's output is always its own catalog-only commit, never bundled into a feature branch.
- `content/catalog/{listing}/index.ts` re-exports the merge of `synced.ts` and `authored.ts` as one object — this merged object is what the rest of the app imports.
- `package.json`'s `build` script must never reference `sync-etsy.ts`.
- The join key between a repo motif and its Etsy listing is decided in Story 2.1 (open architecture item); once chosen it is never re-derived or guessed, and is used byte-for-byte (no case-folding or slugification) elsewhere in the app (e.g. the `product/[listing]` route segment).
- Price is stored as an integer in cents, never a formatted string or float.
- `ETSY_API_KEY` holds the full `<keystring>:<shared_secret>` string, exists only where the sync script is manually run — never in the Vercel production/preview build or runtime environment — and is never referenced from a Client Component.
- All catalog and narrative content is plain TypeScript/JSON modules under `content/`, imported at build/request time — no database, ORM, or CMS for this batch-updated catalog (current scale: on the order of one listing per authored Sea Isle motif, 13 today).
- Image fields follow a closed set defined elsewhere (`garment.swatchImage`, `product.previewImage`, `motif.motifIcon`) — Epic 2's authored/synced content should populate these, not invent new image fields.
- Open items to resolve before or during Story 2.1: Etsy app approval / access tier; the Etsy API Terms limits on storing listing data (etsy.com/legal/api was unreadable, so unverified); crew size options unconfirmed; how per-combination price/inventory map into the synced shape. The same item also covers the catalog-model details the per-design listing implies: what identifies a `product` in its route (a listing key alone identifies only the design, not style/color); where garment-level content (`swatchImage`, style/color) lives now that catalog directories are per listing; which name is displayed (the authored motif name or the synced listing title); how a style/color a design is not offered in appears in the picker; whether per-combination price/inventory are readable without OAuth; and how the existing placeholder garment types, colorways and sizes (`lib/placeholder-shop-data.ts`, Story 3.1 — e.g. bay, XL, crewneck-sweatshirt) reconcile with the Etsy "garment style" axis.

## Cross-Story Dependencies

- Story 2.2 depends on Story 2.1 having already produced `content/catalog/{listing}/synced.ts` for a listing before `authored.ts` can be created against it.
- Every later epic (Epic 1's homepage/collection content, Epic 3's browsing/picker, Epic 4's checkout handoff forward) reads from the merged `content/catalog/{listing}/index.ts` this epic produces — Epic 2 is a hard prerequisite for real (non-placeholder) data anywhere else in the app.
