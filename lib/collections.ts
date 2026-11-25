/**
 * collections — display data for each collection slug used by `authored.ts`'s `collection`
 * field. Plain data, safe to import from Client Components. A catalog collection with no entry
 * here has no collection page.
 */
export type Collection = {
  slug: string;
  /** "place" collections are named for a location and set that name in Anton; "brand" is the Weathered Thread mark. */
  kind: "place" | "brand";
  /** Short name used in running copy, e.g. "the Sea Isle City collection". */
  name: string;
  eyebrow: string;
  heading: string;
  story: string[];
};

export const collections: Collection[] = [
  {
    slug: "sea-isle",
    kind: "place",
    name: "Sea Isle City",
    // Collection language from the Master Brand Guidelines; never the site tagline.
    eyebrow: "For places worth remembering",
    heading: "Sea Isle City",
    story: [
      "A water tower on the skyline, a boat on the water, the exit you take when you're almost there — small landmarks of Sea Isle City, stitched onto soft, ring-spun, garment-dyed cotton with a lived-in feel.",
    ],
  },
  {
    slug: "brand",
    kind: "brand",
    name: "Weathered Thread",
    eyebrow: "Collection",
    heading: "Weathered Thread",
    story: [
      "The Weathered Thread mark, stitched simply onto everyday favorites.",
    ],
  },
];

export function getCollection(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}
