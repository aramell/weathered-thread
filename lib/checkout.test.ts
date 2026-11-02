import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { resolveSelection, shopOrigin } from "./checkout";
import type { Shop } from "./shop-types";

const shop: Shop = {
  garmentTypes: [
    {
      slug: "heavyweight-tee",
      name: "Heavyweight Tee",
      garmentBlurb: "",
      inStock: true,
      priceCents: 3600,
      colors: [
        {
          slug: "ivory",
          name: "Ivory",
          frontImage: null,
          swatchColor: "#fff",
          inStock: true,
          priceCents: 3600,
          sizes: [
            { name: "S", inStock: false, priceCents: null },
            { name: "M", inStock: true, priceCents: 3600 },
          ],
        },
      ],
    },
  ],
};

describe("checkout selection", () => {
  it("resolves an in-stock combination to plain-language names and its price", () => {
    assert.deepEqual(resolveSelection(shop, { style: "heavyweight-tee", color: "ivory", size: "M" }), {
      ok: true,
      garment: "Heavyweight Tee",
      color: "Ivory",
      size: "M",
      priceCents: 3600,
    });
  });

  it("tells a sold-out combination from one that does not exist", () => {
    assert.deepEqual(resolveSelection(shop, { style: "heavyweight-tee", color: "ivory", size: "S" }), {
      ok: false,
      reason: "sold-out",
    });
    assert.deepEqual(resolveSelection(shop, { style: "heavyweight-tee", color: "pepper", size: "M" }), {
      ok: false,
      reason: "unavailable",
    });
    assert.deepEqual(resolveSelection(undefined, { style: "x", color: "y", size: "M" }), {
      ok: false,
      reason: "unavailable",
    });
  });

  it("returns to the live site whatever SHOP_ORIGIN holds", () => {
    const fallback = "https://weatheredthread.com";
    assert.equal(shopOrigin(undefined), fallback);
    assert.equal(shopOrigin(""), fallback);
    assert.equal(shopOrigin("weatheredthread.com"), fallback);
    assert.equal(shopOrigin("http://shop.example.com"), fallback);
    assert.equal(shopOrigin("https://shop.example.com/"), "https://shop.example.com");
    assert.equal(shopOrigin(" https://shop.example.com/extra "), "https://shop.example.com");
    assert.equal(shopOrigin("http://localhost:3000"), "http://localhost:3000");
  });
});
