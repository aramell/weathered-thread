type ProductCardProps = {
  name: string;
  price: string;
};

/**
 * product-card — Paper Raised surface, body title, price-mono price,
 * rounded.DEFAULT corners. Image slot is a flat Sailcloth color block until
 * real product photography exists (no <img>, no spinner). Reused by Epic 3's
 * Shop grid.
 */
export default function ProductCard({ name, price }: ProductCardProps) {
  return (
    <div className="rounded bg-paper-raised p-4">
      <div className="mb-3 aspect-square rounded bg-sailcloth" aria-hidden="true" />
      <p className="font-display text-body">{name}</p>
      <p className="font-mono text-price-mono">{price}</p>
    </div>
  );
}
