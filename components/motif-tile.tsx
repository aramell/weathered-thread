import Image from "next/image";

type MotifTileProps = {
  name: string;
  /** Listing photo for the glyph slot; a flat placeholder block when absent. */
  image?: string;
  selected?: boolean;
};

/**
 * motif-tile — Paper Raised surface, caption-mono name label, rounded
 * corners. Glyph slot is the listing's first Etsy photo when `image` is
 * supplied, else a flat placeholder color block (no spinner) — same
 * precedent as product-card. Presentational: `selected` (default false) draws the
 * Antique Brass selected border internally so every caller (Collection
 * Story gallery via `motif-tile-link`, Product Picker's motif switcher)
 * shares one border implementation instead of wrapping its own. Still
 * browse/read only — no tap handling here, callers own selection.
 */
export default function MotifTile({ name, image, selected = false }: MotifTileProps) {
  return (
    <div
      className={`rounded border-2 bg-paper-raised p-4 ${
        selected ? "border-antique-brass" : "border-transparent"
      }`}
    >
      {image ? (
        <div className="relative mb-3 aspect-square overflow-hidden rounded bg-sailcloth">
          {/* Decorative: the caption below names the motif. */}
          <Image
            src={image}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="mb-3 aspect-square rounded bg-sailcloth" aria-hidden="true" />
      )}
      <p className="font-mono text-caption-mono uppercase text-wet-ink">{name}</p>
    </div>
  );
}
