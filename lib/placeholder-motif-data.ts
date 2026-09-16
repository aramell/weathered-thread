/**
 * placeholder-motif-data — stand-in motif data for Epic 3 Story 3.2's
 * motif-first Collection Story entry point. Kept structurally separate
 * from Epic 2's real `content/catalog/` sync pipeline, mirroring
 * `lib/placeholder-shop-data.ts`'s shape: this is the ONLY source of
 * motif data for the Sea Isle Collection Story and the new
 * `/collections/[slug]/[motif]` routes until real authored motif content
 * lands in Epic 2's `content/catalog/{sku}/authored.ts` (motifs are
 * repo-authored only and never sync from Squarespace). Do not write into
 * `content/catalog/{sku}/` or mimic its `synced.ts`/`authored.ts` shape.
 */

export type Motif = {
  slug: string;
  name: string;
};

export const motifs: Motif[] = [
  { slug: "sea-isle-city-waves", name: "Sea Isle City Waves" },
  { slug: "pickleball", name: "Pickleball" },
  { slug: "beach-chair", name: "Beach Chair" },
  { slug: "seagull", name: "Seagull" },
  { slug: "bicycle", name: "Bicycle" },
  { slug: "turtle", name: "Turtle" },
  { slug: "life-preserver-n-j", name: "Life Preserver / N.J." },
  { slug: "exit-17-sea-isle-city", name: "Exit 17 / Sea Isle City" },
  { slug: "sea-isle-shoreline-sailboat", name: "Sea Isle shoreline / sailboat" },
  { slug: "sic-water-tower", name: "SIC Water Tower" },
  { slug: "sea-isle-boat", name: "Sea Isle Boat" },
  { slug: "lobster-loft", name: "Lobster Loft" },
  { slug: "smile-youre-in-sea-isle", name: "Smile You're in Sea Isle" },
];

export function getMotif(slug: string): Motif | undefined {
  return motifs.find((motif) => motif.slug === slug);
}
