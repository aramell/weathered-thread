/**
 * bag — the server's side of the bag: prices the picks a visitor stored against the catalog and
 * turns a good bag into a Square checkout. The browser only ever supplies picks and quantities
 * (`lib/cart.ts`), so every price here comes from the catalog, never from the request.
 */
import "server-only";

import { buildShop } from "./shop";
import { getListing } from "./catalog";
import { priceCart, type Cart, type PricedCart, type ResolvedPick } from "./cart";
import { resolveSelection } from "./checkout";
import { createCheckoutLink, type CheckoutLine } from "./square-checkout";
import type { SquareClient } from "./square-client";

/** Prices every line of the bag; a pick that no longer resolves comes back flagged unavailable. */
export function priceBag(cart: Cart): PricedCart {
  const shops = new Map<string, ReturnType<typeof buildShop>>();
  return priceCart(cart, (pick): ResolvedPick | null => {
    const listing = getListing(pick.slug);
    if (!listing || listing.state !== "active") return null;
    let shop = shops.get(pick.slug);
    if (!shop) {
      shop = buildShop([listing]);
      shops.set(pick.slug, shop);
    }
    const resolved = resolveSelection(shop, { style: pick.style, color: pick.color, size: pick.size });
    return resolved.ok
      ? {
          motifName: listing.motifName,
          garment: resolved.garment,
          color: resolved.color,
          size: resolved.size,
          priceCents: resolved.priceCents,
        }
      : null;
  });
}

/** The Square lines for a fully priced bag. Throws if any line is unavailable. */
export function toCheckoutLines(priced: PricedCart): CheckoutLine[] {
  return priced.lines.map((line) => {
    if (line.status !== "ok") throw new Error(`bag has an unavailable line: ${line.key}`);
    return {
      slug: line.item.slug,
      motifName: line.pick.motifName,
      styleSlug: line.item.style,
      garment: line.pick.garment,
      color: line.pick.color,
      size: line.pick.size,
      priceCents: line.pick.priceCents,
      quantity: line.item.quantity,
    };
  });
}

export type BagCheckoutResult = { ok: true; url: string } | { ok: false; reason: "empty" | "unavailable" | "failed" };

/** Re-prices the bag and creates its Square Payment Link; Square failures are reported, not thrown. */
export async function startBagCheckout(
  cart: Cart,
  deps: { client: SquareClient; redirectUrl: string },
): Promise<BagCheckoutResult> {
  if (cart.length === 0) return { ok: false, reason: "empty" };
  const priced = priceBag(cart);
  if (priced.hasUnavailable) return { ok: false, reason: "unavailable" };
  try {
    const url = await createCheckoutLink(deps.client, toCheckoutLines(priced), { redirectUrl: deps.redirectUrl });
    return { ok: true, url };
  } catch (error) {
    // SquareApiError messages carry the method, path and status only, never the token.
    console.error("Square checkout failed:", error instanceof Error ? error.message : "unknown error");
    return { ok: false, reason: "failed" };
  }
}
