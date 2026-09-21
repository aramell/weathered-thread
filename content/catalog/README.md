# Catalog content

One directory per design listing. `{slug}` is the slug from `listings.json` (lowercase letters, digits, hyphens), used byte-for-byte.

```text
content/catalog/
  listings.json        # human-owned: slug -> Etsy listing_id (read by the sync)
  types.ts             # AuthoredContent, the shape of authored.ts
  {slug}/
    synced.ts          # owned by `npm run sync:etsy`; overwritten every run — never edit
    authored.ts        # yours: motif name, story copy, collection
    index.ts           # yours: re-exports the merge; the app imports this
```

## Adding a listing

1. Add `"{slug}": <listing_id>` to `listings.json` and run `npm run sync:etsy`. This writes `{slug}/synced.ts`.
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

4. Run `npm run check:catalog`. It fails if a file is missing, a field is blank, `collection` is not a slug, or `index.ts` is not the exact merge. Also run `npx tsc --noEmit`: only the type checker catches an extra or misspelled field in `authored.ts` (via `satisfies`), and `check:catalog` does not type-check.

Re-running the sync only ever rewrites `synced.ts`; `authored.ts` and `index.ts` are never touched.

`motifName` is deliberately not called `name`: the synced Etsy title is `name`, and the merge must not shadow it. Which one the site displays is decided where it is rendered.
