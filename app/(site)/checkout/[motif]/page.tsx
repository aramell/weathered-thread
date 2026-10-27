import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ButtonPrimary from "@/components/button-primary";
import ButtonSecondary from "@/components/button-secondary";
import { getCollection } from "@/lib/collections";
import { forwardHref, parseSelection, resolveSelection } from "@/lib/checkout";
import { formatPrice } from "@/lib/format-price";
import { getLiveListing } from "@/lib/live-catalog";
import { buildShop } from "@/lib/shop";

export const metadata: Metadata = {
  title: "Checkout — Weathered Thread",
  robots: { index: false },
};

/**
 * Checkout Handoff (Epic 4 Story 4.1): the deliberate pause between Add to Bag and Etsy. It
 * restates the selection in plain language and re-checks it against Etsy's inventory as of
 * the last few minutes (the synced catalog if Etsy can't be reached), then offers one
 * Continue link on the `shop.` host. A design that is no longer active gets the unavailable
 * page rather than a 404, so a bounce from `/go/[slug]` still lands somewhere with the retry copy. Etsy can't preselect style, color or size, so
 * the copy tells the visitor to confirm them there.
 */
export default async function CheckoutHandoffPage({
  params,
  searchParams,
}: PageProps<"/checkout/[motif]">) {
  const { motif: motifSlug } = await params;
  const query = await searchParams;
  const listing = await getLiveListing(motifSlug);
  if (!listing) notFound();

  const active = listing.state === "active";
  const selection = active ? parseSelection(query) : null;
  const resolved = selection ? resolveSelection(buildShop([listing]), selection) : null;
  const backHref = active ? `/collections/${listing.collection}/${listing.slug}` : `/collections/${listing.collection}`;
  const failedNotice =
    query.failed === "1" ? (
      <p role="alert" className="mb-4 font-body text-body">
        That didn&apos;t go through — try again.
      </p>
    ) : null;
  const collectionName = getCollection(listing.collection)?.name ?? "Weathered Thread";

  return (
    <main className="flex flex-col gap-story-gap">
      <section className="mx-auto w-full max-w-md bg-sailcloth px-gutter-mobile py-story-gap text-center md:px-gutter-desktop">
        {selection && resolved?.ok ? (
          <>
            <p className="mb-4 font-mono text-label-mono uppercase text-marsh-sage">{collectionName}</p>
            <h1 className="mb-4 font-display text-headline">Almost there.</h1>
            <p className="mb-2 font-body text-body-sm">
              {listing.motifName} — {resolved.garment}, {resolved.color}, size {resolved.size}.
            </p>
            <p className="mb-6 font-mono text-price-mono">{formatPrice(resolved.priceCents)}</p>
            <p className="mb-6 font-body text-body-sm">
              Payment happens on Etsy. You&apos;ll choose style, color, and size there again, so
              pick {resolved.garment}, {resolved.color}, size {resolved.size} to match.
            </p>
            {failedNotice}
            <div className="mb-4">
              <ButtonPrimary href={forwardHref(listing.slug, selection, process.env.SHOP_ORIGIN)}>
                Continue to Checkout
              </ButtonPrimary>
            </div>
            <ButtonSecondary href={backHref}>Change selection</ButtonSecondary>
          </>
        ) : (
          <>
            {failedNotice}
            <h1 className="mb-4 font-display text-headline">
              {resolved?.ok === false && resolved.reason === "sold-out" ? "That one just sold out." : "That piece isn’t available."}
            </h1>
            <p className="mb-6 font-body text-body">
              {active
                ? `Choose another size or color for ${listing.motifName} and we’ll take it from there.`
                : `${listing.motifName} isn’t available right now. Have a look at the rest of the collection.`}
            </p>
            <ButtonSecondary href={backHref}>{active ? `Back to ${listing.motifName}` : "Back to the collection"}</ButtonSecondary>
          </>
        )}
      </section>
    </main>
  );
}
