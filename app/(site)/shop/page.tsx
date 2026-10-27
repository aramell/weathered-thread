import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product-card";
import { formatPrice } from "@/lib/format-price";
import { getMotifs } from "@/lib/motifs";
import { getCollection } from "@/lib/collections";

export const metadata: Metadata = {
  title: "Shop — Weathered Thread",
  description: "Shop every Weathered Thread design, newest first.",
};

export default function ShopPage() {
  const motifs = getMotifs();
  const designsHeadingId = "designs-heading";

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
                    collection={getCollection(motif.collection)?.name}
                  />
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
