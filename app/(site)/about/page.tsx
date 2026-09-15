import type { Metadata } from "next";
import ButtonPrimary from "@/components/button-primary";

/**
 * app/(site)/about/page.tsx — static About route (Story 1.4). Plain
 * `Sailcloth`-surface content sections mirroring Home's brand-idea/
 * embroidery-detail block pattern (not `collection-story-block`, which is
 * purpose-built for the full-bleed Deep Harbor PLACE -> STORY moment).
 * Carries substantial narrative copy, so paragraph text uses the corrected
 * `font-body` (Libre Franklin) token rather than Fraunces.
 */

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "About — Weathered Thread",
    description:
      "The embroidery is the medium, the feeling is the product — how Weathered Thread is made, and why Sea Isle is only the first chapter.",
  };
}

export default function AboutPage() {
  return (
    <main className="flex flex-col gap-story-gap">
      {/* Philosophy / tagline */}
      <section className="mx-auto w-full max-w-md px-gutter-mobile text-center md:px-gutter-desktop">
        <p className="mb-4 font-mono text-label-mono uppercase text-marsh-sage">
          About
        </p>
        <h1 className="mb-4 font-display text-display-lg-mobile md:text-display-lg">
          Made to Remember. Stitched in.
        </h1>
        <p className="font-body text-body">
          Weathered Thread makes embroidered apparel for the towns worth
          remembering — the water tower on the skyline, the exit you take
          when you&apos;re almost there, the landmarks that only mean
          something once you&apos;ve lived them. The embroidery is the
          medium. The feeling is the product.
        </p>
      </section>

      {/* How It's Made */}
      <section className="mx-auto w-full max-w-md px-gutter-mobile text-center md:px-gutter-desktop">
        <p className="mb-4 font-mono text-label-mono uppercase text-marsh-sage">
          Process
        </p>
        <h2 className="mb-4 font-display text-headline">How It&apos;s Made</h2>
        <div className="flex flex-col gap-4 text-left font-body text-body">
          <p>
            Every motif starts as a drawing of an actual place, then gets
            digitized and stitched — not printed — onto garment-dyed cotton
            built to soften with wear. The beauty is in the details.
          </p>
          <p>
            Because each piece is embroidered individually, slight
            variations in stitching and finish are natural. These little
            differences are part of the character of a handmade piece.
          </p>
          <p>
            {/* TODO: unconfirmed placeholder — replace with real processing-time range before launch */}
            Each order is embroidered to order, so processing time runs
            7–10 business days before it ships — the time it takes to stitch
            something meant to last.
          </p>
        </div>
      </section>

      {/* Sea Isle as first chapter */}
      <section className="mx-auto w-full max-w-md px-gutter-mobile text-center md:px-gutter-desktop">
        <p className="mb-4 font-mono text-label-mono uppercase text-marsh-sage">
          Place
        </p>
        <h2 className="mb-3 font-display text-headline">
          Sea Isle Is the First Chapter
        </h2>
        <p className="mb-5 font-body text-body">
          Sea Isle is where Weathered Thread starts, not where it ends. It
          is the first town in a brand built place by place — each future
          collection its own chapter, carrying the same care into a new
          skyline and a new set of landmarks worth stitching in.
        </p>
        <ButtonPrimary href="/collections/sea-isle">
          Read the Sea Isle Story
        </ButtonPrimary>
      </section>
    </main>
  );
}
