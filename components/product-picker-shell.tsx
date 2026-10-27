"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AddToBagBar from "@/components/add-to-bag-bar";
import ButtonSecondary from "@/components/button-secondary";
import GarmentSwatch from "@/components/garment-swatch";
import MotifTile from "@/components/motif-tile";
import DesignSummary from "@/components/design-summary";
import GarmentOption from "@/components/garment-option";
import PickerGallery from "@/components/picker-gallery";
import { handoffPath } from "@/lib/checkout";
import { getCollection } from "@/lib/collections";
import { garmentArtKind } from "@/lib/garment-art";
import type { Motif } from "@/lib/motif-types";
import { buildGallerySlides, defaultPhotoIndex } from "@/lib/picker-gallery";
import { derivePicker, getColor, priceLabel, type Shop } from "@/lib/shop-types";

type ProductPickerSeed =
  | { kind: "garment"; garmentTypeSlug: string; colorSlug: string }
  | { kind: "motif"; motifSlug: string };

type ProductPickerShellProps = {
  /** Url-free Shop model built on the server from the synced catalog (NFR8). */
  shop: Shop;
  /** Each design's own Shop (its prices and stock), keyed by motif slug; used once a design is chosen. */
  motifShops: Record<string, Shop>;
  /** Url-free motifs built on the server from the catalog's authored content. */
  motifs: Motif[];
  seed: ProductPickerSeed;
  /** Origin surface to return to — Shop's garment-type list or the Collection Story. */
  backHref: string;
  backLabel: string;
};

/**
 * product-picker-shell — the one Client Component for Epic 3 Story 3.3.
 * Owns every piece of picker state (garment type, color, size, motif) for
 * both entry stubs (`/shop/[type]/[color]` seeded garment-first,
 * `/collections/[slug]/[motif]` seeded motif-first) so they converge on one
 * identical, interactive Product surface. `garment-swatch`, `motif-tile`,
 * `garment-option` and `add-to-bag-bar` stay presentational — they only read
 * state/setters via props. Design-first arrivals collapse the chosen design
 * to a `design-summary` (Change opens the grid inline, Close collapses it);
 * garment-first arrivals show the full design grid uncollapsed. The hero is a
 * user-driven gallery: design photos first, garment preview last.
 */
