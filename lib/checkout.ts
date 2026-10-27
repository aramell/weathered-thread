/**
 * checkout — the Checkout Handoff's pure helpers: the selection carried from the Product
 * Picker in the URL, how it is checked against current stock, and the `shop.` link that
 * forwards to the design's Etsy listing. Url-free like `lib/shop-types.ts`: the Etsy listing
 * url is resolved server-side by `app/go/[slug]/route.ts` and never appears in markup (NFR8).
 */
import type { SyncedVariation } from "./etsy-inventory";
import { derivePicker, slugify, type Shop } from "./shop-types";

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

/**
 * The origin to forward through: `SHOP_ORIGIN` when it is an https origin (http only for
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

/** The link the Continue button points at: always the shop host, never etsy.com. */
export function forwardHref(motifSlug: string, selection: CheckoutSelection, origin?: string): string {
  return `${shopOrigin(origin)}/go/${encodeURIComponent(motifSlug)}?${selectionQuery(selection)}`;
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

/**
 * The Etsy listing url with the visitor's pick preselected (`variation0=<value id>&...`), so
 * they don't choose it again on Etsy. Falls back to the bare url when the pick doesn't match
 * a variation or the variations carry no ids (synced before ids were kept).
 */
export function listingUrlWithSelection(
  listingUrl: string,
  variations: readonly SyncedVariation[],
  selection: CheckoutSelection,
): string {
  const match = variations.find(
    ({ options }) =>
      slugify(options.Style ?? "") === selection.style &&
      slugify(options["Primary color"] ?? "") === selection.color &&
      options.Size === selection.size,
  );
  if (!match?.optionIds) return listingUrl;

  const url = new URL(listingUrl);
  match.optionIds.forEach(({ valueId }, index) => url.searchParams.set(`variation${index}`, String(valueId)));
  return url.toString();
}
