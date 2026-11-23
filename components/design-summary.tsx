import Image from "next/image";
import CollectionLabel from "@/components/collection-label";
import type { Ref } from "react";

type DesignSummaryProps = {
  collection: string;
  collectionPlace?: boolean;
  name: string;
  image?: string;
  /** Shows a "Change" button when given. The Product page omits it: its design is fixed. */
  onChange?: () => void;
  ref?: Ref<HTMLButtonElement>;
};

/**
 * design-summary — the design row on the Product page: thumbnail, collection label and design
 * name, plus an optional secondary "Change" button (the Product page leaves it off). Paper Raised surface, rounded corners.
 */
export default function DesignSummary({ collection, collectionPlace, name, image, onChange, ref }: DesignSummaryProps) {
  return (
    <div className="flex items-center gap-3 rounded bg-paper-raised px-3 py-2.5">
      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded bg-sailcloth">
        {image && <Image src={image} alt="" fill sizes="44px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <CollectionLabel name={collection} place={collectionPlace} />
        <p className="font-body text-body-sm">{name}</p>
      </div>
      {onChange && (
        <button
          ref={ref}
          type="button"
          onClick={onChange}
          aria-label={`Change design, currently ${name}`}
          className="inline-flex min-h-11 items-center justify-center rounded-sm border border-wet-ink px-4 font-mono text-label-mono uppercase text-wet-ink"
        >
          Change
        </button>
      )}
    </div>
  );
}
