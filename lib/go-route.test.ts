import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { GET } from "@/app/go/[slug]/route";
import { getListings } from "./catalog";

const ctx = (slug: string) => ({ params: Promise.resolve({ slug }) }) as Parameters<typeof GET>[1];
const call = (slug: string, query = "") => GET(new Request(`https://shop.weatheredthread.com/go/${slug}${query}`), ctx(slug));
const selection = "?style=heavyweight-tee&color=ivory&size=M";

describe("shop forward route", () => {
  const active = getListings().find((listing) => listing.state === "active");

  it("forwards an active design to its Etsy listing without caching", async () => {
    assert.ok(active, "the catalog has an active listing");
    const response = await call(active.slug, selection);
    assert.equal(response.status, 307);
    assert.equal(response.headers.get("location"), active.url);
    assert.equal(response.headers.get("cache-control"), "no-store");
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
