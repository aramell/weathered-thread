"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import AddToBagBar from "@/components/add-to-bag-bar";
import ButtonSecondary from "@/components/button-secondary";
import GarmentSwatch from "@/components/garment-swatch";
import MotifTile from "@/components/motif-tile";
import ProductCard from "@/components/product-card";
import { formatPrice } from "@/lib/format-price";
import { getMotif, motifs } from "@/lib/placeholder-motif-data";
import {
  colorways,
  garmentTypes,
  getColorway,
  getGarmentType,
  sizes,
} from "@/lib/placeholder-shop-data";

type ProductPickerSeed =
  | { kind: "garment"; garmentTypeSlug: string; colorSlug: string }
  | { kind: "motif"; motifSlug: string };

type ProductPickerShellProps = {
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
 * and `add-to-bag-bar` stay presentational — they only read state/setters
 * via props, per Epic 3's Technical Decisions. The garment-type picker
 * reuses `product-card` itself (wrapped for selection/click), matching the
 * Boundaries note to reuse its styling for the motif-first "no garment
 * yet" empty state — and stays visible afterward so both entry paths land
 * on the same always-editable picker.
 */
export default function ProductPickerShell({
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
  const [sizeSlug, setSizeSlug] = useState<string | null>(null);
  const [motifSlug, setMotifSlug] = useState<string | null>(
    seed.kind === "motif" ? seed.motifSlug : null,
  );

  const garmentType = garmentTypeSlug ? getGarmentType(garmentTypeSlug) : undefined;
  const colorway = colorSlug ? getColorway(colorSlug) : undefined;
  const motif = motifSlug ? getMotif(motifSlug) : undefined;

  const isAddToBagEnabled = Boolean(
    garmentType && colorway && colorway.inStock && sizeSlug && motif,
  );
  const price = garmentType ? formatPrice(garmentType.price) : null;

  const heading = motif
    ? garmentType
      ? `${motif.name} — ${garmentType.name}`
      : motif.name
    : garmentType && colorway
      ? `${garmentType.name} — ${colorway.name}`
      : "Build your piece";

  const missingGarmentPrompt = !garmentType ? "Choose a garment for this piece." : null;
  const missingColorPrompt = garmentType && !colorway ? "Choose a color for this piece." : null;
  const selectedColorOutOfStockPrompt =
    colorway && !colorway.inStock
      ? `${colorway.name} is currently out of stock in this style.`
      : null;
  const missingSizePrompt =
    garmentType && colorway && colorway.inStock && !sizeSlug
      ? "Choose a size for this piece."
      : null;
  const missingMotifPrompt = garmentType && !motif ? "Choose a design for this piece." : null;

  const addToBagDisabledReason = isAddToBagEnabled
    ? null
    : (missingGarmentPrompt ??
      missingColorPrompt ??
      selectedColorOutOfStockPrompt ??
      missingSizePrompt ??
      missingMotifPrompt);

  const outOfStockColorways = colorways.filter((c) => !c.inStock);
  const outOfStockColorwayNames = outOfStockColorways.map((c) => c.name).join(", ");

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

  return (
    <main className="flex flex-col gap-story-gap">
      <section className="mx-auto w-full max-w-md px-gutter-mobile pb-24 md:px-gutter-desktop md:pb-0">
        <div className="relative mb-3 aspect-square overflow-hidden rounded bg-paper-raised">
          {colorway ? (
            <Image
              src={colorway.frontImage}
              alt={
                motif
                  ? `${motif.name} motif embroidered on ${colorway.name} ${garmentType?.name ?? "garment"} — placeholder, real photography pending`
                  : `${garmentType?.name ?? "Garment"} — ${colorway.name}`
              }
              fill
              preload
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-center">
              <p className="font-mono text-caption-mono text-marsh-sage">
                {garmentType
                  ? "Select a color to preview this design."
                  : "Select a garment to preview this design."}
              </p>
            </div>
          )}
        </div>
        {motif && colorway && (
          <p className="mb-5 font-mono text-caption-mono text-marsh-sage">
            {motif.name} on {colorway.name} {garmentType?.name} — placeholder mockup, real
            photography pending.
          </p>
        )}

        <h1 className="mb-1 font-display text-headline">{heading}</h1>
        {price && <p className="mb-6 font-mono text-price-mono">{price}</p>}

        {missingGarmentPrompt && (
          <p className="mb-4 font-body text-body">{missingGarmentPrompt}</p>
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
            className="grid grid-cols-2 gap-3"
          >
            {garmentTypes.map((type) => {
              const selected = type.slug === garmentTypeSlug;
              return (
                <div key={type.slug} role="listitem">
                  <button
                    type="button"
                    onClick={() => setGarmentTypeSlug(type.slug)}
                    aria-pressed={selected}
                    className={`block w-full rounded border-2 text-left ${
                      selected ? "border-wet-ink" : "border-transparent"
                    }`}
                  >
                    <ProductCard name={type.name} price={formatPrice(type.price)} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {garmentType && (
          <>
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
                {colorways.map((c) => (
                  <div key={c.slug} role="listitem">
                    <GarmentSwatch
                      name={c.name}
                      swatchColor={c.swatchColor}
                      selected={c.slug === colorSlug}
                      inStock={c.inStock}
                      onSelect={() => setColorSlug(c.slug)}
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
                {sizes.map((size) => {
                  const selected = size === sizeSlug;
                  return (
                    <div key={size} role="listitem">
                      <button
                        type="button"
                        onClick={() => setSizeSlug(size)}
                        aria-pressed={selected}
                        className={`flex h-11 w-11 items-center justify-center rounded border font-mono text-label-mono ${
                          selected
                            ? "border-wet-ink bg-wet-ink text-sailcloth"
                            : "border-line text-wet-ink"
                        }`}
                      >
                        {size}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}

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
                    onClick={() => setMotifSlug(m.slug)}
                    aria-pressed={selected}
                    className="block w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
                  >
                    <MotifTile name={m.name} selected={selected} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {addToBagDisabledReason && (
          <p id={addToBagStatusId} className="mb-4 font-body text-body">
            {addToBagDisabledReason}
          </p>
        )}
        <button
          ref={addToBagRef}
          type="button"
          disabled={!isAddToBagEnabled}
          aria-hidden={stickyVisible}
          tabIndex={stickyVisible ? -1 : undefined}
          aria-describedby={addToBagDisabledReason ? addToBagStatusId : undefined}
          className="mb-4 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-deep-harbor px-5 font-mono text-label-mono uppercase text-sailcloth disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add to Bag
        </button>
        <ButtonSecondary href={backHref}>{backLabel}</ButtonSecondary>
      </section>

      <AddToBagBar
        price={price ?? "—"}
        disabled={!isAddToBagEnabled}
        visible={stickyVisible}
      />
    </main>
  );
}
