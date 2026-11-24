/**
 * shop-presentation — authored presentation for the Shop model. Etsy supplies names, prices
 * and stock but no swatch color, photo or garment copy, so those live here, keyed by the
 * slug of the Etsy `Primary color` / `Style` value. An unknown color or style falls back to
 * a neutral swatch / no photo / generic blurb instead of failing.
 */
export type ColorPresentation = { frontImage: string | null; swatchColor: string };

/** Display order for colors; any color not listed follows in Etsy's order. */
export const COLOR_ORDER = ["pepper", "ivory", "blue-jean", "bay"] as const;

const COLORS: Record<string, ColorPresentation> = {
  pepper: { frontImage: "/images/garments/pepper-front.jpg", swatchColor: "#5B5652" },
  ivory: { frontImage: "/images/garments/ivory-front.jpg", swatchColor: "#EFE9D8" },
  "blue-jean": { frontImage: "/images/garments/blue-jean-front.jpg", swatchColor: "#45607A" },
  bay: { frontImage: "/images/garments/bay-front.jpg", swatchColor: "#7F8F8A" },
};

const FALLBACK_COLOR: ColorPresentation = { frontImage: null, swatchColor: "#C9C4B8" };

export function colorPresentation(slug: string): ColorPresentation {
  return COLORS[slug] ?? FALLBACK_COLOR;
}

// Written from the owner's Style Chart tile (Nov 2026): style number, weight and fit as printed
// there. Add nothing the tile does not say (no ounces, no care instructions).
const BLURBS: Record<string, string> = {
  "heavyweight-tee":
    "Comfort Colors Style 1717. Heavyweight cotton in a relaxed, unisex fit, garment-dyed for rich, vintage-inspired color and a soft, lived-in feel.",
  "long-sleeve-tee":
    "Comfort Colors Style 6014. Heavyweight cotton in a relaxed, unisex fit, garment-dyed for rich, vintage-inspired color and a soft, lived-in feel.",
  "lightweight-crewneck":
    "Comfort Colors Style 1466. Lightweight cotton in a relaxed, unisex fit, garment-dyed for rich, vintage-inspired color and a soft, lived-in feel.",
  "heavyweight-crewneck":
    "Comfort Colors Style 1566. Heavyweight cotton in a relaxed, unisex fit, garment-dyed for rich, vintage-inspired color and a soft, lived-in feel.",
};

const FALLBACK_BLURB =
  "Comfort Colors garment-dyed cotton in a relaxed, unisex fit, with rich, vintage-inspired color and a soft, lived-in feel.";

export function garmentBlurb(styleSlug: string): string {
  return BLURBS[styleSlug] ?? FALLBACK_BLURB;
}
