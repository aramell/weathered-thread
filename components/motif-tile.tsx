type MotifTileProps = {
  name: string;
  selected?: boolean;
};

/**
 * motif-tile — Paper Raised surface, caption-mono name label, rounded
 * corners. Glyph slot is a flat placeholder color block until real
 * embroidery photography exists (no <img>, no spinner) — same precedent as
 * product-card. Presentational: `selected` (default false) draws the
 * Antique Brass selected border internally so every caller (Collection
 * Story gallery via `motif-tile-link`, Product Picker's motif switcher)
 * shares one border implementation instead of wrapping its own. Still
 * browse/read only — no tap handling here, callers own selection.
 */
export default function MotifTile({ name, selected = false }: MotifTileProps) {
  return (
    <div
      className={`rounded border-2 bg-paper-raised p-4 ${
        selected ? "border-antique-brass" : "border-transparent"
      }`}
    >
      <div className="mb-3 aspect-square rounded bg-sailcloth" aria-hidden="true" />
      <p className="font-mono text-caption-mono uppercase text-wet-ink">{name}</p>
    </div>
  );
}
