/**
 * shop-types — the serializable, url-free shape of the Shop model (see `lib/shop.ts`).
 * Safe to import from Client Components: it carries only names, slugs, integer cents and
 * booleans — never an Etsy `url` or listing id (NFR8).
 */
import { formatPrice } from "./format-price";

/** The url segment for a style or color name: "Blue Jean" -> "blue-jean". */
export const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export type ShopSize = {
  name: string;
  inStock: boolean;
  /** Integer cents; null when out of stock (a disabled offering's price is meaningless). */
  priceCents: number | null;
};

export type ShopColor = {
  slug: string;
  name: string;
  /** Null when no authored photo exists for this color yet. */
  frontImage: string | null;
  swatchColor: string;
  inStock: boolean;
  /** Lowest in-stock size price, in cents; null when out of stock. */
  priceCents: number | null;
  sizes: ShopSize[];
};

export type ShopGarmentType = {
  slug: string;
  name: string;
  garmentBlurb: string;
  inStock: boolean;
  /** Lowest in-stock price across colors, in cents; null when nothing is in stock. */
  priceCents: number | null;
  colors: ShopColor[];
};

export type Shop = { garmentTypes: ShopGarmentType[] };

/** Display string for a card or heading: the formatted price, or "Sold out" with no price. */
export function priceLabel(cents: number | null): string {
  return cents === null ? "Sold out" : formatPrice(cents);
}

export function getGarmentType(shop: Shop, slug: string): ShopGarmentType | undefined {
  return shop.garmentTypes.find((type) => type.slug === slug);
}

export function getColor(type: ShopGarmentType, slug: string): ShopColor | undefined {
  return type.colors.find((color) => color.slug === slug);
}

export type PickerSelection = {
  garmentTypeSlug: string | null;
  colorSlug: string | null;
  sizeName: string | null;
  hasMotif: boolean;
};

/**
 * The picker's derived state, kept pure so it can be tested. A chosen size counts only while
 * it is in stock for the current garment and color; the price narrows as the choice does
 * (size, then color, then the garment's lowest in-stock price) and is null for an
 * out-of-stock color; Add to Bag needs an in-stock color and size plus a motif.
 */
export function derivePicker(shop: Shop, selection: PickerSelection) {
  const garmentType = selection.garmentTypeSlug ? getGarmentType(shop, selection.garmentTypeSlug) : undefined;
  const colorway = garmentType && selection.colorSlug ? getColor(garmentType, selection.colorSlug) : undefined;
  const size = colorway?.sizes.find((s) => s.name === selection.sizeName && s.inStock);
  const priceCents = size
    ? size.priceCents
    : colorway
      ? colorway.priceCents
      : (garmentType?.priceCents ?? null);
  return {
    garmentType,
    colorway,
    size,
    priceCents,
    isAddToBagEnabled: Boolean(garmentType && colorway?.inStock && size && selection.hasMotif),
  };
}

