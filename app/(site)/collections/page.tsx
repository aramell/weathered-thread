import type { Metadata } from "next";
import MotifTileLink from "@/components/motif-tile-link";
import { collections } from "@/lib/collections";
import { getMotifsByCollection } from "@/lib/motifs";

export const metadata: Metadata = {
  title: "Collections — Weathered Thread",
  description: "The Weathered Thread collection and the Sea Isle collection.",
};

export default function CollectionsPage() {
  const headingId = "collections-heading";

  return (
    <main className="px-gutter-mobile py-8 md:px-gutter-desktop">
      <h1 id={headingId} className="mb-6 font-display text-display-lg">
        Collections
      </h1>
      <div
        role="list"
        aria-labelledby={headingId}
        className="grid grid-cols-1 gap-8 sm:grid-cols-2"
      >
        {collections.map((collection) => {
          const motifs = getMotifsByCollection(collection.slug);
          return (
            <div key={collection.slug} role="listitem">
              <MotifTileLink
                name={collection.name}
                nameIsLocation={collection.kind === "place"}
                image={motifs[0]?.images[0]?.url}
                href={`/collections/${collection.slug}`}
              />
              <p className="mt-3 text-body">{collection.story[0]}</p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
