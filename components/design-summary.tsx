import Image from "next/image";
import type { Ref } from "react";

type DesignSummaryProps = {
  collection: string;
  name: string;
  image?: string;
  onChange: () => void;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * design-summary — the collapsed design row on the Product page: thumbnail, collection label,
 * design name, and a secondary "Change" button. Paper Raised surface, rounded corners.
 */
export default function DesignSummary({ collection, name, image, onChange, ref }: DesignSummaryProps) {
  return (
    <div className="flex items-center gap-3 rounded bg-paper-raised px-3 py-2.5">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded bg-sailcloth">
        {image && <Image src={image} alt="" fill sizes="44px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-caption-mono text-marsh-sage">{collection}</p>
        <p className="font-body text-body-sm">{name}</p>
      </div>
      <button
        ref={ref}
        type="button"
        onClick={onChange}
        aria-label={`Change design, currently ${name}`}
        className="inline-flex min-h-11 items-center justify-center rounded-sm border border-wet-ink px-4 font-mono text-label-mono uppercase text-wet-ink"
      >
        Change
      </button>
    </div>
  );
}
