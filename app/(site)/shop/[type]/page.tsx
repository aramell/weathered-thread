import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ButtonSecondary from "@/components/button-secondary";
import GarmentArt from "@/components/garment-art";
import ProductCard from "@/components/product-card";
import { garmentArtKind } from "@/lib/garment-art";
import { getLiveShop, getShop } from "@/lib/shop";
import { getGarmentType, priceLabel } from "@/lib/shop-types";

/** Rebuilt in the background at most this often, so stock and prices follow Etsy (see `lib/live-catalog.ts`). */
export const revalidate = 300;

function colorNames(names: string[]): string {
  if (names.length < 3) return names.join(" and ");
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function generateStaticParams() {
  return getShop().garmentTypes.map((type) => ({ type: type.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[type]">): Promise<Metadata> {
  const { type } = await params;
  const garmentType = getGarmentType(await getLiveShop(), type);

  if (!garmentType) {
    return {};
  }

  return {
    title: `${garmentType.name} — Weathered Thread`,
    description: `Shop the ${garmentType.name} in ${colorNames(garmentType.colors.map((color) => color.name))}.`,
  };
}

export default async function GarmentTypePage({
  params,
}: PageProps<"/shop/[type]">) {
  const { type } = await params;
  const garmentType = getGarmentType(await getLiveShop(), type);

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
          {garmentType.colors.map((colorway) => (
            <div key={colorway.slug} role="listitem">
              {colorway.inStock ? (
                <Link href={`/shop/${garmentType.slug}/${colorway.slug}`}>
                  <ProductCard
                    name={colorway.name}
                    price={priceLabel(colorway.priceCents)}
                    media={<GarmentArt kind={garmentArtKind(garmentType.slug)} tint={colorway.swatchColor} className="h-full w-full" />}
                  />
                </Link>
              ) : (
                // Disabled, never hidden: an out-of-stock color stays visible but is not a link.
                <div aria-disabled="true" className="opacity-50">
                  <ProductCard
                    name={`${colorway.name} — out of stock`}
                    price={priceLabel(colorway.priceCents)}
                    media={<GarmentArt kind={garmentArtKind(garmentType.slug)} tint={colorway.swatchColor} className="h-full w-full" />}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
