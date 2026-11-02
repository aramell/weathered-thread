import type { SyncedListing } from "../../scripts/sync-etsy";

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
  /** This design's photos, in display order; the first is its thumbnail. Files live in `public/images/designs/{slug}/`. */
  readonly photos: readonly AuthoredPhoto[];
};

/** One photo of a design, served from this site (not from Etsy). */
export type AuthoredPhoto = {
  /** Site path, e.g. "/images/designs/sic-wave/01.jpg". */
  readonly src: string;
  readonly width: number;
  readonly height: number;
  /** What the photo shows, for screen readers. */
  readonly alt: string;
};

/** A listing as the merge in `{slug}/index.ts` produces it: every synced field plus every authored field. */
export type CatalogListing = SyncedListing & AuthoredContent;

/** A merged listing plus the manifest slug it is filed under (also its directory name and route segment). */
export type CatalogEntry = CatalogListing & { readonly slug: string };
