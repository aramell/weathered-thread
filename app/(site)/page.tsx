import ButtonPrimary from "@/components/button-primary";
import CollectionStoryBlock from "@/components/collection-story-block";
import EmailSignupForm from "@/components/email-signup-form";
import ProductCard from "@/components/product-card";

const shopItems = [
  { name: "Crewneck Sweatshirt", price: "$68" },
  { name: "Heavyweight Tee", price: "$38" },
  { name: "Lightweight Crewneck", price: "$58" },
  { name: "Long Sleeve Tee", price: "$42" },
];

export default function Home() {
  return (
    <main className="flex flex-col gap-story-gap">
      {/* Hero */}
      <section className="mx-auto w-full max-w-3xl px-gutter-mobile py-story-gap text-center md:px-gutter-desktop">
        <p className="mb-4 font-mono text-label-mono uppercase text-marsh-sage">
          Made to Remember. Stitched in.
        </p>
        <h1 className="mb-4 font-display text-display-lg-mobile md:text-display-lg">
          A sense of place, stitched in.
        </h1>
        <p className="font-body text-body">
          Embroidered apparel for the towns worth remembering.
        </p>
      </section>

      {/* Sea Isle feature */}
      <CollectionStoryBlock eyebrow="Launch Collection" heading="Sea Isle">
        <p>
          A water tower on the skyline, a life ring at the marina, the exit
          you take when you&apos;re almost there — thirteen small landmarks,
          stitched onto garment-dyed cotton built to soften with wear.
        </p>
        <ButtonPrimary href="/collections/sea-isle">Shop Sea Isle</ButtonPrimary>
      </CollectionStoryBlock>

      {/* Brand idea */}
      <section className="mx-auto w-full max-w-md px-gutter-mobile text-center md:px-gutter-desktop">
        <p className="font-display text-headline italic">
          &ldquo;The embroidery is the medium. The feeling is the
          product.&rdquo;
        </p>
      </section>

      {/* Shop grid */}
      <section className="px-gutter-mobile md:px-gutter-desktop">
        <p className="mb-4 font-mono text-label-mono uppercase text-marsh-sage">
          Shop
        </p>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {shopItems.map((item) => (
            <ProductCard key={item.name} name={item.name} price={item.price} />
          ))}
        </div>
      </section>

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

      {/* Footer */}
      <footer className="flex items-center justify-between px-gutter-mobile py-6 font-mono text-caption-mono uppercase text-marsh-sage md:px-gutter-desktop">
        <span>© Weathered Thread</span>
        <span>Shipping · Returns</span>
      </footer>
    </main>
  );
}
