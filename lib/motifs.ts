/**
 * motifs — the server-only read model behind the Collection pages and the Product Picker's
 * design list. Built from the synced catalog's authored content, and trimmed to the url-free
 * `Motif` shape so it can be passed to Client Components.
 */
import "server-only";

import { getListings } from "./catalog";
import type { Motif } from "./motif-types";

/** Newest first, like Etsy's "Most Recent" (ties fall back to slug so the order is stable). */
export function getMotifs(): Motif[] {
  return getListings()
    .filter((listing) => listing.state === "active")
    .sort((a, b) => b.createdTimestamp - a.createdTimestamp || a.slug.localeCompare(b.slug))
    .map(({ slug, priceCents, motifName, story, collection, images }) => ({
      slug,
      name: motifName,
      priceCents,
      story,
      collection,
      images: images.map(({ url, width, height, alt }) => ({ url, width, height, alt })),
    }));
}

export const getMotif = (slug: string): Motif | undefined => getMotifs().find((motif) => motif.slug === slug);

export const getMotifsByCollection = (collection: string): Motif[] =>
  getMotifs().filter((motif) => motif.collection === collection);
