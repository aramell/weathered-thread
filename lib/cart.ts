/**
 * cart — the bag's pure model. The bag lives in the visitor's browser as picks and quantities
 * only; it never holds a price or a name, so nothing read back from storage can set what
 * is charged. Url-free and safe to import from Client Components (like `lib/shop-types.ts`).
 */

export const MAX_QUANTITY = 10;
/** Flat US shipping, charged once per order however many pieces it holds. */
export const SHIPPING_CENTS = 599;
/** Bounds what a hand-edited or runaway store can make the server resolve. */
export const MAX_LINES = 20;
const MAX_FIELD_LENGTH = 100;

/** A design and its garment style, color slug and size name: the key to one orderable pick. */
export type CartPick = { slug: string; style: string; color: string; size: string };
export type CartItem = CartPick & { quantity: number };
export type Cart = readonly CartItem[];

export const itemKey = (pick: CartPick): string => [pick.slug, pick.style, pick.color, pick.size].join("|");

const clampQuantity = (quantity: number): number => Math.min(MAX_QUANTITY, Math.max(1, Math.floor(quantity)));

export function addItem(cart: Cart, pick: CartPick, quantity = 1): Cart {
  const key = itemKey(pick);
  const existing = cart.find((item) => itemKey(item) === key);
  if (existing) {
    return cart.map((item) => (item === existing ? { ...item, quantity: clampQuantity(item.quantity + quantity) } : item));
  }
  if (cart.length >= MAX_LINES) return cart;
  const { slug, style, color, size } = pick;
  return [...cart, { slug, style, color, size, quantity: clampQuantity(quantity) }];
}

export function setQuantity(cart: Cart, key: string, quantity: number): Cart {
  if (!Number.isFinite(quantity)) return cart;
  return cart.map((item) => (itemKey(item) === key ? { ...item, quantity: clampQuantity(quantity) } : item));
}

export function removeItem(cart: Cart, key: string): Cart {
  return cart.filter((item) => itemKey(item) !== key);
}

export const cartCount = (cart: Cart): number => cart.reduce((total, item) => total + item.quantity, 0);

export const serializeCart = (cart: Cart): string => JSON.stringify(cart);

const isField = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= MAX_FIELD_LENGTH;

/**
 * Reads whatever storage held. Anything unreadable is an empty bag, and entries that don't
 * look like a pick are dropped rather than trusted; extra fields (a price someone added by
 * hand) are ignored.
 */
export function parseCart(raw: string | null | undefined): Cart {
  if (!raw) return [];
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(data)) return [];

  let cart: Cart = [];
  for (const entry of data) {
    if (typeof entry !== "object" || entry === null) continue;
    const { slug, style, color, size, quantity } = entry as Record<string, unknown>;
    if (!isField(slug) || !isField(style) || !isField(color) || !isField(size)) continue;
    if (typeof quantity !== "number" || !Number.isFinite(quantity)) continue;
    cart = addItem(cart, { slug, style, color, size }, quantity);
  }
  return cart;
}

/** What a pick resolves to against the catalog, as named on the bag and on Square's line item. */
export type ResolvedPick = { motifName: string; garment: string; color: string; size: string; priceCents: number };

export type PricedLine =
  | { status: "ok"; key: string; item: CartItem; pick: ResolvedPick; lineCents: number }
  | { status: "unavailable"; key: string; item: CartItem };

export type PricedCart = { lines: PricedLine[]; subtotalCents: number; hasUnavailable: boolean };

/** Prices every line through `resolve`; a pick it can't resolve is flagged and left out of the subtotal. */
export function priceCart(cart: Cart, resolve: (pick: CartPick) => ResolvedPick | null): PricedCart {
  const lines = cart.map((item): PricedLine => {
    const key = itemKey(item);
    const pick = resolve(item);
    return pick ? { status: "ok", key, item, pick, lineCents: pick.priceCents * item.quantity } : { status: "unavailable", key, item };
  });
  return {
    lines,
    subtotalCents: lines.reduce((total, line) => total + (line.status === "ok" ? line.lineCents : 0), 0),
    hasUnavailable: lines.some((line) => line.status === "unavailable"),
  };
}
