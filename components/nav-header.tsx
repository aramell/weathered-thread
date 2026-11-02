import Link from "next/link";
import BagLink from "@/components/bag-link";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
] as const;

/**
 * nav-header — Server Component: brand mark, SHOP/COLLECTIONS/ABOUT
 * label-mono text links (Wet Ink), a search icon (aria-label only, no href
 * yet — Story 3.5 wires it up) and the bag link with its item count
 * (`BagLink`, the one client island here). No 'use client' on this file;
 * rendered as children of <NavScrollShell>, which owns all scroll-tracking state.
 */
export default function NavHeader() {
  return (
    <div className="flex items-center justify-between gap-4 px-gutter-mobile py-3 md:px-gutter-desktop">
      <Link
        href="/"
        className="inline-flex min-h-11 items-center font-display text-body text-wet-ink"
      >
        Weathered Thread
      </Link>

      <nav aria-label="Primary" className="flex items-center gap-5">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex min-h-11 min-w-11 items-center justify-center px-1 font-mono text-label-mono uppercase text-wet-ink"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-1">
        <span
          role="img"
          aria-label="Search"
          className="flex h-11 w-11 items-center justify-center text-wet-ink"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>

        <BagLink />
      </div>
    </div>
  );
}
