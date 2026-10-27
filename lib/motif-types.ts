/**
 * motif-types — the serializable, url-free shape of a motif (a design in the catalog, see
 * `lib/motifs.ts`). Safe to import from Client Components: names and slugs only, never an Etsy
 * `url` or listing id (NFR8).
 */
export type MotifImage = {
  /** Public Etsy CDN url (570px wide). Not the Etsy listing url. */
  url: string;
  width: number;
  height: number;
  alt: string;
};

export type Motif = {
  /** The catalog slug, also the `/collections/[slug]/[motif]` route segment. */
  slug: string;
  name: string;
  /** Story copy from `authored.ts`, shown above THE GARMENT. */
  story: string;
  /** Collection slug, e.g. "sea-isle". */
  collection: string;
  /** Listing photos in Etsy's rank order; empty when the listing has none. */
  images: MotifImage[];
};
