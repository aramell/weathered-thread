"use client";

import Link from "next/link";
import { useCart } from "@/components/use-cart";
import { cartCount } from "@/lib/cart";

/**
 * bag-link — the header's bag icon: links to /bag and shows how many pieces are in it. Client
 * Component because the bag lives in the visitor's browser (`lib/cart-store.ts`); the count
 * appears once the stored bag has loaded, so server and first client render agree.
 */
export default function BagLink() {
  const count = cartCount(useCart());
  return (
    <Link
      href="/bag"
      aria-label={count > 0 ? `Bag, ${count} ${count === 1 ? "item" : "items"}` : "Bag"}
      className="relative flex h-11 w-11 items-center justify-center text-wet-ink"
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
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-0.5 top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-deep-harbor px-1 font-mono text-caption-mono text-sailcloth"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
