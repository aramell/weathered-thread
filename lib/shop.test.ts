/**
 * Tests for lib/shop.ts's pure `buildShop` — the I/O matrix of the Shop-on-synced-catalog
 * spec. Run via `npm run test:catalog` (needs `--conditions react-server` for `server-only`).
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";

import type { CatalogEntry } from "@/content/catalog/types";

import { buildMotifShops, buildShop } from "./shop";
import { derivePicker, getColor, getGarmentType, priceLabel } from "./shop-types";

type Variation = CatalogEntry["variations"][number];

const v = (
  productId: number,
  style: string,
  color: string,
  size: string,
  priceCents: number,
  quantity: number,
): Variation => ({ productId, options: { Style: style, "Primary color": color, Size: size }, priceCents, quantity });

const entry = (slug: string, variations: Variation[], over: Partial<CatalogEntry> = {}): CatalogEntry => ({
  slug,
  listingId: 1,
  name: "Listing",
  url: "https://www.etsy.com/listing/1/x",
  state: "active",
  priceCents: 3200,
  quantity: 1,
  createdTimestamp: 1,
  variations,
  images: [],
  motifName: "Logo",
  story: "Story",
  collection: "weathered-thread",
  ...over,
});

const base = [
  v(1, "Heavyweight Tee", "Ivory", "M", 3200, 5),
  v(2, "Heavyweight Tee", "Ivory", "S", 3200, 5),
  v(3, "Heavyweight Tee", "Bay", "S", 3200, 5),
  v(4, "Long Sleeve Tee", "Bay", "S", 3200, 0),
  v(5, "Long Sleeve Tee", "Bay", "M", 3200, 0),
  v(6, "Long Sleeve Tee", "Pepper", "S", 3800, 2),
];

describe("buildShop", () => {
  it("happy path: styles in Etsy order, authored color order, sizes ordered, lowest in-stock prices", () => {
    const shop = buildShop([entry("logo", base)]);
    assert.deepEqual(shop.garmentTypes.map((t) => t.slug), ["heavyweight-tee", "long-sleeve-tee"]);
    const tee = shop.garmentTypes[0];
    assert.deepEqual(tee.colors.map((c) => c.slug), ["ivory", "bay"], "pepper..ivory..bay order, absent colors omitted");
    assert.deepEqual(tee.colors[0].sizes.map((s) => s.name), ["S", "M"]);
    assert.equal(tee.priceCents, 3200);
    assert.equal(shop.garmentTypes[1].priceCents, 3800, "style price ignores out-of-stock Bay");
    assert.equal(priceLabel(3200), "$32");
  });

  it("out-of-stock color: disabled, no price", () => {
    const longSleeve = buildShop([entry("logo", base)]).garmentTypes[1];
    const bay = longSleeve.colors.find((c) => c.slug === "bay");
    assert.ok(bay);
    assert.equal(bay.inStock, false);
    assert.equal(bay.priceCents, null);
    assert.ok(bay.sizes.every((s) => !s.inStock && s.priceCents === null));
    assert.equal(priceLabel(null), "Sold out");
  });

  it("mixed listings: in stock if either has stock, lowest in-stock price wins", () => {
    const shop = buildShop([
      entry("a", [v(1, "Tee", "Bay", "S", 3600, 3)]),
      entry("b", [v(2, "Tee", "Bay", "S", 3400, 1), v(3, "Tee", "Ivory", "S", 1000, 0)]),
    ]);
    const [bay, ivory] = [...shop.garmentTypes[0].colors].sort((x, y) => (x.slug < y.slug ? -1 : 1));
    assert.equal(bay.sizes[0].priceCents, 3400);
    assert.equal(ivory.inStock, false);
    assert.equal(ivory.priceCents, null, "an out-of-stock offering's price is never used");
  });

  it("excludes inactive listings and listings with no variations", () => {
    const shop = buildShop([
      entry("sold", base, { state: "sold_out" }),
      entry("none", []),
    ]);
    assert.deepEqual(shop.garmentTypes, []);
  });

  it("malformed variation fails naming the listing", () => {
    const bad: Variation = { productId: 9, options: { Style: "Tee", "Primary color": "Bay" }, priceCents: 1, quantity: 1 };
    assert.throws(() => buildShop([entry("broken", [bad])]), /listing "broken" variation 9: missing option "Size"/);
  });

  it("unknown color falls back to a neutral swatch and no photo; model never carries url or listing id", () => {
    const shop = buildShop([entry("logo", [v(1, "Tee", "Mystery Teal", "S", 3000, 1)])]);
    const color = shop.garmentTypes[0].colors[0];
    assert.equal(color.slug, "mystery-teal");
    assert.equal(color.frontImage, null);
    assert.ok(color.swatchColor);
    const json = JSON.stringify(shop);
    assert.ok(!json.includes("etsy.com") && !json.includes("listingId"));
  });
});

describe("buildMotifShops", () => {
  it("each design keeps its own prices and stock instead of the pooled lowest", () => {
    const shops = buildMotifShops([
      entry("sea-isle", [v(1, "Heavyweight Tee", "Bay", "S", 3600, 3), v(2, "Heavyweight Tee", "Bay", "M", 3600, 0)]),
      entry("logo", [v(3, "Heavyweight Tee", "Bay", "S", 3200, 0), v(4, "Heavyweight Tee", "Bay", "M", 3200, 4)]),
    ]);
    assert.deepEqual(Object.keys(shops), ["sea-isle", "logo"]);
    const [seaIsle, logo] = ["sea-isle", "logo"].map((slug) => shops[slug].garmentTypes[0].colors[0].sizes);
    assert.deepEqual(seaIsle.map((s) => [s.name, s.inStock, s.priceCents]), [["S", true, 3600], ["M", false, null]]);
    assert.deepEqual(logo.map((s) => [s.name, s.inStock, s.priceCents]), [["S", false, null], ["M", true, 3200]]);
  });

  it("an inactive design gets an empty shop rather than borrowing another's", () => {
    const shops = buildMotifShops([entry("gone", base, { state: "sold_out" })]);
    assert.deepEqual(shops.gone.garmentTypes, []);
  });
});

describe("lookups and picker derivation", () => {
  const shop = buildShop([entry("logo", base)]);
  const pick = (over: Partial<Parameters<typeof derivePicker>[1]> = {}) =>
    derivePicker(shop, { garmentTypeSlug: "heavyweight-tee", colorSlug: "ivory", sizeName: null, hasMotif: true, ...over });

  it("unknown slugs resolve to undefined and colors are scoped to their style", () => {
    assert.equal(getGarmentType(shop, "nope"), undefined);
    const tee = getGarmentType(shop, "heavyweight-tee");
    assert.ok(tee);
    assert.equal(getColor(tee, "nope"), undefined);
    assert.equal(getColor(tee, "pepper"), undefined, "pepper exists only on the long sleeve tee");
    const longSleeve = getGarmentType(shop, "long-sleeve-tee");
    assert.ok(longSleeve && getColor(longSleeve, "pepper"));
  });

  it("Add to Bag needs an in-stock color, an in-stock size and a motif", () => {
    assert.equal(pick({ sizeName: "M" }).isAddToBagEnabled, true);
    assert.equal(pick({ sizeName: null }).isAddToBagEnabled, false);
    assert.equal(pick({ sizeName: "M", hasMotif: false }).isAddToBagEnabled, false);
    assert.equal(pick({ sizeName: "XL" }).isAddToBagEnabled, false, "unknown size");
    const soldOut = pick({ garmentTypeSlug: "long-sleeve-tee", colorSlug: "bay", sizeName: "S" });
    assert.equal(soldOut.isAddToBagEnabled, false);
    assert.equal(soldOut.size, undefined, "an out-of-stock size is never selected");
    assert.equal(soldOut.priceCents, null, "an out-of-stock color has no price");
  });

  it("a size chosen in one color is dropped where it is out of stock", () => {
    assert.equal(pick({ garmentTypeSlug: "long-sleeve-tee", colorSlug: "pepper", sizeName: "S" }).size?.name, "S");
    assert.equal(pick({ garmentTypeSlug: "long-sleeve-tee", colorSlug: "pepper", sizeName: "M" }).size, undefined, "M absent in pepper");
  });

  it("price narrows size, then color, then garment", () => {
    assert.equal(pick({ colorSlug: null }).priceCents, 3200, "garment lowest");
    assert.equal(pick({ garmentTypeSlug: "long-sleeve-tee", colorSlug: "pepper" }).priceCents, 3800, "color");
    assert.equal(pick({ garmentTypeSlug: "long-sleeve-tee", colorSlug: "pepper", sizeName: "S" }).priceCents, 3800, "size");
    assert.equal(pick({ garmentTypeSlug: null }).priceCents, null);
  });

  it("a stale color slug under another style resolves to no color", () => {
    assert.equal(pick({ garmentTypeSlug: "heavyweight-tee", colorSlug: "pepper" }).colorway, undefined);
  });
});
