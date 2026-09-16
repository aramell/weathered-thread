import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import { formatPrice } from "@/lib/format-price";
import { garmentTypes } from "@/lib/placeholder-shop-data";

export const metadata: Metadata = {
  title: "Shop — Weathered Thread",
  description: "Browse garment types, then colors, before choosing a design.",
};

export default function ShopPage() {
  const typesHeadingId = "types-heading";

  return (
    <main className="flex flex-col gap-story-gap">
      <section className="px-gutter-mobile md:px-gutter-desktop">
        <h1 id={typesHeadingId} className="mb-4 font-display text-headline">
          Shop
        </h1>
        <div
          role="list"
          aria-labelledby={typesHeadingId}
          className="grid grid-cols-2 gap-4 md:grid-cols-3"
        >
          {garmentTypes.map((type) => (
            <div key={type.slug} role="listitem">
              <Link href={`/shop/${type.slug}`}>
                <ProductCard name={type.name} price={formatPrice(type.price)} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
