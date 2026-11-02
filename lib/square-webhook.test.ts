import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { describe, it } from "node:test";

import {
  describeOrder,
  handleSquareWebhook,
  parseCompletedPayment,
  SIGNATURE_HEADER,
  verifySignature,
  type SquareOrder,
  type WebhookDeps,
} from "./square-webhook";

const KEY = "webhook-signature-key";
const URL_ = "https://shop.weatheredthread.com/api/square/webhook";

const sign = (body: string, url = URL_, key = KEY) => createHmac("sha256", key).update(url + body).digest("base64");

const payment = {
  id: "PAY1",
  status: "COMPLETED",
  order_id: "ORD1",
  buyer_email_address: "buyer@example.com",
  shipping_address: {
    first_name: "Sam",
    last_name: "Shore",
    address_line_1: "1 Beach Ave",
    address_line_2: "Apt 2",
    locality: "Sea Isle City",
    administrative_district_level_1: "NJ",
    postal_code: "08243",
    country: "US",
  },
};

const event = (over: Record<string, unknown> = {}, pay: Record<string, unknown> = payment) => ({
  type: "payment.updated",
  event_id: "EVT1",
  data: { type: "payment", id: "PAY1", object: { payment: pay } },
  ...over,
});

const order: SquareOrder = {
  id: "ORD1",
  total_money: { amount: 10999, currency: "USD" },
  line_items: [
    { name: "SIC Wave — Heavyweight Tee, Ivory, M", quantity: "2", total_money: { amount: 7200 } },
    { name: "SIC Wave — Long Sleeve Tee, Bay, S", quantity: "1", total_money: { amount: 3200 } },
  ],
  service_charges: [{ name: "Shipping", applied_money: { amount: 599 } }],
};

describe("verifySignature", () => {
  const body = JSON.stringify(event());

  it("accepts the signature Square computes over url + body", () => {
    assert.equal(verifySignature({ rawBody: body, signature: sign(body), url: URL_, key: KEY }), true);
  });

  it("rejects a wrong key, url, body, a missing or malformed signature", () => {
    assert.equal(verifySignature({ rawBody: body, signature: sign(body, URL_, "other"), url: URL_, key: KEY }), false);
    assert.equal(verifySignature({ rawBody: body, signature: sign(body, "https://evil.example/x"), url: URL_, key: KEY }), false);
    assert.equal(verifySignature({ rawBody: body + " ", signature: sign(body), url: URL_, key: KEY }), false);
    assert.equal(verifySignature({ rawBody: body, signature: null, url: URL_, key: KEY }), false);
    assert.equal(verifySignature({ rawBody: body, signature: "short", url: URL_, key: KEY }), false);
    assert.equal(verifySignature({ rawBody: body, signature: "", url: URL_, key: KEY }), false);
  });
});

describe("parseCompletedPayment", () => {
  it("returns the payment of a completed payment.updated event", () => {
    const parsed = parseCompletedPayment(event());
    assert.equal(parsed?.id, "PAY1");
    assert.equal(parsed?.order_id, "ORD1");
  });

  it("ignores other event types, statuses and shapes", () => {
    assert.equal(parseCompletedPayment(event({ type: "order.updated" })), null);
    assert.equal(parseCompletedPayment(event({}, { ...payment, status: "APPROVED" })), null);
    assert.equal(parseCompletedPayment(event({}, { ...payment, order_id: undefined })), null);
    assert.equal(parseCompletedPayment({}), null);
    assert.equal(parseCompletedPayment(null), null);
    assert.equal(parseCompletedPayment("x"), null);
  });
});

describe("describeOrder", () => {
  const email = describeOrder(order, payment);

  it("counts the pieces and totals in the subject", () => {
    assert.equal(email.subject, "New order: 3 pieces, $109.99");
  });

  it("lists every line, shipping, the total and the address", () => {
    for (const part of [
      "2 × SIC Wave — Heavyweight Tee, Ivory, M",
      "1 × SIC Wave — Long Sleeve Tee, Bay, S",
      "Shipping: $5.99",
      "Total: $109.99",
      "Sam Shore",
      "1 Beach Ave",
      "Apt 2",
      "Sea Isle City, NJ 08243",
      "buyer@example.com",
      "ORD1",
      "PAY1",
    ]) {
      assert.ok(email.text.includes(part), `missing: ${part}`);
    }
  });

  it("says so when no shipping address came back instead of omitting it silently", () => {
    const bare = describeOrder(order, { id: "PAY1", order_id: "ORD1" });
    assert.match(bare.text, /No shipping address/);
  });

  it("falls back to the order's shipment recipient for the address", () => {
    const withFulfillment: SquareOrder = {
      ...order,
      fulfillments: [
        {
          shipment_details: {
            recipient: { display_name: "Pat Port", address: { address_line_1: "9 Dune Rd", locality: "Ocean City", administrative_district_level_1: "NJ", postal_code: "08226" } },
          },
        },
      ],
    };
    const text = describeOrder(withFulfillment, { id: "PAY1", order_id: "ORD1" }).text;
    assert.ok(text.includes("Pat Port") && text.includes("9 Dune Rd") && text.includes("Ocean City, NJ 08226"));
  });

  it("uses singular for one piece", () => {
    const one = describeOrder({ ...order, line_items: [order.line_items![0]].map((l) => ({ ...l, quantity: "1" })) }, payment);
    assert.match(one.subject, /1 piece,/);
  });
});

