/**
 * live-catalog — the synced catalog with each listing's variations (colors, sizes, stock,
 * price) replaced by Etsy's current inventory. Everything that doesn't change by the minute
 * (name, photos, url, story) still comes from the synced files. Any failure to reach Etsy, or
 * missing credentials (local dev), falls back to the synced variations for that listing, so
 * a page never breaks because Etsy is slow.
 *
 * Etsy allows about 5,000 calls a day; one call per listing per `LIVE_REVALIDATE_SECONDS`
 * keeps even constant traffic well under that.
 */
import "server-only";

import { get, put } from "@vercel/blob";
import { unstable_cache } from "next/cache";

import type { CatalogEntry } from "@/content/catalog/types";
import { getListings } from "./catalog";
import { createLiveEtsy, type StoredTokens, type TokenStore } from "./etsy-live";
import { livePrice } from "./etsy-inventory";

export const LIVE_REVALIDATE_SECONDS = 300;
const TOKEN_PATHNAME = "etsy/live-token.json";

const blobTokenStore: TokenStore = {
  async read() {
    const result = await get(TOKEN_PATHNAME, { access: "private", useCache: false }).catch(() => null);
    if (!result || result.statusCode !== 200) return null;
    try {
      const parsed = (await new Response(result.stream).json()) as Partial<StoredTokens>;
      return typeof parsed.accessToken === "string" &&
        typeof parsed.refreshToken === "string" &&
        typeof parsed.obtainedAt === "number"
        ? (parsed as StoredTokens)
        : null;
    } catch {
      return null;
    }
  },
  async write(tokens) {
    await put(TOKEN_PATHNAME, JSON.stringify(tokens), {
      access: "private",
      allowOverwrite: true,
      addRandomSuffix: false,
      contentType: "application/json",
    });
  },
};

function liveEtsy() {
  const apiKey = process.env.ETSY_API_KEY?.trim();
  // Without a store the rotated refresh token would be lost, so live reads stay off locally.
  if (!apiKey || !process.env.BLOB_READ_WRITE_TOKEN) return null;
  return createLiveEtsy({
    apiKey,
    seedRefreshToken: process.env.ETSY_LIVE_REFRESH_TOKEN?.trim(),
    store: blobTokenStore,
    fetch,
    now: Date.now,
  });
}

// Built once per server instance so the access token is shared across renders.
const live = liveEtsy();

const cachedVariations = (listingId: number) =>
  unstable_cache(
    () => {
      if (!live) throw new Error("live Etsy reads are not configured");
      return live.fetchVariations(listingId);
    },
    ["etsy-inventory", String(listingId)],
    { revalidate: LIVE_REVALIDATE_SECONDS, tags: ["etsy-inventory"] },
  )();

async function withLiveInventory(entry: CatalogEntry): Promise<CatalogEntry> {
  if (!live || entry.state !== "active") return entry;
  try {
    const variations = await cachedVariations(entry.listingId);
    if (variations.length === 0) return entry;
    return Object.freeze({
      ...entry,
      variations,
      priceCents: livePrice(variations, entry.priceCents),
      quantity: variations.reduce((total, variation) => total + variation.quantity, 0),
    });
  } catch (error) {
    console.error(`live inventory for "${entry.slug}" unavailable, using synced data:`, error);
    return entry;
  }
}

export const getLiveListings = (): Promise<CatalogEntry[]> => Promise.all(getListings().map(withLiveInventory));

export async function getLiveListing(slug: string): Promise<CatalogEntry | undefined> {
  const entry = getListings().find((listing) => listing.slug === slug);
  return entry ? withLiveInventory(entry) : undefined;
}
