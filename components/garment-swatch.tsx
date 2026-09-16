type GarmentSwatchProps = {
  name: string;
  swatchColor: string;
  selected: boolean;
  inStock: boolean;
  onSelect: () => void;
};

/**
 * garment-swatch — small circular (`rounded-full`) color swatch for
 * garment color selection, per DESIGN.md: Line border at rest, Wet Ink
 * border when selected. Out-of-stock colors render disabled (never
 * hidden) at reduced opacity, per EXPERIENCE.md's Component Patterns and
 * State Patterns rows — the color name is always in an accessible label,
 * never color-only identification. Presentational only: `ProductPickerShell`
 * owns selection state and passes `selected`/`onSelect`, per Epic 3
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
      className={`h-11 w-11 shrink-0 rounded-full border-2 transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
        selected ? "border-wet-ink" : "border-line"
      }`}
      style={{ backgroundColor: swatchColor }}
    />
  );
}
