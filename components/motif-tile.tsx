type MotifTileProps = {
  name: string;
};

/**
 * motif-tile — Paper Raised surface, caption-mono name label, rounded
 * corners. Glyph slot is a flat placeholder color block until real
 * embroidery photography exists (no <img>, no spinner) — same precedent as
 * product-card. Browse/read only: no tap-to-select or `selected` state here;
 * Epic 3 wraps this visual contract with interactivity for the picker.
 */
export default function MotifTile({ name }: MotifTileProps) {
  return (
    <div className="rounded bg-paper-raised p-4">
      <div className="mb-3 aspect-square rounded bg-sailcloth" aria-hidden="true" />
      <p className="font-mono text-caption-mono uppercase text-wet-ink">{name}</p>
    </div>
  );
}
