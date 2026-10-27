/**
 * garment-art — which caricature (see `components/garment-art.tsx`) draws a garment style.
 * Pure so it can be tested; unknown styles fall back to the tee.
 */
export type GarmentArtKind = "tee" | "long-sleeve" | "crewneck";

export function garmentArtKind(styleSlug: string): GarmentArtKind {
  const slug = styleSlug.trim().toLowerCase().replace(/\s+/g, "-");
  if (slug.includes("crewneck")) return "crewneck";
  if (slug.includes("long-sleeve")) return "long-sleeve";
  return "tee";
}
