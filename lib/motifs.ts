/**
 * motifs — the server-only read model behind the Collection pages and the Product Picker's
 * design list. Built from the synced catalog's authored content, and trimmed to the url-free
 * `Motif` shape so it can be passed to Client Components.
 */
import "server-only";

import { getListings } from "./catalog";
import type { Motif } from "./motif-types";

export function getMotifs(): Motif[] {
  return getListings()
    .filter((listing) => listing.state === "active")
    .map(({ slug, motifName, story, collection }) => ({ slug, name: motifName, story, collection }));
}

export const getMotif = (slug: string): Motif | undefined => getMotifs().find((motif) => motif.slug === slug);

export const getMotifsByCollection = (collection: string): Motif[] =>
  getMotifs().filter((motif) => motif.collection === collection);
