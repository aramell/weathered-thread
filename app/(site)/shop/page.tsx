import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import { formatPrice } from "@/lib/format-price";
import { getMotifs } from "@/lib/motifs";
import { getShop } from "@/lib/shop";
import { priceLabel } from "@/lib/shop-types";

export const metadata: Metadata = {
  title: "Shop — Weathered Thread",
  description: "Shop every design, or browse by garment type and color.",
};

export default function ShopPage() {
  const { garmentTypes } = getShop();
  const motifs = getMotifs();
  const designsHeadingId = "designs-heading";
  const typesHeadingId = "types-heading";

  return (
    <main className="flex flex-col gap-story-gap">
      {motifs.length > 0 && (
        <section className="px-gutter-mobile md:px-gutter-desktop">
          <h1 id={designsHeadingId} className="mb-4 font-display text-headline">
            Shop
          </h1>
          {/* Same grid as the Etsy shop: every listing, newest first, main photo, name, price. */}
          <div
            role="list"
            aria-labelledby={designsHeadingId}
            className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
          >
            {motifs.map((motif) => (
              <div key={motif.slug} role="listitem">
                <Link href={`/collections/${motif.collection}/${motif.slug}`}>
                  <ProductCard
                    name={motif.name}
                    price={formatPrice(motif.priceCents)}
                    image={motif.images[0]?.url}
                  />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="px-gutter-mobile md:px-gutter-desktop">
        <h2 id={typesHeadingId} className="mb-4 font-display text-headline">
          Browse by garment
        </h2>
        <div
          role="list"
          aria-labelledby={typesHeadingId}
          className="grid grid-cols-2 gap-4 md:grid-cols-3"
        >
          {garmentTypes.map((type) => (
            <div key={type.slug} role="listitem">
              <Link href={`/shop/${type.slug}`}>
                <ProductCard name={type.name} price={priceLabel(type.priceCents)} />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
