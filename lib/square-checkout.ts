/**
 * square-checkout — turns a resolved bag into a Square hosted Payment Link. Square only
 * collects payment: the price comes from this site's catalog (an ad-hoc line item), never from
 * the request, and the link url is returned to server code only (NFR8).
 */
import "server-only";

import { MAX_QUANTITY, SHIPPING_CENTS } from "./cart";
import { SquareApiError, type SquareClient } from "./square-client";

export { SHIPPING_CENTS };

const CURRENCY = "USD";
const PAYMENT_LINKS_PATH = "/v2/online-checkout/payment-links";

/** One pick from the bag, already resolved against the catalog, plus how many of it. */
export type CheckoutLine = {
  slug: string;
  motifName: string;
  styleSlug: string;
  garment: string;
  color: string;
  size: string;
  priceCents: number;
  quantity: number;
};

export type PaymentLinkOptions = {
  redirectUrl: string;
  /** Pass one to make a retried call return the same link; defaults to a fresh key per call. */
  idempotencyKey?: string;
};

export function buildPaymentLinkRequest(
  lines: readonly CheckoutLine[],
  options: { locationId: string; redirectUrl: string; idempotencyKey: string },
) {
  if (lines.length === 0) throw new Error("payment link needs at least one item; got no items");
  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > MAX_QUANTITY) {
      throw new Error(`payment link line has an invalid quantity: ${line.quantity}`);
    }
    if (!Number.isInteger(line.priceCents) || line.priceCents < 1) {
      throw new Error(`payment link line has an invalid price: ${line.priceCents}`);
    }
  }
  return {
    idempotency_key: options.idempotencyKey,
    order: {
      location_id: options.locationId,
      line_items: lines.map((line) => ({
        name: `${line.motifName} — ${line.garment}, ${line.color}, ${line.size}`,
        quantity: String(line.quantity),
        base_price_money: { amount: line.priceCents, currency: CURRENCY },
        // Kept on the Square line item for the owner's reference; the webhook email names lines by `name`. Line-level, since order-level metadata caps at 10 entries.
        metadata: { design: line.slug, style: line.styleSlug, color: line.color, size: line.size },
      })),
    },
    checkout_options: {
      redirect_url: options.redirectUrl,
      ask_for_shipping_address: true,
      allow_tipping: false,
      shipping_fee: { name: "Shipping", charge: { amount: SHIPPING_CENTS, currency: CURRENCY } },
    },
  };
}

/** Creates one Payment Link for the whole bag and returns the url to send the visitor to. */
export async function createCheckoutLink(
  client: SquareClient,
  lines: readonly CheckoutLine[],
  options: PaymentLinkOptions,
): Promise<string> {
  const body = buildPaymentLinkRequest(lines, {
    locationId: client.locationId,
    redirectUrl: options.redirectUrl,
    idempotencyKey: options.idempotencyKey ?? crypto.randomUUID(),
  });
  const response = await client.request<{ payment_link?: { url?: unknown } }>("POST", PAYMENT_LINKS_PATH, body);
  const url = response.payment_link?.url;
  if (typeof url !== "string" || !isHttpsUrl(url)) {
    throw new SquareApiError(`POST ${PAYMENT_LINKS_PATH}: response had no https checkout url`, null);
  }
  return url;
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
