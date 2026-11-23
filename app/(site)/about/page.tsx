import type { Metadata } from "next";
import Image from "next/image";
import ButtonPrimary from "@/components/button-primary";

/**
 * app/(site)/about/page.tsx — static About route. The copy is the owner's, word for word
 * (Nov 2026); do not reword it. Each section has a photo slot in `ABOUT_PHOTOS`: leave a slot
 * `null` and nothing shows; fill it in with a real photo (file in `public/images/about/`, real
 * alt text) when the owner sends them. Photos are never generated.
 */

type AboutPhoto = { src: string; width: number; height: number; alt: string };

/** Photos arrive later. `null` = no photo yet, nothing is rendered. */
const ABOUT_PHOTOS: Record<"intro" | "place" | "details" | "lived", AboutPhoto | null> = {
  intro: null,
  place: null,
  details: null,
  lived: null,
};

function SectionPhoto({ photo }: { photo: AboutPhoto | null }) {
  if (!photo) return null;
  return (
    <Image
      src={photo.src}
      alt={photo.alt}
      width={photo.width}
      height={photo.height}
      sizes="(max-width: 768px) 100vw, 672px"
      className="mb-6 h-auto w-full rounded"
    />
  );
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About — Weathered Thread",
    description:
      "Some places just stay with us. Weathered Thread turns the places and moments worth remembering into things you can wear and keep, starting in Sea Isle City, New Jersey.",
  };
}

const sectionClass = "mx-auto w-full max-w-xl px-gutter-mobile md:px-gutter-desktop";
const bodyClass = "flex flex-col gap-4 font-body text-body";

export default function AboutPage() {
  return (
    <main className="flex flex-col gap-story-gap">
      {/* Intro */}
      <section className={`${sectionClass} pt-8 text-center`}>
        <SectionPhoto photo={ABOUT_PHOTOS.intro} />
        <p className="mb-4 font-mono text-label-mono uppercase text-marsh-sage">
          Made to Remember. Stitched in.
        </p>
        <h1 className="mb-6 font-display text-display-lg-mobile md:text-display-lg">
          About Weathered Thread
        </h1>
        <p className="mb-6 font-display text-headline italic">
          Some places just stay with us.
        </p>
        <div className={`${bodyClass} text-left`}>
          <p>
            The beach we return to every summer. The town that feels like home.
            The people, traditions, and moments that become part of our story.
          </p>
          <p>
            Weathered Thread was created to celebrate those connections through
            thoughtfully designed apparel and everyday pieces inspired by the
            places and moments worth remembering.
          </p>
        </div>
      </section>

      {/* A sense of place */}
      <section className={sectionClass}>
        <SectionPhoto photo={ABOUT_PHOTOS.place} />
        <h2 className="mb-4 font-display text-headline">
          A sense of place, stitched in.
        </h2>
        <div className={bodyClass}>
          <p>
            Every place has its own story. Sometimes it&apos;s a familiar
            landmark, a favorite spot, or a little detail that brings it all
            back.
          </p>
          <p>
            We take inspiration from those details and turn them into designs
            that capture what makes a place special.
          </p>
          <p>
            Our first collection begins in Sea Isle City, New Jersey—a place
            filled with familiar sights, summer traditions, and memories that
            last long after the season ends.
          </p>
          <p>
            It&apos;s just the beginning. There are plenty more stories worth
            stitching in.
          </p>
        </div>
      </section>

      {/* Details */}
      <section className={sectionClass}>
        <SectionPhoto photo={ABOUT_PHOTOS.details} />
        <h2 className="mb-4 font-display text-headline">
          The beauty is in the details.
        </h2>
        <div className={bodyClass}>
          <p>
            We believe the details matter. From the feel of the garment to the
            placement and quality of the embroidery, each piece is thoughtfully
            made.
          </p>
          <p>
            Every item is embroidered individually, so slight variations in
            stitching and finish are natural. They&apos;re part of the
            character of a handmade piece.
          </p>
        </div>
      </section>

      {/* Lived in */}
      <section className={sectionClass}>
        <SectionPhoto photo={ABOUT_PHOTOS.lived} />
        <h2 className="mb-4 font-display text-headline">
          Made to look better lived in.
        </h2>
        <div className={bodyClass}>
          <p>
            We make pieces you&apos;ll reach for again and again. The favorite
            sweatshirt, the everyday tee, the little reminder of a place or
            moment that means something to you.
          </p>
          <p>Not just something to wear, but something to remember.</p>
        </div>
      </section>

      {/* Close */}
      <section className={`${sectionClass} pb-story-gap text-center`}>
        <p className="mb-1 font-display text-headline">Weathered Thread</p>
        <p className="mb-6 font-mono text-label-mono uppercase text-marsh-sage">
          Made to Remember. Stitched in.
        </p>
        <ButtonPrimary href="/collections/sea-isle">Shop the Collection</ButtonPrimary>
      </section>
    </main>
  );
}
