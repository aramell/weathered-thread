import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CatalogEntry } from "@/content/catalog/types";
import { buildMotifs, withoutEtsyWording } from "./motifs";

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

  it("drops Etsy-only wording from the description", () => {
    const [motif] = buildMotifs([
      entry({
        description:
          "THE DETAILS\n\n\u2022 Made to order\n\u2022 Don't see what you want? Send a message!  \n\nSelect your garment style. Choose from the listing options.\n\nMade to Remember.",
      }),
    ]);
    assert.equal(
      motif.description,
      "THE DETAILS\n\n\u2022 Made to order\n\nSelect your garment style.\n\nMade to Remember.",
    );
  });
});

describe("withoutEtsyWording", () => {
  it("handles a curly apostrophe and leaves unrelated text alone", () => {
    assert.equal(withoutEtsyWording("A\n\u2022 Don\u2019t see what you want? Send a message!\nB"), "A\nB");
    assert.equal(withoutEtsyWording("Choose your color."), "Choose your color.");
  });
});
