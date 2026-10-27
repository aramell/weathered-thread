/**
 * live-merge — overlays a listing's live variations (colors, sizes, stock, price) on its
 * synced catalog entry. Pure apart from the injected fetcher, so it is testable without Next's
 * cache or Etsy. If Etsy can't be reached it serves the last live inventory this instance
 * saw for that listing, and only then the synced entry, so a page never breaks and a blip
 * doesn't snap stock back to the last sync.
 */
import type { CatalogEntry } from "@/content/catalog/types";
import { livePrice, type SyncedVariation } from "./etsy-inventory";

export type FetchVariations = (listingId: number) => Promise<SyncedVariation[]>;

function overlay(entry: CatalogEntry, variations: SyncedVariation[]): CatalogEntry {
  return Object.freeze({
    ...entry,
    variations,
    priceCents: livePrice(variations, entry.priceCents),
    quantity: variations.reduce((total, variation) => total + variation.quantity, 0),
  });
}

/** `fetchVariations` is null when live reads aren't configured (local dev). */
export function createLiveMerge(fetchVariations: FetchVariations | null) {
  const lastGood = new Map<number, SyncedVariation[]>();

  return async function withLiveInventory(entry: CatalogEntry): Promise<CatalogEntry> {
    if (!fetchVariations || entry.state !== "active") return entry;
    try {
      const variations = await fetchVariations(entry.listingId);
      if (variations.length === 0) return entry;
      lastGood.set(entry.listingId, variations);
      return overlay(entry, variations);
    } catch (error) {
      const stale = lastGood.get(entry.listingId);
      console.error(
        `live inventory for "${entry.slug}" unavailable, using ${stale ? "the last live read" : "synced data"}:`,
        error,
      );
      return stale ? overlay(entry, stale) : entry;
    }
  };
}
