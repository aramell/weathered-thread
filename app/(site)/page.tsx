import Image from "next/image";
import Link from "next/link";
import ButtonPrimary from "@/components/button-primary";
import ButtonSecondary from "@/components/button-secondary";
import CollectionStoryBlock from "@/components/collection-story-block";
import EmailSignupForm from "@/components/email-signup-form";
import ProductCard from "@/components/product-card";
import VideoLoop from "@/components/video-loop";
import { getCollection } from "@/lib/collections";
import { formatPrice } from "@/lib/format-price";
import { getMotifs } from "@/lib/motifs";

/**
 * The owner's own photos shown under the hero so it is clear what is sold (files in
 * `public/images/home/`, resized to 1600x2000, 4:5). Mobile shows the first two, desktop all
 * three, so the order matters. They are lifestyle shots, not tied to one design, so they are
 * not links.
 */
const HERO_PHOTOS = [
  {
    src: "/images/home/hero-stairs-blue-longsleeve.jpg",
    alt: "Smiling woman seated on garden stairs in a blue long-sleeve tee with a small embroidered Weathered Thread mark.",
  },
  {
    src: "/images/home/hero-ivory-crewneck-fall.jpg",
    alt: "Ivory crewneck sweatshirt with the Weathered Thread logo embroidered on the chest, against autumn leaves.",
  },
  {
    src: "/images/home/hero-pepper-tee-pool.jpg",
    alt: "Grey tee draped over a teak lounger beside a pool, its woven Weathered Thread neck label in focus.",
  },
] as const;

export default async function Home() {
  // Newest designs first: all of them up to 8, else the newest 6 plus "See all designs".
  const allMotifs = getMotifs();
  const motifs = allMotifs.length > 8 ? allMotifs.slice(0, 6) : allMotifs;
  const shopHeadingId = "shop-heading";
  const seaIsle = getCollection("sea-isle");

  return (
    <main className="flex flex-col gap-story-gap">
      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl px-gutter-mobile pt-12 text-center md:pt-16 md:px-gutter-desktop">
        {/* Approved stacked logo, unaltered (navy on transparent: light surface only). */}
        <Image
          src="/images/brand/WT_Logo_Primary.png"
          alt="Weathered Thread"
          width={1536}
          height={1024}
          priority
          className="mx-auto mb-6 h-auto w-52 md:w-60"
        />
        <h1 className="mb-4 font-display text-display-lg-mobile md:text-display-lg">
          Made to Remember.{" "}
          <em className="text-deep-harbor">Stitched in.</em>
        </h1>
        <p className="font-body text-body text-muted">
          Embroidered apparel for the towns worth remembering.
        </p>
      </section>

      {/* What we make: real embroidered pieces */}
      <section
        aria-label="Embroidered pieces"
        className="mx-auto -mt-16 w-full max-w-4xl px-gutter-mobile md:px-gutter-desktop"
      >
        <div role="list" className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
          {HERO_PHOTOS.map(({ src, alt }, position) => (
            <div key={src} role="listitem" className={position === 2 ? "hidden md:block" : undefined}>
              <div className="relative aspect-[4/5] overflow-hidden rounded bg-paper-raised">
                <Image
                  src={src}
                  alt={alt}
                  fill
                  priority={position < 2}
                  sizes="(max-width: 768px) 50vw, 33vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sea Isle City feature */}
      {seaIsle && (
        <CollectionStoryBlock eyebrow={seaIsle.eyebrow} heading={seaIsle.heading}>
          <p>{seaIsle.story[0]}</p>
          <ButtonPrimary href="/collections/sea-isle">Shop Sea Isle City</ButtonPrimary>
        </CollectionStoryBlock>
      )}

      {/* Brand idea */}
      <section className="mx-auto w-full max-w-md px-gutter-mobile text-center md:px-gutter-desktop">
        <p className="font-display text-headline italic">
          &ldquo;The embroidery is the medium. The feeling is the
          product.&rdquo;
        </p>
        {/* Moving photo: the feeling, not the product. Poster frame shows if motion is off. */}
        <div className="mt-8 overflow-hidden rounded bg-paper-raised">
          <VideoLoop
            src="/video/tee-in-the-wind.mp4"
            poster="/video/tee-in-the-wind-poster.jpg"
            label="A grey Weathered Thread tee hanging from an olive branch above the sea, moving in the wind."
            className="aspect-[4/5] w-full object-cover"
          />
        </div>
      </section>

      {/* Shop: designs, newest first */}
      {motifs.length > 0 && (
        <section className="px-gutter-mobile md:px-gutter-desktop">
          <p
            id={shopHeadingId}
            className="mb-4 font-mono text-eyebrow-mono uppercase text-deep-harbor"
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
        <Image
          src="/images/home/embroidery-neck-label.jpg"
          alt="Close-up of the woven Weathered Thread label stitched inside the neck of a washed grey tee."
          width={1440}
          height={1800}
          sizes="(max-width: 768px) 100vw, 448px"
          className="mb-6 h-auto w-full rounded"
        />
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
