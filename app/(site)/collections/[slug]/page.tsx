import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionStoryBlock from "@/components/collection-story-block";
import MotifTile from "@/components/motif-tile";

type Motif = { name: string };

type Collection = {
  slug: string;
  eyebrow: string;
  heading: string;
  story: string[];
  motifs: Motif[];
};

const collections: Collection[] = [
  {
    slug: "sea-isle",
    eyebrow: "Collection",
    heading: "Sea Isle",
    story: [
      "A water tower on the skyline, a life ring at the marina, the exit you take when you're almost there — thirteen small landmarks, stitched onto garment-dyed cotton built to soften with wear.",
    ],
    motifs: [
      { name: "Sea Isle City Waves" },
      { name: "Pickleball" },
      { name: "Beach Chair" },
      { name: "Seagull" },
      { name: "Bicycle" },
      { name: "Turtle" },
      { name: "Life Preserver / N.J." },
      { name: "Exit 17 / Sea Isle City" },
      { name: "Sea Isle shoreline / sailboat" },
      { name: "SIC Water Tower" },
      { name: "Sea Isle Boat" },
      { name: "Lobster Loft" },
      { name: "Smile You're in Sea Isle" },
    ],
  },
];

function getCollection(slug: string) {
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
          {collection.motifs.map((motif, index) => (
            <div key={`${motif.name}-${index}`} role="listitem">
              <MotifTile name={motif.name} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
