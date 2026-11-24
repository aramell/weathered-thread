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
  /** Integer cents. */
  priceCents: number;
};

export type ShopColor = {
  slug: string;
  name: string;
  /** Null when no authored photo exists for this color yet. */
  frontImage: string | null;
  swatchColor: string;
  /** Lowest size price, in cents. */
  priceCents: number;
  sizes: ShopSize[];
};

export type ShopGarmentType = {
  slug: string;
  name: string;
  garmentBlurb: string;
  /** Lowest price across colors, in cents. */
  priceCents: number;
  colors: ShopColor[];
};

export type Shop = { garmentTypes: ShopGarmentType[] };

/** Display string for a card or heading: the formatted price. */
export function priceLabel(cents: number): string {
  return formatPrice(cents);
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
 * it exists for the current garment and color; the price narrows as the choice does (size,
 * then color, then the garment's lowest price) and is null before a garment is chosen; Add to
 * Bag needs a garment, color and size plus a motif.
 */
export function derivePicker(shop: Shop, selection: PickerSelection) {
  const garmentType = selection.garmentTypeSlug ? getGarmentType(shop, selection.garmentTypeSlug) : undefined;
  const colorway = garmentType && selection.colorSlug ? getColor(garmentType, selection.colorSlug) : undefined;
  const size = colorway?.sizes.find((s) => s.name === selection.sizeName);
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
    isAddToBagEnabled: Boolean(garmentType && colorway && size && selection.hasMotif),
  };
}

