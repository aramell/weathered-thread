import GarmentArt from "@/components/garment-art";
import type { GarmentArtKind } from "@/lib/garment-art";

type GarmentOptionProps = {
  name: string;
  price: string;
  kind: GarmentArtKind;
  /** Selected garment color, or undefined before one is chosen. */
  tint?: string;
  selected: boolean;
  onSelect: () => void;
};

/**
 * garment-option — one garment type in the picker: caricature above its name and price on a
 * Paper Raised card. Selected state is a 2px Wet Ink border (tint is never the only signal);
 * `aria-pressed` announces it. Presentational: the picker owns selection.
 */
export default function GarmentOption({ name, price, kind, tint, selected, onSelect }: GarmentOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`flex min-h-11 w-full flex-col items-center rounded border-2 bg-paper-raised px-1 py-3 text-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass ${
        selected ? "border-wet-ink" : "border-transparent"
      }`}
    >
      <GarmentArt kind={kind} tint={tint} className="mb-2 h-16 w-16" />
      <span className="font-body text-body-sm">{name}</span>
      <span className="mt-0.5 font-mono text-caption-mono">{price}</span>
    </button>
  );
}
