/**
 * placeholder-shop-data — stand-in inventory for Epic 3 Story 3.1's Shop
 * browsing flow. Kept structurally separate from Epic 2's real
 * `content/catalog/` sync pipeline: this is the ONLY source of garment-type
 * and colorway data for the homepage Shop grid and the new `/shop/*` routes
 * until real Squarespace-synced inventory lands. Do not write into
 * `content/catalog/{sku}/` or mimic its `synced.ts`/`authored.ts` shape.
 *
 * All 4 garment types reuse the same 4 colorway photos — there is no real
 * per-type photography or inventory yet. Sizes are a flat, garment- and
 * color-independent list (Story 3.3) — there is no per-size stock modeling
 * yet, so every size is always selectable. `inStock` is likewise flat
 * across garment types (Ivory is out of stock everywhere it appears),
 * matching `key-product.html`'s own example.
 */

export type GarmentType = {
  slug: string;
  name: string;
  /** Integer cents — render only via `lib/format-price.ts`'s `formatPrice()`. */
  price: number;
};

export type Colorway = {
  slug: string;
  name: string;
  frontImage: string;
  /** CSS color value for the circular `garment-swatch` unit. */
  swatchColor: string;
  inStock: boolean;
};

export const sizes: string[] = ["S", "M", "L", "XL"];

export const garmentTypes: GarmentType[] = [
  { slug: "crewneck-sweatshirt", name: "Crewneck Sweatshirt", price: 6800 },
  { slug: "heavyweight-tee", name: "Heavyweight Tee", price: 3800 },
  { slug: "lightweight-crewneck", name: "Lightweight Crewneck", price: 5800 },
  { slug: "long-sleeve-tee", name: "Long Sleeve Tee", price: 4200 },
];

export const colorways: Colorway[] = [
  {
    slug: "pepper",
    name: "Pepper",
    frontImage: "/images/garments/pepper-front.jpg",
    swatchColor: "#5B5652",
    inStock: true,
  },
  {
    slug: "ivory",
    name: "Ivory",
    frontImage: "/images/garments/ivory-front.jpg",
    swatchColor: "#EFE9D8",
    inStock: false,
  },
  {
    slug: "blue-jean",
    name: "Blue Jean",
    frontImage: "/images/garments/blue-jean-front.jpg",
    swatchColor: "#45607A",
    inStock: true,
  },
  {
    slug: "bay",
    name: "Bay",
    frontImage: "/images/garments/bay-front.jpg",
    swatchColor: "#7F8F8A",
    inStock: true,
  },
];

export function getGarmentType(slug: string): GarmentType | undefined {
  return garmentTypes.find((type) => type.slug === slug);
}

export function getColorway(slug: string): Colorway | undefined {
  return colorways.find((colorway) => colorway.slug === slug);
}
