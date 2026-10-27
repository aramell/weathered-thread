import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { forwardHref, handoffPath, parseSelection, resolveSelection } from "./checkout";
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
  it("parses a complete selection and rejects partial or repeated params", () => {
    assert.deepEqual(parseSelection({ style: "a", color: "b", size: "M" }), { style: "a", color: "b", size: "M" });
    assert.equal(parseSelection({ style: "a", color: "b" }), null);
    assert.equal(parseSelection({ style: "a", color: ["b", "c"], size: "M" }), null);
    assert.equal(parseSelection({ style: "", color: "b", size: "M" }), null);
  });

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

  it("builds a shop-host forward and a handoff path that keep the selection", () => {
    const selection = { style: "heavyweight-tee", color: "ivory", size: "M" };
    assert.equal(
      forwardHref("sic-wave", selection),
      "https://shop.weatheredthread.com/go/sic-wave?style=heavyweight-tee&color=ivory&size=M",
    );
    assert.ok(!forwardHref("sic-wave", selection).includes("etsy.com"));
    assert.equal(handoffPath("sic-wave", selection, true), "/checkout/sic-wave?style=heavyweight-tee&color=ivory&size=M&failed=1");
  });
});
