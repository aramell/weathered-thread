import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ButtonSecondary from "@/components/button-secondary";
import { getCollection } from "@/app/(site)/collections/[slug]/page";
import { getMotif, motifs } from "@/lib/placeholder-motif-data";

/**
 * Minimal Product-surface landing stub (Story 3.2 AC2) — the motif-first
 * mirror of `/shop/[type]/[color]`'s garment-first stub (Story 3.1). This
 * intentionally implements only the "no garment chosen yet" empty state —
 * motif name, flat Sailcloth placeholder block, disabled Add to Bag,
 * "Choose a garment for this piece." Garment selection, swatch/size
 * interactivity, live preview, sticky Add-to-Bag, and motif gallery
 * (Story 3.3's full Product Picker) are out of scope here and will
 * replace this stub when that story is built.
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

  if (!motif || !getCollection(slug)) {
    notFound();
  }

  return (
    <main className="flex flex-col gap-story-gap">
      <section className="mx-auto w-full max-w-md px-gutter-mobile md:px-gutter-desktop">
        <h1 className="mb-4 font-display text-headline">{motif.name}</h1>
        <div className="mb-5 aspect-square rounded bg-sailcloth" aria-hidden="true" />
        <p className="mb-6 font-body text-body">Choose a garment for this piece.</p>
        <button
          type="button"
          disabled
          className="mb-4 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-deep-harbor px-5 font-mono text-label-mono uppercase text-sailcloth disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Bag
        </button>
        <ButtonSecondary href={`/collections/${slug}`}>
          Back to Collection
        </ButtonSecondary>
      </section>
    </main>
  );
}
