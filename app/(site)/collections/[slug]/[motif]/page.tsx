import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPickerShell from "@/components/product-picker-shell";
import { getCollection } from "@/lib/collections";
import { getMotifs, getMotif } from "@/lib/motifs";
import { getMotifShops } from "@/lib/shop";

/**
 * The Product page for one design. The design is fixed by the URL (chosen on Shop or a
 * Collection); the visitor picks garment type, color and size in `ProductPickerShell`.
 */
export function generateStaticParams() {
  return getMotifs().map((motif) => ({ slug: motif.collection, motif: motif.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]/[motif]">): Promise<Metadata> {
  const { slug, motif: motifSlug } = await params;
  const motif = getMotif(motifSlug);

  if (!motif || motif.collection !== slug || !getCollection(slug)) {
    return {};
  }

  return {
    title: `${motif.name} — Weathered Thread`,
    description: `Choose a garment for the ${motif.name} motif.`,
  };
}

export default async function MotifGarmentPage({
  params,
}: PageProps<"/collections/[slug]/[motif]">) {
  const { slug, motif: motifSlug } = await params;
  const motif = getMotif(motifSlug);
  const collection = getCollection(slug);

  if (!motif || !collection || motif.collection !== collection.slug) {
    notFound();
  }

  const shop = getMotifShops()[motif.slug];

  if (!shop) {
    notFound();
  }

  return (
    <ProductPickerShell
      motif={motif}
      shop={shop}
      backHref={`/collections/${collection.slug}`}
      backLabel="Back to Collection"
    />
  );
}
