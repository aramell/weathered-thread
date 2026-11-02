import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildPaymentLinkRequest, createCheckoutLink, SHIPPING_CENTS, type CheckoutLine } from "./square-checkout";
import { SquareApiError, type SquareClient } from "./square-client";

const wave: CheckoutLine = {
  slug: "sic-wave",
  motifName: "SIC Wave",
  styleSlug: "heavyweight-tee",
  garment: "Heavyweight Tee",
  color: "Ivory",
  size: "M",
  priceCents: 3600,
  quantity: 1,
};

const boat: CheckoutLine = {
  slug: "sic-iconic-boat",
  motifName: "SIC Iconic Boat",
  styleSlug: "crewneck",
  garment: "Crewneck",
  color: "Bay",
  size: "L",
  priceCents: 5200,
  quantity: 2,
};

const REDIRECT = "https://shop.weatheredthread.com/checkout/thank-you";

function fakeClient(respond: (method: string, path: string, body: unknown) => unknown) {
  const calls: { method: string; path: string; body: unknown }[] = [];
  const client = {
    locationId: "LTEST",
    request: async (method: string, path: string, body?: unknown) => {
      calls.push({ method, path, body });
      return respond(method, path, body);
    },
  } as unknown as SquareClient;
  return { client, calls };
}

describe("buildPaymentLinkRequest", () => {
  const options = { locationId: "LTEST", redirectUrl: REDIRECT, idempotencyKey: "key-1" };
  const body = buildPaymentLinkRequest([wave, boat], options);

  it("makes one line item per pick, priced from the site's data, with the pick spelled out in its name", () => {
    assert.equal(body.order.location_id, "LTEST");
    assert.deepEqual(body.order.line_items, [
      {
        name: "SIC Wave — Heavyweight Tee, Ivory, M",
        quantity: "1",
        base_price_money: { amount: 3600, currency: "USD" },
        metadata: { design: "sic-wave", style: "heavyweight-tee", color: "Ivory", size: "M" },
      },
      {
        name: "SIC Iconic Boat — Crewneck, Bay, L",
        quantity: "2",
        base_price_money: { amount: 5200, currency: "USD" },
        metadata: { design: "sic-iconic-boat", style: "crewneck", color: "Bay", size: "L" },
      },
    ]);
  });

  it("charges the flat $5.99 shipping once per order, asks for the address and sends the visitor back to the site", () => {
    assert.equal(SHIPPING_CENTS, 599);
    assert.deepEqual(body.checkout_options, {
      redirect_url: REDIRECT,
      ask_for_shipping_address: true,
      allow_tipping: false,
      shipping_fee: { name: "Shipping", charge: { amount: 599, currency: "USD" } },
    });
  });

  it("applies no tax and carries the idempotency key", () => {
    assert.equal(body.idempotency_key, "key-1");
    assert.ok(!("taxes" in body.order));
    assert.ok(!("pricing_options" in body.order));
  });

  it("refuses an empty order or a quantity outside 1 to 10", () => {
    assert.throws(() => buildPaymentLinkRequest([], options), /no items/);
    for (const quantity of [0, 11, 1.5, Number.NaN]) {
      assert.throws(() => buildPaymentLinkRequest([{ ...wave, quantity }], options), /quantity/);
    }
  });

  it("refuses a price that is not a positive whole number of cents", () => {
    for (const priceCents of [0, -1, 12.5, Number.NaN]) {
      assert.throws(() => buildPaymentLinkRequest([{ ...wave, priceCents }], options), /price/);
    }
  });
});

describe("createCheckoutLink", () => {
  it("posts to the Payment Links endpoint and returns the checkout url", async () => {
    const { client, calls } = fakeClient(() => ({
      payment_link: { id: "PL1", url: "https://square.link/u/abc123", order_id: "O1" },
    }));

    const url = await createCheckoutLink(client, [wave], { redirectUrl: REDIRECT, idempotencyKey: "key-1" });

    assert.equal(url, "https://square.link/u/abc123");
    assert.equal(calls.length, 1);
    assert.equal(calls[0].method, "POST");
    assert.equal(calls[0].path, "/v2/online-checkout/payment-links");
    assert.equal((calls[0].body as { idempotency_key: string }).idempotency_key, "key-1");
  });

  it("generates a fresh idempotency key per call when none is given", async () => {
    const { client, calls } = fakeClient(() => ({ payment_link: { url: "https://square.link/u/x" } }));
    await createCheckoutLink(client, [wave], { redirectUrl: REDIRECT });
    await createCheckoutLink(client, [wave], { redirectUrl: REDIRECT });
    const keys = calls.map((call) => (call.body as { idempotency_key: string }).idempotency_key);
    assert.ok(keys[0] && keys[1] && keys[0] !== keys[1]);
  });

  it("lets a Square failure propagate for the caller to turn into the retry notice", async () => {
    const { client } = fakeClient(() => {
      throw new SquareApiError("POST /x: HTTP 500", 500);
    });
    await assert.rejects(createCheckoutLink(client, [wave], { redirectUrl: REDIRECT }), SquareApiError);
  });

  it("rejects a response with no usable https url instead of redirecting somewhere unknown", async () => {
    for (const payload of [{}, { payment_link: {} }, { payment_link: { url: "http://square.link/u/x" } }, { payment_link: { url: "javascript:alert(1)" } }]) {
      const { client } = fakeClient(() => payload);
      await assert.rejects(
        createCheckoutLink(client, [wave], { redirectUrl: REDIRECT }),
        (error: unknown) => error instanceof SquareApiError && error.status === null,
      );
    }
  });
});
