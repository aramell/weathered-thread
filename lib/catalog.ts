/**
 * catalog — the one server-only read layer over the merged `content/catalog/` listings
 * (Epic 2 Story 2.3). Merged listings carry the synced Etsy `url`, which must never reach a
 * client bundle (NFR8), so `server-only` makes importing this from a Client Component a
 * build error. That guard covers this module only: import `registry.ts` through here, and
 * never pass an entry (or its `url`) as a prop to a Client Component. Nothing here throws:
 * an unknown slug is `undefined`, an unknown collection or an empty registry is `[]`.
 */
import "server-only";

import { registry } from "@/content/catalog/registry";
import type { CatalogEntry, CatalogListing } from "@/content/catalog/types";

export function createCatalog(source: Readonly<Record<string, CatalogListing>>) {
  // Sorted by slug so every caller sees one stable order. The manifest slug wins over any
  // field of the listing, and entries are frozen because every caller shares them.
  const entries: readonly CatalogEntry[] = Object.keys(source)
    .sort()
    .map((slug) => Object.freeze({ ...source[slug], slug }));

  return {
    getListings: (): CatalogEntry[] => [...entries],
    getListing: (slug: string): CatalogEntry | undefined => entries.find((entry) => entry.slug === slug),
    getListingsByCollection: (collection: string): CatalogEntry[] =>
      entries.filter((entry) => entry.collection === collection),
  };
}

const catalog = createCatalog(registry);

export const getListings = catalog.getListings;
export const getListing = catalog.getListing;
export const getListingsByCollection = catalog.getListingsByCollection;
