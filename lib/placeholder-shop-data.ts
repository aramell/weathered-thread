/**
 * placeholder-shop-data — stand-in inventory for Epic 3 Story 3.1's Shop
 * browsing flow. Kept structurally separate from Epic 2's real
 * `content/catalog/` sync pipeline: this is the ONLY source of garment-type
 * and colorway data for the homepage Shop grid and the new `/shop/*` routes
 * until real Squarespace-synced inventory lands. Do not write into
 * `content/catalog/{sku}/` or mimic its `synced.ts`/`authored.ts` shape.
 *
 * All 4 garment types reuse the same 4 colorway photos — there is no real
 * per-type photography or inventory yet.
 */

export type GarmentType = {
  slug: string;
  name: string;
  price: string;
};

export type Colorway = {
  slug: string;
  name: string;
  frontImage: string;
};

export const garmentTypes: GarmentType[] = [
  { slug: "crewneck-sweatshirt", name: "Crewneck Sweatshirt", price: "$68" },
  { slug: "heavyweight-tee", name: "Heavyweight Tee", price: "$38" },
  { slug: "lightweight-crewneck", name: "Lightweight Crewneck", price: "$58" },
  { slug: "long-sleeve-tee", name: "Long Sleeve Tee", price: "$42" },
];

export const colorways: Colorway[] = [
  { slug: "pepper", name: "Pepper", frontImage: "/images/garments/pepper-front.jpg" },
  { slug: "ivory", name: "Ivory", frontImage: "/images/garments/ivory-front.jpg" },
  { slug: "blue-jean", name: "Blue Jean", frontImage: "/images/garments/blue-jean-front.jpg" },
  { slug: "bay", name: "Bay", frontImage: "/images/garments/bay-front.jpg" },
];

export function getGarmentType(slug: string): GarmentType | undefined {
  return garmentTypes.find((type) => type.slug === slug);
}

export function getColorway(slug: string): Colorway | undefined {
  return colorways.find((colorway) => colorway.slug === slug);
}
