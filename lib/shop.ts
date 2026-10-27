/**
 * shop — the one server-only model behind every Shop surface (`/shop`, `/shop/[type]`,
 * `/shop/[type]/[color]`, the homepage grid and the Product Picker). It is built from the
 * synced catalog's per-variation inventory (Style x Primary color x Size). Catalog entries
 * carry the Etsy `url`, so only the url-free `Shop` shape (`lib/shop-types.ts`) may reach a
 * Client Component (NFR8): read it here, in a Server Component, and pass it down as a prop.
 */
import "server-only";

import type { CatalogEntry } from "@/content/catalog/types";
import { getListings } from "./catalog";
import { getLiveListings } from "./live-catalog";
import { COLOR_ORDER, colorPresentation, garmentBlurb } from "./shop-presentation";
import type { Shop, ShopColor, ShopGarmentType, ShopSize } from "./shop-types";

const SIZE_ORDER = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];

const slugify = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

type Cell = { inStock: boolean; priceCents: number | null };

const lowest = (prices: (number | null)[]): number | null => {
  const real = prices.filter((price): price is number => price !== null);
  return real.length > 0 ? Math.min(...real) : null;
};

/**
 * Fold active listings' variations into garment types -> colors -> sizes. A combination is
 * in stock when any listing has stock for it; its price is the lowest in-stock price. A
 * variation missing Style, Primary color or Size throws, naming the listing.
 */
export function buildShop(listings: readonly CatalogEntry[]): Shop {
  // style name -> color name -> size name -> merged cell; Map keeps Etsy's first-appearance order.
  const styles = new Map<string, Map<string, Map<string, Cell>>>();

  for (const listing of listings) {
    if (listing.state !== "active" || listing.variations.length === 0) continue;
    for (const variation of listing.variations) {
      const { Style: style, "Primary color": color, Size: size } = variation.options;
      for (const [axis, value] of [["Style", style], ["Primary color", color], ["Size", size]] as const) {
        if (!value) {
          throw new Error(`listing "${listing.slug}" variation ${variation.productId}: missing option "${axis}"`);
        }
      }
      const colors = styles.get(style) ?? new Map<string, Map<string, Cell>>();
      const sizes = colors.get(color) ?? new Map<string, Cell>();
      const inStock = variation.quantity > 0;
      const previous = sizes.get(size);
      sizes.set(size, {
        inStock: (previous?.inStock ?? false) || inStock,
        priceCents: lowest([previous?.priceCents ?? null, inStock ? variation.priceCents : null]),
      });
      colors.set(color, sizes);
      styles.set(style, colors);
    }
  }

  const garmentTypes: ShopGarmentType[] = [...styles].map(([styleName, colorMap]) => {
    const styleSlug = slugify(styleName);
    const colors: ShopColor[] = [...colorMap].map(([colorName, sizeMap]) => {
      const colorSlug = slugify(colorName);
      const sizes: ShopSize[] = [...sizeMap]
        .map(([name, cell]) => ({ name, inStock: cell.inStock, priceCents: cell.inStock ? cell.priceCents : null }))
        .sort((a, b) => {
          const [ia, ib] = [SIZE_ORDER.indexOf(a.name), SIZE_ORDER.indexOf(b.name)];
          return (ia === -1 ? SIZE_ORDER.length : ia) - (ib === -1 ? SIZE_ORDER.length : ib);
        });
      return {
        slug: colorSlug,
        name: colorName,
        ...colorPresentation(colorSlug),
        inStock: sizes.some((size) => size.inStock),
        priceCents: lowest(sizes.map((size) => size.priceCents)),
        sizes,
      };
    });
    const rank = (slug: string) => {
      const index = (COLOR_ORDER as readonly string[]).indexOf(slug);
      return index === -1 ? COLOR_ORDER.length : index;
    };
    colors.sort((a, b) => rank(a.slug) - rank(b.slug));
    return {
      slug: styleSlug,
      name: styleName,
      garmentBlurb: garmentBlurb(styleSlug),
      inStock: colors.some((color) => color.inStock),
      priceCents: lowest(colors.map((color) => color.priceCents)),
      colors,
    };
  });

  return { garmentTypes };
}

/**
 * One Shop per design, keyed by catalog slug, so a chosen design shows its own prices and
 * stock (the merged `getShop()` pools every listing, which is wrong once a design is picked).
 */
export function buildMotifShops(listings: readonly CatalogEntry[]): Record<string, Shop> {
  return Object.fromEntries(listings.map((listing) => [listing.slug, buildShop([listing])]));
}

/** Synced snapshot: enough for static params, which only need which styles and colors exist. */
export const getShop = (): Shop => buildShop(getListings());

/** Etsy's current colors, sizes, stock and prices (see `lib/live-catalog.ts`). */
export const getLiveShop = async (): Promise<Shop> => buildShop(await getLiveListings());
export const getLiveMotifShops = async (): Promise<Record<string, Shop>> => buildMotifShops(await getLiveListings());
