# Epic 2 Context: Catalog Data Pipeline

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

The site owner needs real design-listing commerce data (price, inventory, name, Etsy listing URL) synced from Etsy into the site, and a place to author the motif/story content the commerce listing doesn't carry — together producing the single structured catalog that every later epic (browsing, the picker, checkout handoff) renders from. Etsy remains the commerce source of truth; nothing here duplicates or hand-maintains price/inventory independently, and nothing here builds visitor-facing UI.

## Stories

- Story 2.1: Sync Etsy Catalog Data
- Story 2.2: Author Motif & Story Content Per Design Listing

## Requirements & Constraints

- Catalog data (price, inventory, name, Etsy listing URL) is synced from Etsy's Open API v3 into static content by a manually-run script — never invoked from `next build` or any Vercel build/runtime step. No live Etsy calls from a visitor-facing request.
- Motif, story, and collection-grouping content is authored directly in the repo and joined to each design's synced listing data.
- Catalog price/inventory shown on the site must never diverge from what Etsy charges (sync integrity).
- Every synced listing URL's host must be etsy.com (or a subdomain), else the sync fails loudly. The raw etsy.com URL never appears in site markup (handoff uses the `shop.weatheredthread.com` host, Epic 4); the synced `url` is read server-side only and never passed as a prop to a Client Component.

## Technical Decisions

- One Etsy listing per design (motif), with variation axes garment style, color, and size. `product` (garment × motif) is assembled in-repo and shares its motif's listing URL; a listing URL is per design, so handoff cannot preselect style/color/size.
- `content/catalog/{listing}/synced.ts` is fully owned by the sync script (overwritten every run, all-or-nothing). `authored.ts` is human-edited only (motif name, place/story copy, collection grouping) and untouched by every sync run. `index.ts` re-exports the merge of both as one object — the object the rest of the app imports.
- The join key between a repo motif and its listing is the manifest slug in `content/catalog/listings.json` (decided in Story 2.1, `^[a-z0-9-]+$`). It is the `content/catalog/{slug}/` directory name and is used byte-for-byte (no case-folding or slugification), including as the `product/[listing]` route segment.
- The sync sends `x-api-key: <keystring>:<shared_secret>` on every call, is all-or-nothing (any fetch error writes nothing), warns before writing a previously-synced field that would regress (diffed against `main`), and each run is its own catalog-only commit. `package.json`'s `build` script must never reference `sync-etsy.ts`.
- Price is an integer in cents; display formatting goes through one shared `formatPrice()` util.
- All catalog and narrative content is plain TypeScript/JSON modules under `content/` — no database, ORM, or CMS (scale: about 13 listings, one per Sea Isle motif).
- Image fields are a closed set (`garment.swatchImage`, `product.previewImage`, `motif.motifIcon`); authored/synced content populates these and does not invent new ones.
- `ETSY_API_KEY` (full `<keystring>:<shared_secret>`) exists only where the sync is manually run — never in Vercel env, never in a Client Component.
- Still open: per-variation (style/color/size) price and inventory need OAuth `listings_r` (the key alone reads listing-level data only), so the sync is listing-level for now; Etsy app approval / access tier and the Etsy API Terms limits on storing listing data are unverified; crew size options are unconfirmed.
- Open items still on the catalog model: what identifies a `product` in its route; where garment-level content (`swatchImage`, style/color) lives under per-listing directories; whether the displayed name is the authored motif name or the synced title; how a style/color a design isn't offered in appears in the picker; how placeholder garment types/colors/sizes (`lib/placeholder-shop-data.ts`) reconcile with Etsy's style axis.

## Cross-Story Dependencies

- Story 2.2 depends on Story 2.1 having produced `content/catalog/{listing}/synced.ts` for a listing before `authored.ts` can be authored against it.
- Every later epic (Epic 1 collection content, Epic 3 browsing/picker, Epic 4 checkout handoff) reads from the merged `content/catalog/{listing}/index.ts` — Epic 2 is a hard prerequisite for real (non-placeholder) data anywhere else in the app.
