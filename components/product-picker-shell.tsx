"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AddToBagBar from "@/components/add-to-bag-bar";
import ButtonSecondary from "@/components/button-secondary";
import GarmentSwatch from "@/components/garment-swatch";
import DesignSummary from "@/components/design-summary";
import GarmentOption from "@/components/garment-option";
import PickerGallery from "@/components/picker-gallery";
import { itemKey } from "@/lib/cart";
import { cartStore } from "@/lib/cart-store";
import { getCollection } from "@/lib/collections";
import { garmentArtKind } from "@/lib/garment-art";
import type { Motif } from "@/lib/motif-types";
import { buildGallerySlides, defaultPhotoIndex } from "@/lib/picker-gallery";
import { derivePicker, getColor, priceLabel, type Shop } from "@/lib/shop-types";

type ProductPickerShellProps = {
  /** The design this page is for. It is fixed: the visitor never changes it here. */
  motif: Motif;
  /** That design's own Shop (its prices and sizes), url-free, built on the server (NFR8). */
  shop: Shop;
  /** Where to go back to: the Collection Story the design came from. */
  backHref: string;
  backLabel: string;
};

/**
 * product-picker-shell — the one Client Component for the Product surface (`/collections/[slug]/[motif]`).
 * The visitor chooses a design on Shop or a Collection and arrives here with it fixed; this page
 * owns only the garment type, color and size state. `garment-swatch`, `garment-option` and
 * `add-to-bag-bar` stay presentational. The design appears as a read-only `design-summary`; there
 * is no way to swap it on this page. The hero is a user-driven gallery: design photos first,
 * garment preview last.
 */
