/**
 * motifs — the server-only read model behind the Collection pages and the Product Picker's
 * design list. Built from the synced catalog's authored content, and trimmed to the url-free
 * `Motif` shape so it can be passed to Client Components.
 */
import "server-only";

import type { CatalogEntry } from "@/content/catalog/types";
import { getListings } from "./catalog";
import { getLiveListings } from "./live-catalog";
import type { Motif } from "./motif-types";

/** Newest first, like Etsy's "Most Recent" (ties fall back to slug so the order is stable). */
export function buildMotifs(listings: readonly CatalogEntry[]): Motif[] {
  return listings
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

/** From the synced files only: names, photos and stories, for static params and metadata. */
export const getMotifs = (): Motif[] => buildMotifs(getListings());

export const getMotif = (slug: string): Motif | undefined => getMotifs().find((motif) => motif.slug === slug);

/** Same designs with the price Etsy shows right now. Use wherever a price is rendered. */
export const getLiveMotifs = async (): Promise<Motif[]> => buildMotifs(await getLiveListings());

export const getLiveMotifsByCollection = async (collection: string): Promise<Motif[]> =>
  (await getLiveMotifs()).filter((motif) => motif.collection === collection);
