import Link from "next/link";

const navLinks = [
  { href: "/shop", label: "Shop" },
  { href: "/collections", label: "Collections" },
  { href: "/about", label: "About" },
] as const;

/**
 * nav-header — Server Component: brand mark, SHOP/COLLECTIONS/ABOUT
 * label-mono text links (Wet Ink), a search icon (aria-label only, no href
 * yet — Story 3.5 wires it up) and a non-interactive bag icon (aria-label
 * only, no href or count badge — "bag" is always scoped to a single
 * product's Add to Bag, Epic 4). No 'use client' here; rendered as children
 * of <NavScrollShell>, which owns all scroll-tracking state.
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

        <span
          role="img"
          aria-label="Bag"
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
            <path d="M6 8h12l-1 12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1L6 8Z" />
            <path d="M9 8V6a3 3 0 0 1 6 0v2" />
          </svg>
        </span>
      </div>
    </div>
  );
}
