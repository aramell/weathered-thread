import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPickerShell from "@/components/product-picker-shell";
import { getLiveMotifs } from "@/lib/motifs";
import { getLiveMotifShops, getLiveShop, getShop } from "@/lib/shop";
import { getColor, getGarmentType } from "@/lib/shop-types";

/** Rebuilt in the background at most this often, so stock and prices follow Etsy (see `lib/live-catalog.ts`). */
export const revalidate = 300;

/**
 * Product-surface entry point, garment-first (Story 3.1 AC3). Renders the
 * full interactive Product Picker (Story 3.3) seeded with this route's
 * garment type + color; size and motif are chosen from there. Converges
 * with the motif-first entry (`/collections/[slug]/[motif]`) on the same
 * `ProductPickerShell`.
 */
export function generateStaticParams() {
  return getShop().garmentTypes.flatMap((type) =>
    type.colors.map((color) => ({ type: type.slug, color: color.slug })),
  );
}

export async function generateMetadata({
  params,
}: PageProps<"/shop/[type]/[color]">): Promise<Metadata> {
  const { type, color } = await params;
  const shop = await getLiveShop();
  const garmentType = getGarmentType(shop, type);
  const colorway = garmentType && getColor(garmentType, color);

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
  const shop = await getLiveShop();
  const garmentType = getGarmentType(shop, type);
  const colorway = garmentType && getColor(garmentType, color);

  if (!garmentType || !colorway) {
    notFound();
  }

  return (
    <ProductPickerShell
      shop={shop}
      motifShops={await getLiveMotifShops()}
      motifs={await getLiveMotifs()}
      seed={{ kind: "garment", garmentTypeSlug: garmentType.slug, colorSlug: colorway.slug }}
      backHref={`/shop/${garmentType.slug}`}
      backLabel="Back to Shop"
    />
  );
}
