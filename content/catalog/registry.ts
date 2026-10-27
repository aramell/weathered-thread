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
import { listing as weatheredThreadLogo } from "./weathered-thread-logo";
import { listing as sicIconicBoat } from "./sic-iconic-boat";
import { listing as sicExit17 } from "./sic-exit-17";
import { listing as sicNauticalMap } from "./sic-nautical-map";
import { listing as sicWaterTower } from "./sic-water-tower";
import { listing as sicSmile } from "./sic-smile";
import { listing as sicWave } from "./sic-wave";
import { listing as wtHorizontalLogo } from "./wt-horizontal-logo";
import { listing as wtMinimalistLogo } from "./wt-minimalist-logo";
import type { CatalogListing } from "./types";

export const registry = {
  "weathered-thread-logo": weatheredThreadLogo,
  "sic-iconic-boat": sicIconicBoat,
  "sic-exit-17": sicExit17,
  "sic-nautical-map": sicNauticalMap,
  "sic-water-tower": sicWaterTower,
  "sic-smile": sicSmile,
  "sic-wave": sicWave,
  "wt-horizontal-logo": wtHorizontalLogo,
  "wt-minimalist-logo": wtMinimalistLogo,
} as const satisfies Record<string, CatalogListing>;
