/**
 * footer — Server Component: persistent site footer, a Deep Harbor band (copyright, a plain-
 * text "Shipping · Returns" label, not yet a link — no shipping/returns page exists — and the
 * brand sign-off), rendered once from `app/(site)/layout.tsx` after `{children}`, mirroring the
 * persistent-nav pattern (`NavHeader`) in the same layout.
 */
export default function Footer() {
  return (
    <footer className="bg-deep-harbor px-gutter-mobile py-6 text-sailcloth md:px-gutter-desktop">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="font-mono text-caption-mono uppercase text-sailcloth/75">
          © Weathered Thread · Shipping · Returns
        </p>
        <p className="font-mono text-eyebrow-mono uppercase">Made to Remember · Stitched in</p>
      </div>
    </footer>
  );
}
