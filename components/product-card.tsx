import Image from "next/image";

type ProductCardProps = {
  name: string;
  price: string;
  image?: string;
};

/**
 * product-card — Paper Raised surface, body title, price-mono price,
 * rounded.DEFAULT corners. Image slot is a flat Sailcloth color block when
 * no `image` is supplied (e.g. the homepage Shop grid's garment-type
 * cards, which stay flat per Boundaries), or a real `next/image` (fill)
 * photo when one is (e.g. `/shop/[type]`'s colorway cards). Reused by
 * Epic 3's Shop grid and browse-by-color flow.
 */
export default function ProductCard({ name, price, image }: ProductCardProps) {
  return (
    <div className="rounded bg-paper-raised p-4">
      {image ? (
        <div className="relative mb-3 aspect-square overflow-hidden rounded">
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 33vw"
            className="object-cover"
          />
        </div>
      ) : (
        <div className="mb-3 aspect-square rounded bg-sailcloth" aria-hidden="true" />
      )}
      <p className="font-body text-body">{name}</p>
      <p className="font-mono text-price-mono">{price}</p>
    </div>
  );
}
