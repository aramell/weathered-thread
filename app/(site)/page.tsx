import Link from "next/link";
import ButtonPrimary from "@/components/button-primary";
import ButtonSecondary from "@/components/button-secondary";
import CollectionStoryBlock from "@/components/collection-story-block";
import EmailSignupForm from "@/components/email-signup-form";
import ProductCard from "@/components/product-card";
import { getCollection } from "@/lib/collections";
import { formatPrice } from "@/lib/format-price";
import { getMotifs } from "@/lib/motifs";

export default function Home() {
  // Newest designs first: all of them up to 8, else the newest 6 plus "See all designs".
  const allMotifs = getMotifs();
  const motifs = allMotifs.length > 8 ? allMotifs.slice(0, 6) : allMotifs;
  const shopHeadingId = "shop-heading";

  return (
    <main className="flex flex-col gap-story-gap">
      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl px-gutter-mobile py-story-gap text-center md:px-gutter-desktop">
        <p className="mb-4 font-mono text-label-mono uppercase text-marsh-sage">
          Weathered Thread
        </p>
        <h1 className="mb-4 font-display text-display-lg-mobile md:text-display-lg">
          Made to Remember. Stitched in.
        </h1>
        <p className="font-body text-body">
          Embroidered apparel for the towns worth remembering.
        </p>
      </section>

      {/* Sea Isle feature */}
      <CollectionStoryBlock eyebrow="Launch Collection" heading="Sea Isle">
        <p>{getCollection("sea-isle")?.story[0]}</p>
        <ButtonPrimary href="/collections/sea-isle">Shop Sea Isle</ButtonPrimary>
      </CollectionStoryBlock>

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
