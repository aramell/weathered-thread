/**
 * square-webhook — turns Square's "payment completed" notification into an email telling the
 * owner what to make and where to ship it. Square only holds the payment; this site's catalog
 * defines the pieces, so the email is built from the order's line items. Server-only.
 *
 * Security: every request is checked against Square's HMAC signature before anything else. The
 * email carries an idempotency key per order, so Square's retries (and its repeated
 * `payment.updated` events) don't send a second one within Resend's 24-hour window.
 */
import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { formatPrice } from "./format-price";
import { squareEnvPrefix } from "./square-client";

export const SIGNATURE_HEADER = "x-square-hmacsha256-signature";

type Money = { amount?: number; currency?: string };

type SquareAddress = {
  first_name?: string;
  last_name?: string;
  address_line_1?: string;
  address_line_2?: string;
  locality?: string;
  administrative_district_level_1?: string;
  postal_code?: string;
  country?: string;
};

export type SquarePayment = {
  id?: string;
  status?: string;
  order_id?: string;
  buyer_email_address?: string;
  shipping_address?: SquareAddress;
};

export type SquareOrder = {
  id?: string;
  total_money?: Money;
  line_items?: { name?: string; quantity?: string; total_money?: Money }[];
  service_charges?: { name?: string; applied_money?: Money }[];
  fulfillments?: { shipment_details?: { recipient?: { display_name?: string; address?: SquareAddress } } }[];
};

/** Square signs the notification url followed by the raw body with the subscription's key (HMAC-SHA256, base64). */
export function verifySignature(input: {
  rawBody: string;
  signature: string | null;
  url: string;
  key: string;
}): boolean {
  if (!input.signature) return false;
  const expected = createHmac("sha256", input.key).update(input.url + input.rawBody).digest();
  const given = Buffer.from(input.signature, "base64");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** The payment of a completed `payment.updated` event, or null for anything else. */
export function parseCompletedPayment(event: unknown): SquarePayment | null {
  if (typeof event !== "object" || event === null) return null;
  const { type, data } = event as { type?: unknown; data?: { object?: { payment?: SquarePayment } } };
  if (type !== "payment.updated") return null;
  const payment = data?.object?.payment;
  if (!payment || payment.status !== "COMPLETED" || !payment.order_id) return null;
  return payment;
}

const money = (value?: Money) => formatPrice(value?.amount ?? 0);

function addressLines(name: string | undefined, address: SquareAddress | undefined): string[] {
  if (!address) return [];
  const person = name ?? [address.first_name, address.last_name].filter(Boolean).join(" ");
  const region = [address.administrative_district_level_1, address.postal_code].filter(Boolean).join(" ");
  const city = [address.locality, region].filter(Boolean).join(", ");
  return [person, address.address_line_1, address.address_line_2, city, address.country].filter(
    (line): line is string => Boolean(line),
  );
}

export function describeOrder(order: SquareOrder, payment: SquarePayment): { subject: string; text: string } {
  const lines = order.line_items ?? [];
  const pieces = lines.reduce((total, line) => total + (Number(line.quantity) || 0), 0);
  const total = money(order.total_money);

  const recipient = order.fulfillments?.[0]?.shipment_details?.recipient;
  const shipTo = payment.shipping_address
    ? addressLines(undefined, payment.shipping_address)
    : addressLines(recipient?.display_name, recipient?.address);

  const text = [
    `Order ${order.id ?? payment.order_id ?? "?"} · Payment ${payment.id ?? "?"}`,
    "",
    "Make:",
    ...lines.map((line) => `${line.quantity ?? "?"} × ${line.name ?? "?"}  (${money(line.total_money)})`),
    "",
    ...(order.service_charges ?? []).map((charge) => `${charge.name ?? "Charge"}: ${money(charge.applied_money)}`),
    `Total: ${total}`,
    "",
    "Ship to:",
    ...(shipTo.length > 0 ? shipTo : ["No shipping address came back with this order — check it in the Square dashboard."]),
    ...(payment.buyer_email_address ? ["", `Buyer email: ${payment.buyer_email_address}`] : []),
  ].join("\n");

  return { subject: `New order: ${pieces} ${pieces === 1 ? "piece" : "pieces"}, ${total}`, text };
}

export type OrderEmail = { from: string; to: string; subject: string; text: string };

export type WebhookDeps = {
  env: Record<string, string | undefined>;
  fetchOrder: (orderId: string) => Promise<SquareOrder>;
  send: (email: OrderEmail, idempotencyKey: string) => Promise<void>;
};

const respond = (status: number, body: string) => new Response(body, { status });

export async function handleSquareWebhook(request: Request, deps: WebhookDeps): Promise<Response> {
  const prefix = squareEnvPrefix(deps.env);
  const names = {
    key: `${prefix}WEBHOOK_SIGNATURE_KEY`,
    url: `${prefix}WEBHOOK_URL`,
    notify: "ORDER_NOTIFY_EMAIL",
    domain: "RESEND_EMAIL_DOMAIN",
  } as const;
  const config: Record<keyof typeof names, string | undefined> = {
    key: deps.env[names.key]?.trim(),
    url: deps.env[names.url]?.trim(),
    notify: deps.env[names.notify]?.trim(),
    domain: deps.env[names.domain]?.trim(),
  };
  for (const field of Object.keys(names) as (keyof typeof names)[]) {
    if (!config[field]) {
      console.error(`Square webhook: ${names[field]} is not set`);
      return respond(500, "not configured");
    }
  }

  const rawBody = await request.text();
  if (!verifySignature({ rawBody, signature: request.headers.get(SIGNATURE_HEADER), url: config.url!, key: config.key! })) {
    return respond(401, "invalid signature");
  }

  let event: unknown;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return respond(200, "ignored");
  }
  const payment = parseCompletedPayment(event);
  if (!payment?.order_id) return respond(200, "ignored");

  try {
    const order = await deps.fetchOrder(payment.order_id);
    const { subject, text } = describeOrder(order, payment);
    await deps.send(
      { from: `Weathered Thread Orders <orders@${config.domain}>`, to: config.notify!, subject, text },
      `square-order/${payment.order_id}`,
    );
  } catch (error) {
    // A 5xx makes Square retry; the idempotency key keeps a retry from emailing twice.
    console.error("Square webhook failed:", error instanceof Error ? error.message : "unknown error");
    return respond(500, "failed");
  }
  return respond(200, "ok");
}
