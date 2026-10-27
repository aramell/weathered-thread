import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { GET } from "@/app/go/[slug]/route";
import { getListings } from "./catalog";
import { listingUrlWithSelection } from "./checkout";

const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) }) as Parameters<typeof GET>[1];
const call = (slug: string, query = "") => GET(new Request(`https://shop.weatheredthread.com/go/${slug}${query}`), ctx(slug));
const selection = "?style=heavyweight-tee&color=ivory&size=M";

describe("shop forward route", () => {
  const active = getListings().find((listing) => listing.state === "active");

  it("forwards an active design to its Etsy listing without caching", async () => {
    assert.ok(active, "the catalog has an active listing");
    const response = await call(active.slug, selection);
    assert.equal(response.status, 307);
    const target = new URL(response.headers.get("location") ?? "");
    assert.equal(`${target.origin}${target.pathname}`, new URL(active.url).origin + new URL(active.url).pathname);
    assert.equal(response.headers.get("cache-control"), "no-store");
  });

  it("forwards a design with no selection to the bare listing", async () => {
    assert.ok(active, "the catalog has an active listing");
    const response = await call(active.slug);
    assert.equal(response.headers.get("location"), active.url);
  });

  it("preselects the pick on Etsy when the variations carry ids", async () => {
    assert.ok(active, "the catalog has an active listing");
    const variations = active.variations.map((variation) =>
      variation.options.Style === "Heavyweight Tee" && variation.options["Primary color"] === "Ivory" && variation.options.Size === "M"
        ? { ...variation, optionIds: [{ propertyId: 1, valueId: 11 }, { propertyId: 2, valueId: 22 }, { propertyId: 3, valueId: 33 }] }
        : variation,
    );
    assert.equal(
      listingUrlWithSelection(active.url, variations, { style: "heavyweight-tee", color: "ivory", size: "M" }),
      `${active.url}?variation0=11&variation1=22&variation2=33`,
    );
  });

  it("falls back to the bare listing when the pick has no ids or matches nothing", () => {
    assert.ok(active, "the catalog has an active listing");
    const pick = { style: "heavyweight-tee", color: "ivory", size: "M" };
    const bare = active.variations.map((variation) => ({ ...variation, optionIds: undefined }));
    assert.equal(listingUrlWithSelection(active.url, bare, pick), active.url);
    assert.equal(listingUrlWithSelection(active.url, active.variations, { ...pick, size: "XXL" }), active.url);
  });

  it("sends an unknown design back to the Handoff with the retry flag", async () => {
    const response = await call("no-such-design", selection);
    assert.equal(response.status, 307);
    assert.equal(
      response.headers.get("location"),
      "https://shop.weatheredthread.com/checkout/no-such-design?style=heavyweight-tee&color=ivory&size=M&failed=1",
    );
  });

  it("sends an unknown design with no selection to the shop", async () => {
    const response = await call("no-such-design");
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), "https://shop.weatheredthread.com/shop");
  });
});
