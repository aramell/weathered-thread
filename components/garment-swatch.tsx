type GarmentSwatchProps = {
  name: string;
  swatchColor: string;
  selected: boolean;
  inStock: boolean;
  onSelect: () => void;
};

/**
 * garment-swatch — small circular (`rounded-full`) color swatch for garment color selection with
 * its name written underneath, per DESIGN.md: Line border at rest, Wet Ink border when selected.
 * The name is visible text (a swatch is never color-only identification) and tapping it selects
 * the color too. Out-of-stock colors render disabled (never hidden) at reduced opacity, per
 * EXPERIENCE.md's Component Patterns and State Patterns rows. Presentational only:
 * `ProductPickerShell` owns selection state and passes `selected`/`onSelect`, per Epic 3
 * Technical Decisions (no local `useState` here).
 */
export default function GarmentSwatch({
  name,
  swatchColor,
  selected,
  inStock,
  onSelect,
}: GarmentSwatchProps) {
  const label = inStock ? name : `${name} — out of stock`;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!inStock}
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className="flex w-[4.5rem] shrink-0 flex-col items-center gap-1 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span
        aria-hidden="true"
        className={`h-11 w-11 rounded-full border-2 transition-colors ${
          selected ? "border-wet-ink" : "border-line"
        }`}
        style={{ backgroundColor: swatchColor }}
      />
      <span
        aria-hidden="true"
        className={`text-center font-mono text-caption-mono ${
          selected ? "text-wet-ink underline underline-offset-4" : "text-wet-ink"
        }`}
      >
        {name}
      </span>
    </button>
  );
}
