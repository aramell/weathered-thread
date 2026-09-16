import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductPickerShell from "@/components/product-picker-shell";
import { getCollection } from "@/app/(site)/collections/[slug]/page";
import { getMotif, motifs } from "@/lib/placeholder-motif-data";

/**
 * Product-surface entry point, motif-first (Story 3.2 AC2) — the
 * motif-first mirror of `/shop/[type]/[color]`'s garment-first entry
 * (Story 3.1). Renders the full interactive Product Picker (Story 3.3)
 * seeded with this route's motif; garment type, color, and size are
 * chosen from there. Converges with the garment-first entry on the same
 * `ProductPickerShell`.
 */
export function generateStaticParams() {
  return motifs.map((motif) => ({ motif: motif.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]/[motif]">): Promise<Metadata> {
  const { slug, motif: motifSlug } = await params;
  const motif = getMotif(motifSlug);

  if (!motif || !getCollection(slug)) {
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

  if (!motif || !collection) {
    notFound();
  }

  return (
    <ProductPickerShell
      seed={{ kind: "motif", motifSlug: motif.slug }}
      backHref={`/collections/${collection.slug}`}
      backLabel="Back to Collection"
    />
  );
}
