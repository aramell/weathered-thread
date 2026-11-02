/**
 * checkout — pure helpers shared by the bag and its checkout: how a pick is checked against the
 * catalog, and the origin Square sends the visitor back to. Url-free like `lib/shop-types.ts`.
 */
import type { Shop } from "./shop-types";
import { derivePicker } from "./shop-types";

/** Where Square sends the visitor back to: the live site. */
export const DEFAULT_SHOP_ORIGIN = "https://weatheredthread.com";

export type CheckoutSelection = { style: string; color: string; size: string };

/**
 * The origin to return the visitor to: `SHOP_ORIGIN` when it is an https origin (http only for
 * localhost), else the default. An empty or malformed value must not turn the link relative.
 */
export function shopOrigin(raw?: string): string {
  try {
    const url = new URL(raw?.trim() ?? "");
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (url.protocol === "https:" || (url.protocol === "http:" && local)) return url.origin;
  } catch {
    // not a URL: fall through to the default
  }
  return DEFAULT_SHOP_ORIGIN;
}

export type ResolvedSelection =
  | { ok: true; garment: string; color: string; size: string; priceCents: number }
  | { ok: false; reason: "unavailable" | "sold-out" };

/**
 * Checks a selection against the design's current Shop. "sold-out" means the combination
 * exists but has no stock now (it may have sold since the visitor picked it).
 */
export function resolveSelection(shop: Shop | undefined, selection: CheckoutSelection): ResolvedSelection {
  const garmentType = shop?.garmentTypes.find((type) => type.slug === selection.style);
  const colorway = garmentType?.colors.find((color) => color.slug === selection.color);
  const sizeEntry = colorway?.sizes.find((size) => size.name === selection.size);
  if (!shop || !garmentType || !colorway || !sizeEntry) return { ok: false, reason: "unavailable" };

  const { size, priceCents } = derivePicker(shop, {
    garmentTypeSlug: garmentType.slug,
    colorSlug: colorway.slug,
    sizeName: sizeEntry.name,
    hasMotif: true,
  });
  if (!size || priceCents === null) return { ok: false, reason: "sold-out" };
  return { ok: true, garment: garmentType.name, color: colorway.name, size: size.name, priceCents };
}
