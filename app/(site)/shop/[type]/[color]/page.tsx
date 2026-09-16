import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import ButtonSecondary from "@/components/button-secondary";
import {
  colorways,
  garmentTypes,
  getColorway,
  getGarmentType,
} from "@/lib/placeholder-shop-data";

/**
 * Minimal Product-surface landing stub (Story 3.1 AC3). This intentionally
 * implements only Story 3.3's garment-first "no motif selected" empty
 * state — image, name/price, disabled Add to Bag, "Choose a design for
 * this piece." Swatch interactivity, sticky Add-to-Bag bar, motif
 * selection, and size selection (Story 3.3's full Product Picker) are out
 * of scope here and will replace this stub when that story is built.
 */
export function generateStaticParams() {
  return garmentTypes.flatMap((type) =>
    colorways.map((colorway) => ({ type: type.slug, color: colorway.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[type]/[color]">): Promise<Metadata> {
  const { type, color } = await params;
  const garmentType = getGarmentType(type);
  const colorway = getColorway(color);

  if (!garmentType || !colorway) {
    return {};
  }

  return {
    title: `${garmentType.name} — ${colorway.name} — Weathered Thread`,
    description: `${garmentType.name} in ${colorway.name}.`,
  };
}

export default async function GarmentColorPage({
  params,
}: PageProps<"/shop/[type]/[color]">) {
  const { type, color } = await params;
  const garmentType = getGarmentType(type);
  const colorway = getColorway(color);

  if (!garmentType || !colorway) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-story-gap">
      <section className="mx-auto w-full max-w-md px-gutter-mobile md:px-gutter-desktop">
        <div className="relative mb-5 aspect-square overflow-hidden rounded bg-paper-raised">
          <Image
            src={colorway.frontImage}
            alt={`${garmentType.name} — ${colorway.name}`}
            fill
            preload
            sizes="(max-width: 768px) 100vw, 448px"
            className="object-cover"
          />
        </div>
        <h1 className="mb-1 font-display text-headline">
          {garmentType.name} — {colorway.name}
        </h1>
        <p className="mb-4 font-mono text-price-mono">{garmentType.price}</p>
        <p className="mb-6 font-body text-body">Choose a design for this piece.</p>
        <button
          type="button"
          disabled
          className="mb-4 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-deep-harbor px-5 font-mono text-label-mono uppercase text-sailcloth disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Bag
        </button>
        <ButtonSecondary href={`/shop/${garmentType.slug}`}>
          Back to Shop
        </ButtonSecondary>
      </section>
    </main>
  );
}
