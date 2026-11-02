import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { getListing } from "./catalog";
import { addItem, type Cart, type CartPick } from "./cart";
import { priceBag, startBagCheckout, toCheckoutLines } from "./bag";
import { SquareApiError, type SquareClient } from "./square-client";

const ivoryTee: CartPick = { slug: "sic-wave", style: "heavyweight-tee", color: "ivory", size: "M" };
const bayLongSleeve: CartPick = { slug: "sic-wave", style: "long-sleeve-tee", color: "bay", size: "S" };

const catalogPrice = (slug: string, style: string, color: string, size: string) => {
  const variation = getListing(slug)?.variations.find(
    (v) => v.options.Style === style && v.options["Primary color"] === color && v.options.Size === size,
  );
  assert.ok(variation, `${slug} has ${style} / ${color} / ${size}`);
  return variation.priceCents;
};

describe("priceBag", () => {
  it("prices a pick from the catalog and names it for the bag", () => {
    const priced = priceBag(addItem([], ivoryTee, 2));
    const [line] = priced.lines;
    assert.ok(line.status === "ok");
    const unit = catalogPrice("sic-wave", "Heavyweight Tee", "Ivory", "M");
    assert.equal(line.pick.priceCents, unit);
    assert.equal(line.lineCents, unit * 2);
    assert.equal(priced.subtotalCents, unit * 2);
    assert.deepEqual(
      [line.pick.garment, line.pick.color, line.pick.size],
      ["Heavyweight Tee", "Ivory", "M"],
    );
    assert.ok(line.pick.motifName.length > 0);
  });

  it("prices a combination Etsy shows at zero stock: pieces are made to order", () => {
    const [line] = priceBag(addItem([], bayLongSleeve)).lines;
    assert.ok(line.status === "ok");
    assert.equal(line.pick.priceCents, catalogPrice("sic-wave", "Long Sleeve Tee", "Bay", "S"));
  });

  it("flags unknown designs, styles, colors and sizes without throwing", () => {
    const bad: CartPick[] = [
      { ...ivoryTee, slug: "no-such-design" },
      { ...ivoryTee, style: "no-such-style" },
      { ...ivoryTee, color: "no-such-color" },
      { ...ivoryTee, size: "XXXL" },
    ];
    const priced = priceBag(bad.reduce<Cart>((cart, pick) => addItem(cart, pick), []));
    assert.deepEqual(priced.lines.map((line) => line.status), ["unavailable", "unavailable", "unavailable", "unavailable"]);
    assert.equal(priced.hasUnavailable, true);
    assert.equal(priced.subtotalCents, 0);
  });
});

describe("toCheckoutLines", () => {
  it("turns priced lines into Square lines with the pick's slugs and quantity", () => {
    const lines = toCheckoutLines(priceBag(addItem([], ivoryTee, 3)));
    assert.equal(lines.length, 1);
    assert.equal(lines[0].slug, "sic-wave");
    assert.equal(lines[0].styleSlug, "heavyweight-tee");
    assert.equal(lines[0].quantity, 3);
    assert.equal(lines[0].priceCents, catalogPrice("sic-wave", "Heavyweight Tee", "Ivory", "M"));
    assert.equal(lines[0].color, "Ivory");
  });

  it("refuses a bag that still has an unavailable line", () => {
    const priced = priceBag(addItem(addItem([], ivoryTee), { ...ivoryTee, size: "XXXL" }));
    assert.throws(() => toCheckoutLines(priced), /unavailable/);
  });
});

function fakeClient(respond: () => unknown) {
  const bodies: unknown[] = [];
  const client = {
    locationId: "LTEST",
    request: async (_method: string, _path: string, body?: unknown) => {
      bodies.push(body);
      return respond();
    },
  } as unknown as SquareClient;
  return { client, bodies };
}

describe("startBagCheckout", () => {
  const redirectUrl = "https://shop.weatheredthread.com/checkout/thank-you";

  it("returns the Square checkout url for a good bag, priced by the server", async () => {
    const { client, bodies } = fakeClient(() => ({ payment_link: { url: "https://sandbox.square.link/u/x" } }));
    const result = await startBagCheckout(addItem([], ivoryTee, 2), { client, redirectUrl });
    assert.deepEqual(result, { ok: true, url: "https://sandbox.square.link/u/x" });
    const body = bodies[0] as { order: { line_items: { quantity: string; base_price_money: { amount: number } }[] } };
    assert.equal(body.order.line_items[0].quantity, "2");
    assert.equal(body.order.line_items[0].base_price_money.amount, catalogPrice("sic-wave", "Heavyweight Tee", "Ivory", "M"));
  });

  it("makes no Square call for an empty bag", async () => {
    const { client, bodies } = fakeClient(() => ({}));
    assert.deepEqual(await startBagCheckout([], { client, redirectUrl }), { ok: false, reason: "empty" });
    assert.equal(bodies.length, 0);
  });

  it("makes no Square call while any line is unavailable", async () => {
    const { client, bodies } = fakeClient(() => ({}));
    const cart = addItem(addItem([], ivoryTee), { ...ivoryTee, slug: "no-such-design" });
    assert.deepEqual(await startBagCheckout(cart, { client, redirectUrl }), { ok: false, reason: "unavailable" });
    assert.equal(bodies.length, 0);
  });

  it("reports a Square failure instead of throwing, and logs it without the request", async () => {
    const logged: unknown[][] = [];
    const original = console.error;
    console.error = (...args: unknown[]) => void logged.push(args);
    try {
      const { client } = fakeClient(() => {
        throw new SquareApiError("POST /v2/online-checkout/payment-links: HTTP 500", 500);
      });
      assert.deepEqual(await startBagCheckout(addItem([], ivoryTee), { client, redirectUrl }), {
        ok: false,
        reason: "failed",
      });
    } finally {
      console.error = original;
    }
    assert.equal(logged.length, 1);
    assert.match(String(logged[0][0]), /Square checkout failed/);
    assert.ok(!JSON.stringify(logged).includes("Bearer"));
  });
});