export default function ProductPickerShell({ motif, shop, backHref, backLabel }: ProductPickerShellProps) {
  const [garmentTypeSlug, setGarmentTypeSlug] = useState<string | null>(null);
  const [colorSlug, setColorSlug] = useState<string | null>(null);
  const [sizeName, setSizeName] = useState<string | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(() => defaultPhotoIndex(motif.images.length));

  const activeShop = shop;
  const { garmentTypes } = activeShop;
  const { garmentType, colorway, size, priceCents, isAddToBagEnabled } = derivePicker(activeShop, {
    garmentTypeSlug,
    colorSlug,
    sizeName,
    hasMotif: true,
  });
  const price = garmentType && priceCents !== null ? priceLabel(priceCents) : null;

  // The pick most recently added; the confirmation shows while the current pick still matches it.
  const [addedKey, setAddedKey] = useState<string | null>(null);
  const currentKey =
    motif && garmentType && colorway && size
      ? itemKey({ slug: motif.slug, style: garmentType.slug, color: colorway.slug, size: size.name })
      : null;
  const added = currentKey !== null && addedKey === currentKey;
  // A pick the bag refused (20 lines, or 10 of this one already); shown while that pick is current.
  const [refusedKey, setRefusedKey] = useState<string | null>(null);
  const refused = currentKey !== null && refusedKey === currentKey;
  const addToBag = () => {
    if (!isAddToBagEnabled || !motif || !garmentType || !colorway || !size) return;
    const pick = { slug: motif.slug, style: garmentType.slug, color: colorway.slug, size: size.name };
    const changed = cartStore.add(pick);
    setAddedKey(changed ? itemKey(pick) : null);
    setRefusedKey(changed ? null : itemKey(pick));
  };

  const heading = garmentType ? `${motif.name} — ${garmentType.name}` : motif.name;

  const collectionName = (slug: string) => getCollection(slug)?.name ?? "Weathered Thread";
  const collectionPlace = (slug: string) => getCollection(slug)?.kind === "place";

  const missingGarmentPrompt = !garmentType ? "Choose a garment for this piece." : null;
  const missingColorPrompt = garmentType && !colorway ? "Choose a color for this piece." : null;
  const missingSizePrompt =
    garmentType && colorway && !size ? "Choose a size for this piece." : null;

  const addToBagDisabledReason = isAddToBagEnabled
    ? null
    : // The garment prompt is shown once, above the garment options, so it is not repeated here.
      (missingColorPrompt ?? missingSizePrompt);

  const previewUrl = garmentType && colorway?.frontImage ? colorway.frontImage : null;
  const slides = buildGallerySlides(
    (motif?.images ?? []).map((image, i) => ({
      url: image.url,
      alt: image.alt || `${motif?.name} — photo ${i + 1}`,
    })),
    previewUrl,
  );
  const previewAlt = motif
    ? `${motif.name} motif embroidered on ${colorway?.name} ${garmentType?.name ?? "garment"} — placeholder, real photography pending`
    : `${garmentType?.name ?? "Garment"} — ${colorway?.name}`;
  const previewCaption = motif
    ? `${motif.name} on ${colorway?.name} ${garmentType?.name} — placeholder mockup, real photography pending.`
    : "placeholder mockup, real photography pending.";

  const addToBagRef = useRef<HTMLButtonElement>(null);
  const [stickyVisible, setStickyVisible] = useState(false);

  useEffect(() => {
    const node = addToBagRef.current;
    if (!node) return;

    // Sticky bar mirrors nav-scroll-shell's client-boundary/scroll-effect
    // shape, but is keyed off the primary Add to Bag button itself via
    // IntersectionObserver rather than a window scroll listener.
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const garmentTypeHeadingId = "garment-type-heading";
  const colorHeadingId = "color-heading";
  const sizeHeadingId = "size-heading";
  const motifHeadingId = "motif-heading";
  const addToBagStatusId = "add-to-bag-status";
  const garmentPromptId = "garment-prompt";
  const descriptionHeadingId = "description-heading";
  const garmentDetailHeadingId = "garment-detail-heading";
  const fitSizeHeadingId = "fit-size-heading";
  const careHeadingId = "care-heading";
  const shippingHeadingId = "shipping-heading";

  return (
    <main className="flex flex-col gap-story-gap">
      <section className="mx-auto w-full max-w-md px-gutter-mobile pb-24 md:max-w-3xl md:px-gutter-desktop md:pb-0 lg:max-w-4xl">
        {/* Two columns from md up: image + color (what visibly changes the
            preview) stay paired on the left; everything else on the right,
            so color and design both sit close to the picture they affect
            instead of scrolling past name/price/type first. */}
        <div className="md:grid md:grid-cols-2 md:items-start md:gap-10">
          <div>
            {slides.length > 0 ? (
              <PickerGallery
                slides={slides}
                index={galleryIndex}
                onIndexChange={setGalleryIndex}
                previewAlt={previewAlt}
                previewCaption={previewCaption}
              />
            ) : (
              <div className="flex aspect-square items-center justify-center rounded bg-paper-raised p-6 text-center">
                <p className="font-mono text-caption-mono text-olive">
                  {garmentType
                    ? "Select a color to preview this design."
                    : "Select a garment to preview this design."}
                </p>
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-0">
            <h1 className="mb-1 font-display text-headline">{heading}</h1>
            {price && <p className="mb-6 font-mono text-price-mono">{price}</p>}

            <div className="mb-6">
              <p
                id={motifHeadingId}
                className="mb-2 font-mono text-label-mono uppercase text-olive"
              >
                Design
              </p>
              <DesignSummary
                collection={collectionName(motif.collection)}
                collectionPlace={collectionPlace(motif.collection)}
                name={motif.name}
                image={motif.images[0]?.url}
              />
            </div>

            {missingGarmentPrompt && (
              <p id={garmentPromptId} className="mb-4 font-body text-body">
                {missingGarmentPrompt}
              </p>
            )}

            <div className="mb-6">
              <p
                id={garmentTypeHeadingId}
                className="mb-2 font-mono text-label-mono uppercase text-olive"
              >
                Garment Type
              </p>
              <div
                role="list"
                aria-labelledby={garmentTypeHeadingId}
                className="grid grid-cols-2 gap-3 md:grid-cols-3"
              >
                {garmentTypes.map((type) => {
                  const selected = type.slug === garmentTypeSlug;
                  const tint = colorSlug ? getColor(type, colorSlug)?.swatchColor : undefined;
                  return (
                    <div key={type.slug} role="listitem">
                      <GarmentOption
                        name={type.name}
                        price={priceLabel(type.priceCents)}
                        kind={garmentArtKind(type.slug)}
                        tint={tint}
                        selected={selected}
                        onSelect={() => {
                          setGarmentTypeSlug(type.slug);
                          const color = colorSlug ? getColor(type, colorSlug) : undefined;
                          if (!color?.sizes.some((s) => s.name === sizeName)) setSizeName(null);
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {garmentType && (
              <div className="mb-6">
                {missingColorPrompt && (
                  <p className="mb-4 font-body text-body">{missingColorPrompt}</p>
                )}
                <p
                  id={colorHeadingId}
                  className="mb-2 font-mono text-label-mono uppercase text-olive"
                >
                  Color
                  {colorway && <span aria-live="polite"> — {colorway.name}</span>}
                </p>
                <div role="list" aria-labelledby={colorHeadingId} className="flex flex-wrap gap-x-2 gap-y-3">
                  {garmentType.colors.map((c) => (
                    <div key={c.slug} role="listitem">
                      <GarmentSwatch
                        name={c.name}
                        swatchColor={c.swatchColor}
                        selected={c.slug === colorSlug}
                        onSelect={() => {
                          setColorSlug(c.slug);
                          if (!c.sizes.some((s) => s.name === sizeName)) setSizeName(null);
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {garmentType && colorway && (
              <div className="mb-6">
                {missingSizePrompt && (
                  <p className="mb-4 font-body text-body">{missingSizePrompt}</p>
                )}
                <span
                  id={sizeHeadingId}
                  className="mb-2 block font-mono text-label-mono uppercase text-olive"
                >
                  Size
                </span>
                <div role="list" aria-labelledby={sizeHeadingId} className="flex gap-2">
                  {(colorway?.sizes ?? []).map((s) => {
                    const selected = s.name === size?.name;
                    return (
                      <div key={s.name} role="listitem">
                        <button
                          type="button"
                          onClick={() => setSizeName(s.name)}
                          aria-pressed={selected}
                          className={`flex h-11 w-11 items-center justify-center rounded border font-mono text-label-mono ${
                            selected
                              ? "border-weathered-ink bg-weathered-ink text-sailcloth"
                              : "border-line text-weathered-ink"
                          }`}
                        >
                          {s.name}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {addToBagDisabledReason && (
              <p id={addToBagStatusId} className="mb-4 font-body text-body">
                {addToBagDisabledReason}
              </p>
            )}
            <button
              ref={addToBagRef}
              type="button"
              disabled={!isAddToBagEnabled}
              onClick={addToBag}
              aria-hidden={stickyVisible}
              tabIndex={stickyVisible ? -1 : undefined}
              aria-describedby={
                addToBagDisabledReason
                  ? addToBagStatusId
                  : missingGarmentPrompt
                    ? garmentPromptId
                    : undefined
              }
              className="mb-4 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-deep-harbor px-5 font-mono text-label-mono uppercase text-sailcloth disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add to Bag
            </button>
            <p role="status" className="mb-4 font-body text-body-sm">
              {added && (
                <>
                  Added to your bag.{" "}
                  <Link href="/bag" className="underline underline-offset-2">
                    View bag
                  </Link>
                </>
              )}
              {refused && "Your bag is full for this pick (up to 10 of one piece, 20 different picks)."}
            </p>
            <ButtonSecondary href={backHref}>{backLabel}</ButtonSecondary>
          </div>
        </div>

        {/* Detail sections — fixed order per FR12/Epic 3: emotional
            description → THE GARMENT → fit/size → care →
            shipping/returns. Flat/static `.section` blocks matching
            key-product.html, not an accordion. THE GARMENT depends on
            garmentType, description depends on motif — each
            is omitted when its dependency is unselected. Fit/size, care,
            and shipping/returns always render. */}
        <div className="mt-10 divide-y divide-line border-t border-line md:mt-14">
          {motif && (
            <section className="py-6" aria-labelledby={descriptionHeadingId}>
              {/* Reference design has no visible heading for this section
                  (key-product.html's `.desc` sits heading-less above `.section`
                  blocks) — heading is visually hidden but still wired via
                  aria-labelledby to match the other sections' landmark pattern. */}
              <h2 id={descriptionHeadingId} className="sr-only">
                Description
              </h2>
              <p className="font-body text-body-sm">{motif.story}</p>
              {motif.description.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((paragraph, i) => (
                <p key={i} className="mt-4 whitespace-pre-line font-body text-body-sm">
                  {paragraph}
                </p>
              ))}
            </section>
          )}

          {garmentType && (
            <section className="py-6" aria-labelledby={garmentDetailHeadingId}>
              <h2
                id={garmentDetailHeadingId}
                className="mb-2 font-mono text-label-mono uppercase text-olive"
              >
                The Garment
              </h2>
              <p className="font-body text-body-sm">{garmentType.garmentBlurb}</p>
            </section>
          )}

          <section className="py-6" aria-labelledby={fitSizeHeadingId}>
            <h2
              id={fitSizeHeadingId}
              className="mb-2 font-mono text-label-mono uppercase text-olive"
            >
              Fit &amp; Size
            </h2>
            {/* TODO: unconfirmed placeholder — replace with real per-garment fit/size copy and measurements before launch. */}
            <p className="font-body text-body-sm">
              Runs true to size with a relaxed, easy fit — if you&apos;re between sizes, size up
              for a roomier feel. Full measurements by size are on the way; reach out before
              ordering if you have questions about fit.
            </p>
          </section>

          <section className="py-6" aria-labelledby={careHeadingId}>
            <h2
              id={careHeadingId}
              className="mb-2 font-mono text-label-mono uppercase text-olive"
            >
              Care
            </h2>
            {/* TODO: unconfirmed placeholder — replace with real care instructions before launch. */}
            <p className="font-body text-body-sm">
              Machine wash cold, inside out, with like colors, and tumble dry low — or lay flat
              to keep the embroidery looking its best. Full care instructions are pending final
              spec sheet.
            </p>
          </section>

          <section className="py-6" aria-labelledby={shippingHeadingId}>
            <h2
              id={shippingHeadingId}
              className="mb-2 font-mono text-label-mono uppercase text-olive"
            >
              Shipping &amp; Returns
            </h2>
            {/* TODO: unconfirmed placeholder — replace with confirmed shipping/returns policy before launch. */}
            <p className="font-body text-body-sm">
              Orders ship within 7–10 business days of purchase. Returns and exchanges are
              accepted within 30 days of delivery on unworn, unwashed pieces. Exact shipping
              timelines and the full returns policy are still being finalized.
            </p>
          </section>
        </div>
      </section>

      <AddToBagBar
        price={price ?? "—"}
        disabled={!isAddToBagEnabled}
        visible={stickyVisible}
        added={added}
        onAddToBag={addToBag}
      />
    </main>
  );
}
