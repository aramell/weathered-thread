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

// TODO: unconfirmed placeholder blurbs — replace with real garment copy before launch.
const BLURBS: Record<string, string> = {
  "heavyweight-tee":
    "Heavyweight cotton tee, garment-dyed for a soft, broken-in feel from the first wear. Substantial without being stiff, cut for an easy, relaxed fit. Fabric weight and care detail pending final spec sheet.",
  "long-sleeve-tee":
    "Midweight cotton long sleeve tee, garment-dyed for a soft, broken-in feel from the first wear. Cut for a comfortable, everyday fit. Fabric weight and care detail pending final spec sheet.",
  "lightweight-crewneck":
    "Lightweight fleece crewneck, easy to layer and just as soft as the rest of the line from the first wear. Built for everyday wear, not just cold mornings. Fabric weight and care detail pending final spec sheet.",
  "heavyweight-crewneck":
    "Comfort Colors garment-dyed crewneck sweatshirt. Soft, broken-in feel from the first wear, generous fit. Fabric weight and care detail pending final spec sheet.",
};

const FALLBACK_BLURB =
  "Comfort Colors garment-dyed piece, soft and broken-in from the first wear. Fabric weight and care detail pending final spec sheet.";

export function garmentBlurb(styleSlug: string): string {
  return BLURBS[styleSlug] ?? FALLBACK_BLURB;
}
