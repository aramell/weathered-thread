import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ButtonSecondary from "@/components/button-secondary";
import ProductCard from "@/components/product-card";
import { formatPrice } from "@/lib/format-price";
import { colorways, garmentTypes, getGarmentType } from "@/lib/placeholder-shop-data";

export function generateStaticParams() {
  return garmentTypes.map((type) => ({ type: type.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[type]">): Promise<Metadata> {
  const { type } = await params;
  const garmentType = getGarmentType(type);

  if (!garmentType) {
    return {};
  }

  return {
    title: `${garmentType.name} — Weathered Thread`,
    description: `Shop the ${garmentType.name} in Pepper, Ivory, Blue Jean, and Bay.`,
  };
}

export default async function GarmentTypePage({
  params,
}: PageProps<"/shop/[type]">) {
  const { type } = await params;
  const garmentType = getGarmentType(type);

  if (!garmentType) {
    notFound();
  }

  const colorsHeadingId = "colors-heading";

  return (
    <main className="flex flex-col gap-story-gap">
      <section className="px-gutter-mobile md:px-gutter-desktop">
        <h1 className="mb-4 font-display text-headline">{garmentType.name}</h1>
        <p id={colorsHeadingId} className="sr-only">
          Colors
        </p>
        <div className="mb-4">
          <ButtonSecondary href="/">Back to Shop</ButtonSecondary>
        </div>
        <div
          role="list"
          aria-labelledby={colorsHeadingId}
          className="grid grid-cols-2 gap-4 md:grid-cols-3"
        >
          {colorways.map((colorway) => (
            <div key={colorway.slug} role="listitem">
              <Link href={`/shop/${garmentType.slug}/${colorway.slug}`}>
                <ProductCard
                  name={colorway.name}
                  price={formatPrice(garmentType.price)}
                  image={colorway.frontImage}
                />
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
