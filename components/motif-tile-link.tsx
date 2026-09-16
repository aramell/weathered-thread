"use client";

import Link from "next/link";
import { useState } from "react";
import MotifTile from "@/components/motif-tile";

type MotifTileLinkProps = {
  name: string;
  href: string;
};

/**
 * motif-tile-link — small client wrapper that gives the read-only
 * `motif-tile` tap-to-select behavior for the Collection Story's
 * motif-first entry point (Epic 3 Story 3.2). On tap, marks itself
 * selected (forwarded to `motif-tile`, which now draws the Antique Brass
 * border itself) and lets `Link` navigate to that motif's Product-surface
 * stub; `aria-current` mirrors the selection so it isn't color-only. Local
 * per-tile `useState` — not a shared selection store. `motif-tile` itself
 * stays read-only/presentational; only this wrapper (and only on the
 * Collection Story) gains interactivity. Behavior unchanged from before
 * Story 3.3 — only the border's ownership moved into `motif-tile`.
 */
export default function MotifTileLink({ name, href }: MotifTileLinkProps) {
  const [selected, setSelected] = useState(false);

  return (
    <Link
      href={href}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
          return;
        }
        setSelected(true);
      }}
      aria-current={selected ? "true" : undefined}
      className="block rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-brass"
    >
      <MotifTile name={name} selected={selected} />
    </Link>
  );
}