export default function ProductPickerShell({
  shop,
  motifShops,
  motifs,
  seed,
  backHref,
  backLabel,
}: ProductPickerShellProps) {
  const [garmentTypeSlug, setGarmentTypeSlug] = useState<string | null>(
    seed.kind === "garment" ? seed.garmentTypeSlug : null,
  );
  const [colorSlug, setColorSlug] = useState<string | null>(
    seed.kind === "garment" ? seed.colorSlug : null,
  );
  const [sizeName, setSizeName] = useState<string | null>(null);
  const [motifSlug, setMotifSlug] = useState<string | null>(
    seed.kind === "motif" ? seed.motifSlug : null,
  );

  const [designOpen, setDesignOpen] = useState(false);
  const changeButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const moveFocusOnToggle = useRef(false);
  const toggleDesign = (open: boolean) => {
    moveFocusOnToggle.current = true;
    setDesignOpen(open);
  };
  // The toggled control unmounts the focused one; move focus to its replacement (not on mount).
  useEffect(() => {
    if (!moveFocusOnToggle.current) return;
    moveFocusOnToggle.current = false;
    (designOpen ? closeButtonRef.current : changeButtonRef.current)?.focus();
  }, [designOpen]);
  const [galleryIndex, setGalleryIndex] = useState(() =>
    defaultPhotoIndex(motifs.find((m) => m.slug === motifSlug)?.images.length ?? 0),
  );

  const motif = motifs.find((m) => m.slug === motifSlug);
  // The pooled shop only serves the garment-first entry before a design is chosen; from then on
  // price and stock are the design's own.
  const activeShop = (motif && motifShops[motif.slug]) || shop;
  const { garmentTypes } = activeShop;
  const { garmentType, colorway, size, priceCents, isAddToBagEnabled } = derivePicker(activeShop, {
    garmentTypeSlug,
    colorSlug,
    sizeName,
    hasMotif: Boolean(motif),
  });
  const price = garmentType && priceCents !== null ? priceLabel(priceCents) : null;

  const router = useRouter();
  const addToBag = () => {
    if (!isAddToBagEnabled || !motif || !garmentType || !colorway || !size) return;
    router.push(handoffPath(motif.slug, { style: garmentType.slug, color: colorway.slug, size: size.name }));
  };

  const heading = motif
    ? garmentType
      ? `${motif.name} — ${garmentType.name}`
      : motif.name
    : garmentType && colorway
      ? `${garmentType.name} — ${colorway.name}`
      : "Build your piece";

  // Design-first arrivals collapse the chosen design; garment-first ones keep the full grid.
  const designFirst = seed.kind === "motif";
  const designCollapsed = designFirst && Boolean(motif) && !designOpen;
  const collectionName = (slug: string) => getCollection(slug)?.name ?? "Weathered Thread";

  const missingGarmentPrompt = !garmentType ? "Choose a garment for this piece." : null;
  const missingColorPrompt = garmentType && !colorway ? "Choose a color for this piece." : null;
  const selectedColorOutOfStockPrompt =
    colorway && !colorway.inStock
      ? `${colorway.name} is currently out of stock in this style.`
      : null;
  const missingSizePrompt =
    garmentType && colorway && colorway.inStock && !size
      ? "Choose a size for this piece."
      : null;
  const missingMotifPrompt = garmentType && !motif ? "Choose a design for this piece." : null;

  const addToBagDisabledReason = isAddToBagEnabled
    ? null
    : // The garment prompt is shown once, above the garment options, so it is not repeated here.
      (missingColorPrompt ??
      selectedColorOutOfStockPrompt ??
      missingSizePrompt ??
      missingMotifPrompt);

  const outOfStockColorways = garmentType?.colors.filter((c) => !c.inStock) ?? [];
  const outOfStockColorwayNames = outOfStockColorways.map((c) => c.name).join(", ");

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
  const embroideryHeadingId = "embroidery-heading";
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
                <p className="font-mono text-caption-mono text-marsh-sage">
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
              {missingMotifPrompt && (
                <p className="mb-4 font-body text-body">{missingMotifPrompt}</p>
              )}
              <p
                id={motifHeadingId}
                className="mb-2 font-mono text-label-mono uppercase text-marsh-sage"
              >
                Design
              </p>
              {designCollapsed && motif ? (
                <DesignSummary
                  collection={collectionName(motif.collection)}
                  name={motif.name}
                  image={motif.images[0]?.url}
                  ref={changeButtonRef}
                  onChange={() => toggleDesign(true)}
                />
              ) : (
                <>
                  {designFirst && (
                    <div className="mb-2 flex justify-end">
                      <button
                        type="button"
                        ref={closeButtonRef}
                        onClick={() => toggleDesign(false)}
                        className="inline-flex min-h-11 items-center justify-center rounded-sm border border-wet-ink px-4 font-mono text-label-mono uppercase text-wet-ink"
                      >
                        Close
                      </button>
                    </div>
                  )}
                  <div
                    role="list"
                    aria-labelledby={motifHeadingId}
                    className="grid grid-cols-2 gap-4 md:grid-cols-3"
                  >
                    {motifs.map((m) => {
                      const selected = m.slug === motifSlug;
                      return (
                        <div key={m.slug} role="listitem">
                          <button
                            type="button"
                            onClick={() => {
                              setMotifSlug(m.slug);
                              setGalleryIndex(defaultPhotoIndex(m.images.length));
                              toggleDesign(false);
                            }}
                            aria-pressed={selected}
                            className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
                          >
                            <MotifTile
                              name={m.name}
                              image={m.images[0]?.url}
                              selected={selected}
                              collection={collectionName(m.collection)}
                            />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {missingGarmentPrompt && (
              <p id={garmentPromptId} className="mb-4 font-body text-body">
                {missingGarmentPrompt}
              </p>
            )}

            <div className="mb-6">
              <p
                id={garmentTypeHeadingId}
                className="mb-2 font-mono text-label-mono uppercase text-marsh-sage"
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
                          if (!color?.sizes.some((s) => s.name === sizeName && s.inStock)) setSizeName(null);
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
                  className="mb-2 font-mono text-label-mono uppercase text-marsh-sage"
                >
                  Color
                </p>
                <div role="list" aria-labelledby={colorHeadingId} className="flex gap-3">
                  {garmentType.colors.map((c) => (
                    <div key={c.slug} role="listitem">
                      <GarmentSwatch
                        name={c.name}
                        swatchColor={c.swatchColor}
                        selected={c.slug === colorSlug}
                        inStock={c.inStock}
                        onSelect={() => {
                          setColorSlug(c.slug);
                          if (!c.sizes.some((s) => s.name === sizeName && s.inStock)) setSizeName(null);
                        }}
                      />
                    </div>
                  ))}
                </div>
                {outOfStockColorways.length > 0 && (
                  <p className="mt-2 font-mono text-caption-mono text-marsh-sage">
                    {outOfStockColorways.length === 1
                      ? `${outOfStockColorwayNames} is currently out of stock in this style.`
                      : `${outOfStockColorwayNames} are currently out of stock in this style.`}
                  </p>
                )}
              </div>
            )}

            {garmentType && colorway && (
              <div className="mb-6">
                {missingSizePrompt && (
                  <p className="mb-4 font-body text-body">{missingSizePrompt}</p>
                )}
                <span
                  id={sizeHeadingId}
                  className="mb-2 block font-mono text-label-mono uppercase text-marsh-sage"
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
                          disabled={!s.inStock}
                          aria-pressed={selected}
                          aria-label={s.inStock ? s.name : `${s.name} — out of stock`}
                          className={`flex h-11 w-11 items-center justify-center rounded border font-mono text-label-mono disabled:cursor-not-allowed disabled:opacity-40 ${
                            selected
                              ? "border-wet-ink bg-wet-ink text-sailcloth"
                              : "border-line text-wet-ink"
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
              Buy on Etsy
            </button>
            <ButtonSecondary href={backHref}>{backLabel}</ButtonSecondary>
          </div>
        </div>

        {/* Detail sections — fixed order per FR12/Epic 3: emotional
            description → THE GARMENT → THE EMBROIDERY → fit/size → care →
            shipping/returns. Flat/static `.section` blocks matching
            key-product.html, not an accordion. THE GARMENT depends on
            garmentType, description/THE EMBROIDERY depend on motif — each
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
            </section>
          )}

          {garmentType && (
            <section className="py-6" aria-labelledby={garmentDetailHeadingId}>
              <h2
                id={garmentDetailHeadingId}
                className="mb-2 font-mono text-label-mono uppercase text-antique-brass"
              >
                The Garment
              </h2>
              <p className="font-body text-body-sm">{garmentType.garmentBlurb}</p>
            </section>
          )}

          {motif && (
            <section className="py-6" aria-labelledby={embroideryHeadingId}>
              <h2
                id={embroideryHeadingId}
                className="mb-2 font-mono text-label-mono uppercase text-antique-brass"
              >
                The Embroidery
              </h2>
              {/* Template intentionally drops key-product.html's closing
                  "a specific landmark, remembered" clause — that phrasing is
                  landmark-specific and doesn't generalize across every
                  motif (e.g. the logo designs aren't landmarks). */}
              <p className="font-body text-body-sm">
                {motif.name} — one motif from the {getCollection(motif.collection)?.name ?? "Weathered Thread"} collection. Stitched in navy thread,
                part of the &quot;PLACE → STORY → MOTIF → OBJECT&quot; line.
              </p>
            </section>
          )}

          <section className="py-6" aria-labelledby={fitSizeHeadingId}>
            <h2
              id={fitSizeHeadingId}
              className="mb-2 font-mono text-label-mono uppercase text-antique-brass"
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
              className="mb-2 font-mono text-label-mono uppercase text-antique-brass"
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
              className="mb-2 font-mono text-label-mono uppercase text-antique-brass"
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
        onAddToBag={addToBag}
      />
    </main>
  );
}
