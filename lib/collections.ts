/**
 * collections — display data for each collection slug used by `authored.ts`'s `collection`
 * field. Plain data, safe to import from Client Components. A catalog collection with no entry
 * here has no collection page.
 */
export type Collection = {
  slug: string;
  /** Short name used in running copy, e.g. "the Sea Isle collection". */
  name: string;
  eyebrow: string;
  heading: string;
  story: string[];
};

export const collections: Collection[] = [
  {
    slug: "sea-isle",
    name: "Sea Isle",
    eyebrow: "Collection",
    heading: "Sea Isle",
    story: [
      "A water tower on the skyline, a boat on the water, the exit you take when you're almost there — small landmarks of Sea Isle City, stitched onto garment-dyed cotton built to soften with wear.",
    ],
  },
  {
    slug: "brand",
    name: "Weathered Thread",
    eyebrow: "Collection",
    heading: "Weathered Thread",
    story: [
      "The Weathered Thread mark, stitched simply onto everyday favorites. Made to remember.",
    ],
  },
];

export function getCollection(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}
