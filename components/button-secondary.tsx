import Link from "next/link";
import type { ReactNode } from "react";

type ButtonSecondaryProps = {
  href: string;
  children: ReactNode;
};

/**
 * button-secondary — transparent with a Wet Ink border and text,
 * rounded.sm corners, >=44px tap height. Used for secondary actions
 * (View Details, Back to Collection/Shop) per DESIGN.md.
 */
export default function ButtonSecondary({ href, children }: ButtonSecondaryProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-sm border border-wet-ink px-5 font-mono text-label-mono uppercase text-wet-ink"
    >
      {children}
    </Link>
  );
}
