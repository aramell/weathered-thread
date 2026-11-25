import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CatalogEntry } from "@/content/catalog/types";
import { buildMotifs } from "./motifs";

const entry = (overrides: Partial<CatalogEntry> = {}): CatalogEntry =>
  ({
    slug: "sic-wave",
    listingId: 1,
    name: "Etsy title",
    description: "Embroidered on Comfort Colors.\n\nRuns true to size.",
    url: "https://www.etsy.com/listing/1/x",
    state: "active",
    priceCents: 3600,
    quantity: 1,
    createdTimestamp: 1,
    variations: [],
    images: [],
    motifName: "Sea Isle Wave",
    story: "A wave.",
    collection: "sea-isle",
    photos: [],
    ...overrides,
  }) as CatalogEntry;

describe("buildMotifs", () => {
  it("carries the synced Etsy description alongside the authored story", () => {
    const [motif] = buildMotifs([entry()]);
    assert.equal(motif.description, "Embroidered on Comfort Colors.\n\nRuns true to size.");
    assert.equal(motif.story, "A wave.");
  });

  it("falls back to an empty description for a listing synced before the field existed", () => {
    const [motif] = buildMotifs([entry({ description: undefined })]);
    assert.equal(motif.description, "");
  });
});
