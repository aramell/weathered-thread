type CollectionLabelProps = {
  name: string;
};

/**
 * collection-label — the small collection name above a design name, in the quiet mono caption
 * style. Place names such as "Sea Isle City" are set in Fraunces where they are titles (story
 * block, collection tiles), per the Brand Identity Board.
 */
export default function CollectionLabel({ name }: CollectionLabelProps) {
  return <p className="font-mono text-caption-mono text-olive">{name}</p>;
}
