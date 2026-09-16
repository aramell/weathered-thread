import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionStoryBlock from "@/components/collection-story-block";
import MotifTileLink from "@/components/motif-tile-link";
import { motifs } from "@/lib/placeholder-motif-data";

type Collection = {
  slug: string;
  eyebrow: string;
  heading: string;
  story: string[];
};

const collections: Collection[] = [
  {
    slug: "sea-isle",
    eyebrow: "Collection",
    heading: "Sea Isle",
    story: [
      "A water tower on the skyline, a life ring at the marina, the exit you take when you're almost there — thirteen small landmarks, stitched onto garment-dyed cotton built to soften with wear.",
    ],
  },
];

export function getCollection(slug: string) {
  return collections.find((collection) => collection.slug === slug);
}

export function generateStaticParams() {
  return collections.map((collection) => ({ slug: collection.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/collections/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const collection = getCollection(slug);

  if (!collection) {
    return {};
  }

  return {
    title: `${collection.heading} — Weathered Thread`,
    description: collection.story[0],
  };
}

export default async function CollectionPage({
  params,
}: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const collection = getCollection(slug);

  if (!collection) {
    notFound();
  }

  const motifsHeadingId = "motifs-heading";

  return (
    <main className="flex flex-col gap-story-gap">
      <h1 className="sr-only">{collection.heading} Collection Story</h1>

      <CollectionStoryBlock eyebrow={collection.eyebrow} heading={collection.heading}>
        {collection.story.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </CollectionStoryBlock>

      <section className="px-gutter-mobile md:px-gutter-desktop">
        <p
          id={motifsHeadingId}
          className="mb-4 font-mono text-label-mono uppercase text-marsh-sage"
        >
          Motifs
        </p>
        <div
          role="list"
          aria-labelledby={motifsHeadingId}
          className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          {motifs.map((motif) => (
            <div key={motif.slug} role="listitem">
              <MotifTileLink
                name={motif.name}
                href={`/collections/${collection.slug}/${motif.slug}`}
              />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
