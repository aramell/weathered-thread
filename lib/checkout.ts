/**
 * checkout — the Checkout Handoff's pure helpers: the selection carried from the Product
 * Picker in the URL, how it is checked against current stock, and the `shop.` link that
 * forwards to the design's Etsy listing. Url-free like `lib/shop-types.ts`: the Etsy listing
 * url is resolved server-side by `app/go/[slug]/route.ts` and never appears in markup (NFR8).
 */
import { derivePicker, type Shop } from "./shop-types";

/** Where the forward is served; the shop host points at this same app. */
export const DEFAULT_SHOP_ORIGIN = "https://shop.weatheredthread.com";

export type CheckoutSelection = { style: string; color: string; size: string };

const KEYS = ["style", "color", "size"] as const;

export function selectionQuery(selection: CheckoutSelection): string {
  return new URLSearchParams(selection).toString();
}

/** The Handoff page for a design and selection (the picker's Add to Bag target). */
export function handoffPath(motifSlug: string, selection: CheckoutSelection, failed = false): string {
  const params = new URLSearchParams(selection);
  if (failed) params.set("failed", "1");
  return `/checkout/${encodeURIComponent(motifSlug)}?${params}`;
}

/** The link the Continue button points at: always the shop host, never etsy.com. */
export function forwardHref(motifSlug: string, selection: CheckoutSelection, origin = DEFAULT_SHOP_ORIGIN): string {
  return `${origin}/go/${encodeURIComponent(motifSlug)}?${selectionQuery(selection)}`;
}

/** Reads style/color/size from search params; null unless all three are present single values. */
export function parseSelection(params: Record<string, string | string[] | undefined>): CheckoutSelection | null {
  const picked: Partial<CheckoutSelection> = {};
  for (const key of KEYS) {
    const value = params[key];
    if (typeof value !== "string" || value === "") return null;
    picked[key] = value;
  }
  return picked as CheckoutSelection;
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