function deps(over: Partial<WebhookDeps> = {}) {
  const sent: { email: Parameters<WebhookDeps["send"]>[0]; key: string }[] = [];
  const fetched: string[] = [];
  const value: WebhookDeps = {
    env: {
      SQUARE_ENVIRONMENT: "sandbox",
      SQUARE_SANDBOX_WEBHOOK_SIGNATURE_KEY: KEY,
      SQUARE_SANDBOX_WEBHOOK_URL: URL_,
      ORDER_NOTIFY_EMAIL: "owner@example.com",
      RESEND_EMAIL_DOMAIN: "weatheredthread.com",
    },
    fetchOrder: async (id) => {
      fetched.push(id);
      return order;
    },
    send: async (email, key) => {
      sent.push({ email, key });
    },
    ...over,
  };
  return { value, sent, fetched };
}

const request = (body: string, signature: string | null = sign(body)) =>
  new Request(URL_, { method: "POST", body, headers: signature === null ? {} : { [SIGNATURE_HEADER]: signature } });

describe("handleSquareWebhook", () => {
  it("emails the owner once for a completed payment, keyed by order so a replay can't duplicate", async () => {
    const { value, sent, fetched } = deps();
    const response = await handleSquareWebhook(request(JSON.stringify(event())), value);
    assert.equal(response.status, 200);
    assert.deepEqual(fetched, ["ORD1"]);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].key, "square-order/ORD1");
    assert.equal(sent[0].email.to, "owner@example.com");
    assert.equal(sent[0].email.from, "Weathered Thread Orders <orders@weatheredthread.com>");
    assert.match(sent[0].email.subject, /New order: 3 pieces/);
  });

  it("rejects a bad or missing signature with 401 and does nothing", async () => {
    for (const signature of ["AAAA", null]) {
      const { value, sent, fetched } = deps();
      const response = await handleSquareWebhook(request(JSON.stringify(event()), signature), value);
      assert.equal(response.status, 401);
      assert.equal(sent.length + fetched.length, 0);
    }
  });

  it("acknowledges events it doesn't act on without fetching or sending", async () => {
    for (const body of [JSON.stringify(event({ type: "order.updated" })), JSON.stringify(event({}, { ...payment, status: "APPROVED" })), "not json"]) {
      const { value, sent, fetched } = deps();
      const response = await handleSquareWebhook(request(body), value);
      assert.equal(response.status, 200);
      assert.equal(sent.length + fetched.length, 0);
    }
  });

  it("answers 500 so Square retries when the order can't be fetched or the email fails", async () => {
    const errors = console.error;
    console.error = () => {};
    try {
      const failFetch = deps({ fetchOrder: async () => { throw new Error("boom"); } });
      assert.equal((await handleSquareWebhook(request(JSON.stringify(event())), failFetch.value)).status, 500);
      const failSend = deps({ send: async () => { throw new Error("resend down"); } });
      assert.equal((await handleSquareWebhook(request(JSON.stringify(event())), failSend.value)).status, 500);
    } finally {
      console.error = errors;
    }
  });

  it("answers 500 when the webhook or notification config is missing, naming the variable", async () => {
    const logged: string[] = [];
    const errors = console.error;
    console.error = (...args: unknown[]) => void logged.push(args.join(" "));
    try {
      for (const missing of ["SQUARE_SANDBOX_WEBHOOK_SIGNATURE_KEY", "SQUARE_SANDBOX_WEBHOOK_URL", "ORDER_NOTIFY_EMAIL", "RESEND_EMAIL_DOMAIN"]) {
        const base = deps();
        const env = { ...base.value.env, [missing]: undefined };
        const response = await handleSquareWebhook(request(JSON.stringify(event())), { ...base.value, env });
        assert.equal(response.status, 500, missing);
        assert.ok(logged.at(-1)?.includes(missing), missing);
        assert.equal(base.sent.length, 0);
      }
    } finally {
      console.error = errors;
    }
  });
});
