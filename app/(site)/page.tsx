import Image from "next/image";
import Link from "next/link";
import ButtonPrimary from "@/components/button-primary";
import ButtonSecondary from "@/components/button-secondary";
import CollectionStoryBlock from "@/components/collection-story-block";
import EmailSignupForm from "@/components/email-signup-form";
import ProductCard from "@/components/product-card";
import { getCollection } from "@/lib/collections";
import { formatPrice } from "@/lib/format-price";
import { getMotifs } from "@/lib/motifs";

/**
 * Real product photos shown under the hero so it is clear what is sold. Each pick is a design
 * and which of its photos (0 = first). They are existing shop photos, used as a stand-in until
 * the owner's chosen homepage photos arrive: replace these picks (or add files and point to
 * them) then. Alt text comes from the design's own photo data. A pick whose design is hidden or
 * missing is skipped.
 */
const HERO_PHOTO_PICKS = [
  { slug: "sic-terrapin-turtle", index: 0 },
  { slug: "sic-seagull-fry", index: 0 },
  { slug: "sic-pickleball", index: 1 },
] as const;

export default async function Home() {
  // Newest designs first: all of them up to 8, else the newest 6 plus "See all designs".
  const allMotifs = getMotifs();
  const motifs = allMotifs.length > 8 ? allMotifs.slice(0, 6) : allMotifs;
  const shopHeadingId = "shop-heading";
  const seaIsle = getCollection("sea-isle");
  const heroPhotos = HERO_PHOTO_PICKS.flatMap(({ slug, index }) => {
    const motif = allMotifs.find((m) => m.slug === slug);
    const image = motif?.images[index];
    return motif && image ? [{ motif, image }] : [];
  });

  return (
    <main className="flex flex-col gap-story-gap">
      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl px-gutter-mobile pt-12 text-center md:pt-16 md:px-gutter-desktop">
        {/* Approved stacked logo, unaltered (navy on transparent: light surface only). */}
        <Image
          src="/images/brand/WT_Logo_Stacked.png"
          alt="Weathered Thread"
          width={1536}
          height={1024}
          priority
          className="mx-auto mb-6 h-auto w-52 md:w-60"
        />
        <h1 className="mb-4 font-display text-display-lg-mobile md:text-display-lg">
          Made to Remember. Stitched in.
        </h1>
        <p className="font-body text-body">
          Embroidered apparel for the towns worth remembering.
        </p>
      </section>

      {/* What we make: real embroidered pieces */}
      {heroPhotos.length > 0 && (
        <section
          aria-label="Embroidered pieces"
          className="mx-auto -mt-16 w-full max-w-4xl px-gutter-mobile md:px-gutter-desktop"
        >
          <div role="list" className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {heroPhotos.map(({ motif, image }, position) => (
              <div key={motif.slug} role="listitem" className={position === 2 ? "hidden md:block" : undefined}>
                <Link
                  href={`/collections/${motif.collection}/${motif.slug}`}
                  className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded bg-paper-raised">
                    <Image
                      src={image.url}
                      alt={image.alt}
                      fill
                      priority={position === 0}
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="object-cover"
                    />
                  </div>
                  <p className="mt-2 font-mono text-caption-mono uppercase text-wet-ink">{motif.name}</p>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sea Isle feature */}
      {seaIsle && (
        <CollectionStoryBlock eyebrow={seaIsle.eyebrow} heading={seaIsle.heading} location>
          <p>{seaIsle.story[0]}</p>
          <ButtonPrimary href="/collections/sea-isle">Shop Sea Isle</ButtonPrimary>
        </CollectionStoryBlock>
      )}

      {/* Brand idea */}
      <section className="mx-auto w-full max-w-md px-gutter-mobile text-center md:px-gutter-desktop">
        <p className="font-display text-headline italic">
          &ldquo;The embroidery is the medium. The feeling is the
          product.&rdquo;
        </p>
      </section>

      {/* Shop: designs, newest first */}
      {motifs.length > 0 && (
        <section className="px-gutter-mobile md:px-gutter-desktop">
          <p
            id={shopHeadingId}
            className="mb-4 font-mono text-label-mono uppercase text-marsh-sage"
          >
            Shop
          </p>
          <div
            role="list"
            aria-labelledby={shopHeadingId}
            className="grid grid-cols-2 gap-4 md:grid-cols-3"
          >
            {motifs.map((motif) => (
              <div key={motif.slug} role="listitem">
                <Link href={`/collections/${motif.collection}/${motif.slug}`}>
                  <ProductCard
                    name={motif.name}
                    price={formatPrice(motif.priceCents)}
                    image={motif.images[0]?.url}
                    collection={getCollection(motif.collection)?.name}
                    collectionPlace={getCollection(motif.collection)?.kind === "place"}
                  />
                </Link>
              </div>
            ))}
          </div>
          <div className="mt-6 flex justify-center">
            <ButtonSecondary href="/shop">See all designs</ButtonSecondary>
          </div>
        </section>
      )}

      {/* Embroidery detail */}
      <section className="mx-auto w-full max-w-md px-gutter-mobile text-center md:px-gutter-desktop">
        <h2 className="mb-3 font-display text-headline">The Embroidery</h2>
        <p className="font-body text-body">
          Every motif is stitched, not printed — close-up detail on stitch
          quality and garment texture on every product page.
        </p>
      </section>

      {/* Email signup */}
      <section className="mx-auto w-full max-w-md px-gutter-mobile text-center md:px-gutter-desktop">
        <h2 className="mb-2 font-display text-headline">Stay Stitched In</h2>
        <p className="mb-5 font-body text-body-sm">
          New towns, new motifs, no noise.
        </p>
        <EmailSignupForm />
      </section>
    </main>
  );
}
