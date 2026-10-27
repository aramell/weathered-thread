import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CatalogEntry } from "@/content/catalog/types";
import type { SyncedVariation } from "./etsy-inventory";
import { createLiveMerge } from "./live-merge";

const variation = (size: string, priceCents: number, quantity: number): SyncedVariation => ({
  productId: 1,
  options: { Size: size },
  priceCents,
  quantity,
});

const synced = [variation("M", 3000, 9)];

const entry = (over: Partial<CatalogEntry> = {}) =>
  ({
    slug: "sic-wave",
    listingId: 11,
    state: "active",
    priceCents: 3000,
    quantity: 9,
    variations: synced,
    ...over,
  }) as unknown as CatalogEntry;

describe("live inventory merge", () => {
  it("replaces variations, price and quantity with Etsy's", async () => {
    const live = [variation("M", 3600, 0), variation("L", 4000, 2), variation("XL", 4200, 3)];
    const merge = createLiveMerge(async () => live);

    const merged = await merge(entry());

    assert.deepEqual(merged.variations, live);
    assert.equal(merged.priceCents, 4000);
    assert.equal(merged.quantity, 5);
    assert.equal(merged.slug, "sic-wave");
  });

  it("returns the synced entry untouched when live reads aren't configured", async () => {
    const original = entry();
    assert.equal(await createLiveMerge(null)(original), original);
  });

  it("never asks Etsy about an inactive listing", async () => {
    let calls = 0;
    const merge = createLiveMerge(async () => {
      calls += 1;
      return [variation("M", 1, 1)];
    });
    const original = entry({ state: "draft" } as Partial<CatalogEntry>);

    assert.equal(await merge(original), original);
    assert.equal(calls, 0);
  });

  it("keeps the synced entry when Etsy returns no variations", async () => {
    const original = entry();
    assert.equal(await createLiveMerge(async () => [])(original), original);
  });

  it("falls back to the synced entry when the first read fails", async () => {
    const original = entry();
    const merge = createLiveMerge(async () => {
      throw new Error("503");
    });
    const logged = console.error;
    console.error = () => {};
    try {
      assert.equal(await merge(original), original);
    } finally {
      console.error = logged;
    }
  });

  it("serves the last live read, not the synced data, when a later read fails", async () => {
    const live = [variation("L", 4000, 2)];
    let fail = false;
    const merge = createLiveMerge(async () => {
      if (fail) throw new Error("timeout");
      return live;
    });
    await merge(entry());
    fail = true;

    const logged = console.error;
    console.error = () => {};
    try {
      const merged = await merge(entry());
      assert.deepEqual(merged.variations, live);
      assert.equal(merged.quantity, 2);
    } finally {
      console.error = logged;
    }
  });
});
