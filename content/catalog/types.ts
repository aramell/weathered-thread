/**
 * Shape of a listing's human-authored content (`content/catalog/{slug}/authored.ts`).
 * `motifName` is deliberately not `name`: the merged `listing` object also carries the
 * synced Etsy title as `name`, and the two must never shadow each other.
 */
export type AuthoredContent = {
  /** The motif's display name, e.g. "SIC Water Tower". */
  readonly motifName: string;
  /** Place/story copy for the design, as one string. */
  readonly story: string;
  /** Slug of the collection this design belongs to, e.g. "sea-isle". */
  readonly collection: string;
};
