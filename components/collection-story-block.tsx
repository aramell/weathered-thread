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

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(node);
    return () => observer.disconnect();
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
