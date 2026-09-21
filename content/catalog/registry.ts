/**
 * The merged listings the app can read, keyed by manifest slug (Story 2.3). Read it only
 * through `lib/catalog.ts`: only that module is `server-only`, and a listing carries the
 * Etsy `url`, so never import this file from a Client Component. Hand-maintained: when you add a listing, import its `listing`
 * and add one key. The key is the slug from `listings.json` and the directory name.
 *
 *   import { listing as pickleball } from "./pickleball";
 *   import type { CatalogListing } from "./types";
 *   export const registry = { pickleball } as const satisfies Record<string, CatalogListing>;
 *
 * `npm run check:catalog` verifies this file: every key must be a slug in `listings.json` with a
 * directory, and each entry must be that directory's `index.ts` `listing`.
 */
import type { CatalogListing } from "./types";

export const registry = {} as const satisfies Record<string, CatalogListing>;
