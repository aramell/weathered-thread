"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { slideLabel, type GallerySlide } from "@/lib/picker-gallery";

type PickerGalleryProps = {
  slides: GallerySlide[];
  index: number;
  onIndexChange: (index: number) => void;
  /** Alt text for the preview slide. */
  previewAlt: string;
  /** Placeholder caption shown while the preview slide is active. */
  previewCaption: string;
};

const buttonClass =
  "flex h-11 w-11 items-center justify-center rounded-full bg-paper-raised/90 font-mono text-label-mono text-wet-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass";

/**
 * picker-gallery — user-driven hero gallery (never autoplay): a scroll-snap track that swipes
 * on touch, with visible previous/next buttons as the non-swipe alternative. The parent owns
 * the active index; the garment preview is just the last thumbnail, never auto-selected. Position is
 * announced politely as "Photo i of M".
 */
export default function PickerGallery({ slides, index, onIndexChange, previewAlt, previewCaption }: PickerGalleryProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const stripRef = useRef<HTMLUListElement>(null);
  const total = slides.length;
  const active = Math.min(index, total - 1);

  // Keep the active thumbnail visible in the strip without scrolling the page.
  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.children[active] as HTMLElement | undefined;
    if (!strip || !thumb) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    strip.scrollTo({
      left: thumb.offsetLeft - (strip.clientWidth - thumb.clientWidth) / 2,
      behavior: reduce ? "instant" : "smooth",
    });
  }, [active, total]);

  // Bring the track to the requested slide (instant: it should feel like a photo swap).
  useEffect(() => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const target = active * track.clientWidth;
    if (Math.abs(track.scrollLeft - target) > 1) track.scrollTo({ left: target, behavior: "instant" });
  }, [active, total]);

  const onScroll = () => {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const next = Math.round(track.scrollLeft / track.clientWidth);
    if (next !== active && next >= 0 && next < total) onIndexChange(next);
  };

  const activeSlide = slides[active];

  return (
    <div role="group" aria-roledescription="gallery" aria-label="Photos" className="relative">
      <ul
        ref={trackRef}
        onScroll={onScroll}
        className="flex aspect-square snap-x snap-mandatory overflow-x-auto rounded bg-paper-raised [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((slide, i) => (
          <li
            key={`${i}-${slide.kind}-${slide.url}`}
            aria-label={slideLabel(i, total)}
            className="relative aspect-square w-full shrink-0 snap-center"
          >
            <Image
              src={slide.url}
              alt={slide.kind === "preview" ? previewAlt : slide.alt}
              fill
              preload={i === 0}
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover"
            />
          </li>
        ))}
      </ul>
      {total > 1 && (
        <>
          <div className="pointer-events-none absolute inset-y-0 left-2 right-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onIndexChange(active - 1)}
              disabled={active === 0}
              aria-label="Previous photo"
              className={`pointer-events-auto ${buttonClass}`}
            >
              &lsaquo;
            </button>
            <button
              type="button"
              onClick={() => onIndexChange(active + 1)}
              disabled={active === total - 1}
              aria-label="Next photo"
              className={`pointer-events-auto ${buttonClass}`}
            >
              &rsaquo;
            </button>
          </div>
        </>
      )}
      {total > 1 && (
        <ul ref={stripRef} aria-label="Choose photo" className="relative mt-2 flex gap-2 overflow-x-auto p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {slides.map((slide, i) => (
            <li key={`${i}-${slide.kind}-${slide.url}`} className="shrink-0">
              <button
                type="button"
                onClick={() => onIndexChange(i)}
                aria-label={`Show ${slideLabel(i, total).toLowerCase()}`}
                aria-current={i === active ? "true" : undefined}
                className={`relative block h-14 w-14 overflow-hidden rounded bg-paper-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass ${
                  i === active ? "ring-2 ring-wet-ink" : "opacity-70"
                }`}
              >
                <Image src={slide.url} alt="" fill sizes="56px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
      <p aria-live="polite" className="mt-2 font-mono text-caption-mono text-marsh-sage">
        {slideLabel(active, total)}
        {activeSlide?.kind === "preview" && ` — ${previewCaption}`}
      </p>
    </div>
  );
}
