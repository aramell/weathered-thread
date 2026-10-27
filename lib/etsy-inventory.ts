/**
 * etsy-inventory — turns Etsy's `GET /listings/{id}/inventory` response into per-variation
 * rows. Shared by the manual catalog sync (`scripts/sync-etsy.ts`) and the live read at request
 * time (`lib/etsy-live.ts`), so both agree on what a purchasable combination is. Pure: no I/O.
 */

/** A response that does not have the shape Etsy documents. */
export class EtsyDataError extends Error {}

/** One purchasable style/color/size combination from the listing's inventory. */
export type SyncedVariation = {
  productId: number;
  /** Etsy property name -> chosen value, e.g. `{ "Size": "M", "Primary color": "Sage" }`. */
  options: Readonly<Record<string, string>>;
  priceCents: number;
  /** 0 when the offering is disabled. */
  quantity: number;
};

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function expectRecord(value: unknown, what: string): Record<string, unknown> {
  if (!isRecord(value)) throw new EtsyDataError(`${what}: malformed response (expected an object)`);
  return value;
}

export function expectCount(value: unknown, what: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new EtsyDataError(`${what}: malformed response (expected a non-negative integer)`);
  }
  return value;
}

/** Etsy `{amount, divisor, currency_code}` -> integer USD cents. */
export function moneyToCents(value: unknown, what: string): number {
  const money = expectRecord(value, `${what} price`);
  const { amount, divisor, currency_code: currency } = money;
  if (currency !== "USD") {
    throw new EtsyDataError(`${what}: unsupported currency ${JSON.stringify(currency)} (USD only)`);
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 0) {
    throw new EtsyDataError(`${what}: malformed price amount`);
  }
  if (typeof divisor !== "number" || !Number.isInteger(divisor) || divisor <= 0) {
    throw new EtsyDataError(`${what}: malformed price divisor`);
  }
  if ((amount * 100) % divisor !== 0) {
    throw new EtsyDataError(`${what}: price ${amount}/${divisor} is not a whole number of cents`);
  }
  return (amount * 100) / divisor;
}

/** `what` prefixes every error, e.g. `listing "x" (123) GET /listings/123/inventory`. */
export function parseInventory(body: unknown, what: string): SyncedVariation[] {
  const inventory = expectRecord(body, what);
  if (!Array.isArray(inventory.products)) throw new EtsyDataError(`${what}: malformed response (expected products[])`);

  const variations: SyncedVariation[] = [];
  for (const raw of inventory.products) {
    const product = expectRecord(raw, `${what} product`);
    if (product.is_deleted === true) continue;
    const productId = expectCount(product.product_id, `${what} product_id`);
    const offerings = Array.isArray(product.offerings) ? product.offerings : [];
    const offering = offerings
      .map((entry) => expectRecord(entry, `${what} product ${productId} offering`))
      .find((entry) => entry.is_deleted !== true);
    if (!offering) continue;

    const options: Record<string, string> = {};
    for (const rawValue of Array.isArray(product.property_values) ? product.property_values : []) {
      const property = expectRecord(rawValue, `${what} product ${productId} property`);
      const values = Array.isArray(property.values) ? property.values.filter((v): v is string => typeof v === "string") : [];
      const name =
        typeof property.property_name === "string" && property.property_name
          ? property.property_name
          : `property ${String(property.property_id)}`;
      options[name] = values.join(", ");
    }
    variations.push({
      productId,
      options,
      priceCents: moneyToCents(offering.price, `${what} product ${productId}`),
      quantity: offering.is_enabled === false ? 0 : expectCount(offering.quantity, `${what} product ${productId} quantity`),
    });
  }
  return variations;
}

/** Listing price as Etsy shows it: the lowest price still on offer. */
export function livePrice(variations: readonly SyncedVariation[], fallbackCents: number): number {
  const inStock = variations.filter((variation) => variation.quantity > 0);
  const pool = inStock.length > 0 ? inStock : variations;
  return pool.length > 0 ? Math.min(...pool.map((variation) => variation.priceCents)) : fallbackCents;
}
