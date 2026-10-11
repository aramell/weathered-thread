# Catalog content

One directory per design listing. `{slug}` is the slug from `listings.json` (lowercase letters, digits, hyphens), used byte-for-byte.

```text
content/catalog/
  listings.json        # human-owned: slug -> Etsy listing_id (read by the sync)
  types.ts             # AuthoredContent (shape of authored.ts) and the merged-listing types
  registry.ts          # yours: one import + one key per listing; lib/catalog.ts reads it
  {slug}/
    synced.ts          # owned by `npm run sync:etsy`; overwritten every run — never edit
    authored.ts        # yours: motif name, story copy, collection
    index.ts           # yours: re-exports the merge; the app imports this
```

## Adding a listing

1. Add `"{slug}": <listing_id>` to `listings.json` and run `npm run sync:etsy`. This writes `{slug}/synced.ts`, including per-variation inventory. The sync needs `ETSY_REFRESH_TOKEN` in `.env.local`: run `npm run auth:etsy` once (it opens Etsy consent; register `http://localhost:3003/callback` as a redirect URI on the Etsy app first). The sync rotates the token in `.env.local` on every run; if you go ~90 days without syncing, re-run `auth:etsy`.
2. Create `{slug}/authored.ts`:

   ```ts
   import type { AuthoredContent } from "../types";

   export const authored = {
     motifName: "SIC Water Tower",
     story: "A water tower on the skyline means you're close.",
     collection: "sea-isle",
   } as const satisfies AuthoredContent;
   ```

3. Create `{slug}/index.ts`:

   ```ts
   import { authored } from "./authored";
   import { synced } from "./synced";

   export const listing = { ...synced, ...authored } as const;
   ```

4. Register it in `registry.ts` so the app can read it: import the listing and add it under its slug.

   ```ts
   import { listing as sicWaterTower } from "./sic-water-tower";
   import type { CatalogListing } from "./types";

   export const registry = { "sic-water-tower": sicWaterTower } as const satisfies Record<string, CatalogListing>;
   ```

   `check:catalog` verifies `registry.ts` against `listings.json` and the directories, so a listing you forget here (or a key with no listing behind it) fails the check instead of silently missing from the site.

5. Run `npm run check:catalog`. It fails if a file is missing, a field is blank, `collection` is not a slug, `index.ts` is not the exact merge, or `listings.json`, `registry.ts` and the directories disagree on the slugs (or a registry entry is not its directory's `listing`). Also run `npx tsc --noEmit`: only the type checker catches an extra or misspelled field in `authored.ts` (via `satisfies`), and `check:catalog` does not type-check.

Renaming or removing a listing means changing the directory, the `listings.json` key and the `registry.ts` key together; `check:catalog` names whichever slug you missed.

App code reads listings only through `lib/catalog.ts` (`getListings`, `getListing(slug)`, `getListingsByCollection`). Only `lib/catalog.ts` is `server-only` (a merged listing carries the Etsy `url`, which must never reach a client bundle), so import `registry.ts` through it and never pass an entry or its `url` as a prop to a Client Component.

Re-running the sync only ever rewrites `synced.ts`; `authored.ts` and `index.ts` are never touched.

`motifName` is deliberately not called `name`: the synced Etsy title is `name`, and the merge must not shadow it. Which one the site displays is decided where it is rendered.
