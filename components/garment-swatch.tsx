type GarmentSwatchProps = {
  name: string;
  swatchColor: string;
  selected: boolean;
  onSelect: () => void;
};

/**
 * garment-swatch — small circular (`rounded-full`) color swatch for garment color selection with
 * its name written underneath, per DESIGN.md: Line border at rest, Wet Ink border when selected.
 * The name is visible text (a swatch is never color-only identification) and tapping it selects
 * the color too. Presentational only:
 * `ProductPickerShell` owns selection state and passes `selected`/`onSelect`, per Epic 3
 * Technical Decisions (no local `useState` here).
 */
export default function GarmentSwatch({
  name,
  swatchColor,
  selected,
  onSelect,
}: GarmentSwatchProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={name}
      title={name}
      className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1"
    >
      <span
        aria-hidden="true"
        className={`h-11 w-11 rounded-full border-2 transition-colors ${
          selected ? "border-weathered-ink" : "border-line"
        }`}
        style={{ backgroundColor: swatchColor }}
      />
      <span
        aria-hidden="true"
        className={`text-center font-mono text-caption-mono ${
          selected ? "text-weathered-ink underline underline-offset-4" : "text-weathered-ink"
        }`}
      >
        {name}
      </span>
    </button>
  );
}
