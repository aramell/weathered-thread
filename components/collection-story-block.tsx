"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type CollectionStoryBlockProps = {
  eyebrow: string;
  heading: string;
  children: ReactNode;
};

/**
 * collection-story-block — the PLACE -> STORY moment. Full-bleed Deep Harbor
 * surface, Sailcloth text, display-lg heading. Reveals once on scroll via
 * IntersectionObserver (no autoplay, no re-trigger on scroll-back). Reused by
 * the Collection Story page (Story 1.3).
 */
export default function CollectionStoryBlock({
  eyebrow,
  heading,
  children,
}: CollectionStoryBlockProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }

    // Reveal must be scroll-triggered, never fire on initial mount — but an
    // IntersectionObserver's first callback reports the *current* intersection
    // state as soon as observe() runs, so a section already on-screen at load
    // (short Hero, tall viewport) would otherwise reveal with zero scrolling.
    // Gate on an actual scroll event, and re-check visibility directly on
    // scroll so a still-visible-but-already-past-threshold section isn't
    // stuck waiting for another threshold crossing that may never happen.
    let hasScrolled = false;
    let done = false;

    const reveal = () => {
      if (done) return;
      done = true;
      setRevealed(true);
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };

    const handleScroll = () => {
      hasScrolled = true;
      const rect = node.getBoundingClientRect();
      const visibleHeight =
        Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      if (rect.height > 0 && visibleHeight / rect.height >= 0.2) {
        reveal();
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (!hasScrolled) return;
        for (const entry of entries) {
          if (entry.isIntersecting) {
            reveal();
          }
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`w-full bg-deep-harbor px-gutter-mobile py-story-gap text-sailcloth transition-opacity duration-700 ease-out md:px-gutter-desktop ${
        revealed ? "opacity-100" : "opacity-0"
      }`}
    >
      <p className="mb-3 font-mono text-label-mono uppercase text-sailcloth/75">
        {eyebrow}
      </p>
      <h2 className="mb-4 font-display text-display-lg-mobile md:text-display-lg">
        {heading}
      </h2>
      <div className="flex flex-col items-start gap-5 font-display text-body">
        {children}
      </div>
    </section>
  );
}
