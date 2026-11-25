/**
 * comfort-colors-section — "Why Comfort Colors®?" on the product page. Every claim here comes
 * from the owner's Style Chart tile (Nov 2026) and nothing more: no fabric weights, no care
 * instructions, no supplier facts the tile does not state. Add a claim only when the owner
 * supplies its source.
 */
const REASONS = [
  { title: "Soft ring-spun cotton", body: "Soft, lived-in feel." },
  { title: "Garment-dyed character", body: "Rich, vintage-inspired color." },
  { title: "Relaxed everyday fit", body: "Easy, comfortable fit." },
] as const;

export default function ComfortColorsSection() {
  return (
    <section className="py-6" aria-labelledby="comfort-colors-heading">
      <h2
        id="comfort-colors-heading"
        className="mb-4 font-mono text-label-mono uppercase text-olive"
      >
        Why Comfort Colors®?
      </h2>
      <ul className="flex flex-col gap-4">
        {REASONS.map((reason) => (
          <li key={reason.title}>
            <p className="font-display text-headline">{reason.title}</p>
            <p className="font-body text-body-sm">{reason.body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
