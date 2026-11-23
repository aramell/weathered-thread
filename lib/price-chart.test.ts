/**
 * Price parity (Story 5.3): every price the shop shows and the bag charges must equal the
 * owner's "Our Collections & Pricing" chart (Nov 2026). Prices come from the synced Etsy
 * catalog through `buildMotifShops`, the same path `priceBag` uses, so a wrong synced price
 * fails here. Run via `npm run test:catalog`.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getListings } from "./catalog";
import { buildMotifShops } from "./shop";

/** Cents by garment style. The Weathered Thread collection is the brand mark; every place-based collection is "custom". */
const CHART = {
  brand: { "Heavyweight Tee": 3200, "Long Sleeve Tee": 3400, "Lightweight Crewneck": 4400, "Heavyweight Crewneck": 5200 },
  custom: { "Heavyweight Tee": 3600, "Long Sleeve Tee": 3800, "Lightweight Crewneck": 4800, "Heavyweight Crewneck": 5600 },
} as const;

/**
 * Known disagreements between the synced Etsy data and the chart, as "design | style | color | size".
 * Empty now: the stacked logo's Ivory Lightweight Crewneck S and M were $50 on Etsy and are $44
 * after the Nov 2026 re-sync. Add an entry only while a wrong Etsy price waits to be fixed; the
 * test fails if a listed mismatch no longer exists, so this list cannot go stale.
 */
const KNOWN_ETSY_MISMATCHES = new Set<string>([]);

describe("price chart parity", () => {
  const listings = getListings();
  const shops = buildMotifShops(listings);
  const found = new Set<string>();

  for (const listing of listings.filter((entry) => entry.state === "active")) {
    const tier = listing.collection === "weathered-thread" || listing.collection === "brand" ? "brand" : "custom";
    it(`${listing.slug} (${tier}) matches the chart`, () => {
      const shop = shops[listing.slug];
      assert.ok(shop && shop.garmentTypes.length > 0, "design has a shop");
      for (const garment of shop.garmentTypes) {
        const expected = CHART[tier][garment.name as keyof (typeof CHART)[typeof tier]];
        assert.ok(expected, `chart has a price for ${garment.name}`);
        for (const color of garment.colors) {
          for (const size of color.sizes) {
            if (size.priceCents === expected) continue;
            const key = `${listing.slug} | ${garment.name} | ${color.name} | ${size.name}`;
            found.add(key);
            assert.ok(
              KNOWN_ETSY_MISMATCHES.has(key),
              `${key}: site ${size.priceCents}c, chart ${expected}c`,
            );
          }
        }
      }
    });
  }

  it("every known mismatch still exists (remove entries once Etsy is fixed)", () => {
    for (const key of KNOWN_ETSY_MISMATCHES) assert.ok(found.has(key), `${key} no longer mismatches; delete it`);
  });
});
