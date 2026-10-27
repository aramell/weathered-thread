/**
 * Exercises lib/catalog.ts against fixture registries — one test per accessor row of
 * Story 2.3's I/O & Edge-Case Matrix, run with `npm run test:catalog`. That script passes
 * `--conditions react-server`, which turns the module's `server-only` import into a no-op;
 * run bare, this file throws on that import. The guard itself is tested in a child process.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import path from "node:path";
import { describe, it } from "node:test";
import { promisify } from "node:util";

import { registry as committedRegistry } from "@/content/catalog/registry";

import type { CatalogListing } from "@/content/catalog/types";

import { createCatalog, getListing, getListings, getListingsByCollection } from "./catalog";

const listing = (over: Partial<CatalogListing> = {}): CatalogListing => ({
  listingId: 111,
  name: "Pickleball Tee",
  url: "https://www.etsy.com/listing/111/pickleball",
  state: "active",
  priceCents: 3200,
  quantity: 12,
  createdTimestamp: 1,
  variations: [],
  images: [],
  motifName: "Pickleball",
  story: "The paddle that took over the courts.",
  collection: "sea-isle",
  ...over,
});

const registry = {
  // Deliberately out of slug order, to prove the sort.
  "water-tower": listing({ listingId: 222, motifName: "Water Tower", collection: "sea-isle" }),
  pickleball: listing(),
  "beach-badge": listing({ listingId: 333, motifName: "Beach Badge", collection: "cape-may" }),
};

describe("catalog", () => {
  const catalog = createCatalog(registry);

  it("lookup hit: the merged listing plus its slug", () => {
    assert.deepEqual(catalog.getListing("pickleball"), { slug: "pickleball", ...registry.pickleball });
  });

  it("lookup miss: undefined, not a throw", () => {
    assert.equal(catalog.getListing("nope"), undefined);
    assert.equal(catalog.getListing(""), undefined);
    assert.equal(catalog.getListing("constructor"), undefined);
  });

  it("list: every entry, sorted by slug", () => {
    assert.deepEqual(catalog.getListings().map((entry) => entry.slug), ["beach-badge", "pickleball", "water-tower"]);
  });

  it("by collection: only matching entries, sorted; unknown collection is empty", () => {
    assert.deepEqual(catalog.getListingsByCollection("sea-isle").map((entry) => entry.slug), ["pickleball", "water-tower"]);
    assert.deepEqual(catalog.getListingsByCollection("nowhere"), []);
  });

  it("empty registry: no entries and no errors", () => {
    const empty = createCatalog({});
    assert.deepEqual(empty.getListings(), []);
    assert.deepEqual(empty.getListingsByCollection("sea-isle"), []);
    assert.equal(empty.getListing("pickleball"), undefined);
  });

  it("returned lists are copies and entries are frozen: callers cannot change the catalog", () => {
    catalog.getListings().pop();
    assert.equal(catalog.getListings().length, 3);
    const entry = catalog.getListing("pickleball")!;
    assert.ok(Object.isFrozen(entry));
    assert.throws(() => {
      (entry as { url: string }).url = "https://evil.example";
    }, TypeError);
    assert.equal(catalog.getListing("pickleball")?.url, registry.pickleball.url);
  });

  it("the manifest slug wins over a `slug` field on the listing", () => {
    const odd = createCatalog({ real: { ...listing(), slug: "spoofed" } as unknown as CatalogListing });
    assert.equal(odd.getListing("real")?.slug, "real");
    assert.equal(odd.getListing("spoofed"), undefined);
  });
});

describe("bound accessors (the committed registry)", () => {
  // Independent of what is registered, so it survives the first real listing.
  const expected = createCatalog(committedRegistry);

  it("read the committed registry", () => {
    assert.deepEqual(getListings(), expected.getListings());
    assert.equal(getListing("__no-such-slug__"), undefined);
    assert.deepEqual(getListingsByCollection("__no-such-collection__"), []);
    for (const entry of expected.getListings()) {
      assert.deepEqual(getListing(entry.slug), entry);
      assert.ok(getListingsByCollection(entry.collection).some((e) => e.slug === entry.slug));
    }
  });
});

describe("server-only guard", () => {
  it("importing lib/catalog without the react-server condition fails", async () => {
    const tsx = path.join(process.cwd(), "node_modules", ".bin", "tsx");
    const target = path.join(process.cwd(), "lib", "catalog.ts");
    await assert.rejects(
      promisify(execFile)(tsx, ["-e", `import ${JSON.stringify(target)}`], { cwd: process.cwd() }),
      (error: { code: number; stderr: string }) => error.code !== 0 && /server-only|Client Component/.test(error.stderr),
    );
  });
});
