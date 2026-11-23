type CollectionLabelProps = {
  name: string;
  /** A place collection (Sea Isle): its name is location wording, set in Anton. */
  place?: boolean;
};

/**
 * collection-label — the small collection name above a design name. Place names are location
 * wording and use Anton, uppercase and tracked, per the Master Brand Guidelines (Nov 2026);
 * the brand collection keeps the quiet mono label.
 */
export default function CollectionLabel({ name, place = false }: CollectionLabelProps) {
  return place ? (
    <p className="font-location text-sm uppercase tracking-location text-marsh-sage">{name}</p>
  ) : (
    <p className="font-mono text-caption-mono text-marsh-sage">{name}</p>
  );
}
