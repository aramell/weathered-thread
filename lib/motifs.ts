/**
 * motifs — the server-only read model behind the Collection pages and the Product Picker's
 * design list. Built from the catalog's authored content (names, stories and this site's own photos), and trimmed to the url-free
 * `Motif` shape so it can be passed to Client Components.
 */
import "server-only";

import type { CatalogEntry } from "@/content/catalog/types";
import { getListings } from "./catalog";
import type { Motif } from "./motif-types";

/** Newest first, like Etsy's "Most Recent" (ties fall back to slug so the order is stable). */
export function buildMotifs(listings: readonly CatalogEntry[]): Motif[] {
  return listings
    .filter((listing) => listing.state === "active")
    .sort((a, b) => b.createdTimestamp - a.createdTimestamp || a.slug.localeCompare(b.slug))
    .map(({ slug, priceCents, motifName, story, collection, photos }) => ({
      slug,
      name: motifName,
      priceCents,
      story,
      collection,
      images: photos.map(({ src, width, height, alt }) => ({ url: src, width, height, alt })),
    }));
}

/** From the synced files only: names, photos and stories, for static params and metadata. */
export const getMotifs = (): Motif[] => buildMotifs(getListings());

export const getMotif = (slug: string): Motif | undefined => getMotifs().find((motif) => motif.slug === slug);

export const getMotifsByCollection = (collection: string): Motif[] =>
  getMotifs().filter((motif) => motif.collection === collection);
