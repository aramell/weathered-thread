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
  /**
   * THE GARMENT section copy (Story 3.4). Crewneck Sweatshirt reuses
   * `key-product.html`'s real reference text verbatim. The other three are
   * TODO-flagged placeholder blurbs — provisional until real per-garment
   * copy and a final spec sheet exist.
   */
  garmentBlurb: string;
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
  {
    slug: "crewneck-sweatshirt",
    name: "Crewneck Sweatshirt",
    price: 6800,
    // Real reference copy, reused verbatim from key-product.html:81-137.
    garmentBlurb:
      "Comfort Colors garment-dyed crewneck sweatshirt. Soft, broken-in feel from the first wear, generous fit. Fabric weight and care detail pending final spec sheet.",
  },
  {
    slug: "heavyweight-tee",
    name: "Heavyweight Tee",
    price: 3800,
    // TODO: unconfirmed placeholder — replace with real garment copy before launch.
    garmentBlurb:
      "Heavyweight cotton tee, garment-dyed for a soft, broken-in feel from the first wear. Substantial without being stiff, cut for an easy, relaxed fit. Fabric weight and care detail pending final spec sheet.",
  },
  {
    slug: "lightweight-crewneck",
    name: "Lightweight Crewneck",
    price: 5800,
    // TODO: unconfirmed placeholder — replace with real garment copy before launch.
    garmentBlurb:
      "Lightweight fleece crewneck, easy to layer and just as soft as the rest of the line from the first wear. Built for everyday wear, not just cold mornings. Fabric weight and care detail pending final spec sheet.",
  },
  {
    slug: "long-sleeve-tee",
    name: "Long Sleeve Tee",
    price: 4200,
    // TODO: unconfirmed placeholder — replace with real garment copy before launch.
    garmentBlurb:
      "Midweight cotton long sleeve tee, garment-dyed for a soft, broken-in feel from the first wear. Cut for a comfortable, everyday fit. Fabric weight and care detail pending final spec sheet.",
  },
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
