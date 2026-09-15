"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type NavScrollShellProps = {
  children: ReactNode;
};

/**
 * nav-scroll-shell — the only client boundary in Story 1.2. Owns the header
 * element and tracks scroll position, toggling `position: sticky` plus a
 * Line hairline once the visitor scrolls past the nav's own height. Desktop
 * (md+) always overrides back to static with no hairline via CSS, so it
 * never goes sticky regardless of scroll state. Renders `children` (the
 * server-rendered nav-header content) unchanged.
 */
export default function NavScrollShell({ children }: NavScrollShellProps) {
  const headerRef = useRef<HTMLElement>(null);
  const [scrolledPast, setScrolledPast] = useState(false);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    // Re-measure on every check rather than once at mount, so the sticky
    // threshold stays correct across resize, orientation change, and
    // webfont-load reflow of the header's own height.
    const handleScroll = () => {
      setScrolledPast(window.scrollY > node.offsetHeight);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      className={`top-0 z-10 w-full bg-sailcloth ${
        scrolledPast
          ? "sticky border-b border-line md:static md:border-b-0"
          : "md:static"
      }`}
    >
      {children}
    </header>
  );
}
