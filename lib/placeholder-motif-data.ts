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
  /**
   * Emotional-description section copy (Story 3.4), rendered above THE
   * GARMENT/THE EMBROIDERY. SIC Water Tower reuses `key-product.html`'s
   * real reference narrative verbatim. The other twelve are short,
   * TODO-flagged placeholder lines — provisional until real per-motif
   * narrative copy is written. THE EMBROIDERY itself is a reusable
   * template computed from `motif.name` in `product-picker-shell.tsx`,
   * not stored here.
   */
  emotionalDescription: string;
};

export const motifs: Motif[] = [
  {
    slug: "sea-isle-city-waves",
    name: "Sea Isle City Waves",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "Sea Isle City, spelled out in waves — the kind of sign you photograph on the way to the beach, every single summer.",
  },
  {
    slug: "pickleball",
    name: "Pickleball",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "The paddle and the ball that took over the courts this year — stitched here so it stays part of the summer, not just the season.",
  },
  {
    slug: "beach-chair",
    name: "Beach Chair",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "One folding chair, angled toward the water — the whole day's plan, in outline.",
  },
  {
    slug: "seagull",
    name: "Seagull",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "A gull mid-glide over the dunes — the sound that means the beach is close before you can see it.",
  },
  {
    slug: "bicycle",
    name: "Bicycle",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "A boardwalk cruiser, kickstand down — the slowest, best way to get anywhere in Sea Isle.",
  },
  {
    slug: "turtle",
    name: "Turtle",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "A diamondback terrapin, unhurried — Sea Isle's marshes belong to it as much as anyone.",
  },
  {
    slug: "life-preserver-n-j",
    name: "Life Preserver / N.J.",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "A life ring stamped N.J. — equal parts safety gear and postcard.",
  },
  {
    slug: "exit-17-sea-isle-city",
    name: "Exit 17 / Sea Isle City",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "Exit 17 off the Parkway — the sign that means the last stretch of the drive, every time.",
  },
  {
    slug: "sea-isle-shoreline-sailboat",
    name: "Sea Isle shoreline / sailboat",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "A sailboat against the shoreline — the view from the jetty, held still.",
  },
  {
    slug: "sic-water-tower",
    name: "SIC Water Tower",
    // Real reference copy, reused verbatim from key-product.html:81-137.
    emotionalDescription:
      "A water tower on the skyline means you're close. This one's Sea Isle's — stitched onto a heavyweight crewneck built to soften with every wash, not wear out.",
  },
  {
    slug: "sea-isle-boat",
    name: "Sea Isle Boat",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "A boat pulled up on Sea Isle's dock — someone's morning already out on the water.",
  },
  {
    slug: "lobster-loft",
    name: "Lobster Loft",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "Lobster Loft's sign, stitched instead of snapped — a landmark for people who already know where it is.",
  },
  {
    slug: "smile-youre-in-sea-isle",
    name: "Smile You're in Sea Isle",
    // TODO: unconfirmed placeholder — replace with real emotional-description copy before launch.
    emotionalDescription:
      "The welcome sign at the edge of town — the first thing you see, and the last thing you remember.",
  },
];

export function getMotif(slug: string): Motif | undefined {
  return motifs.find((motif) => motif.slug === slug);
}
