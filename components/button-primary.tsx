import Link from "next/link";
import type { ReactNode } from "react";

type ButtonPrimaryProps = {
  href: string;
  children: ReactNode;
};

/**
 * button-primary — Deep Harbor fill, Sailcloth label text, rounded.sm corners,
 * >=44px tap height. One per screen for the single primary action (DESIGN.md).
 */
export default function ButtonPrimary({ href, children }: ButtonPrimaryProps) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-11 items-center justify-center rounded-sm bg-deep-harbor px-5 font-mono text-label-mono uppercase text-sailcloth"
    >
      {children}
    </Link>
  );
}
