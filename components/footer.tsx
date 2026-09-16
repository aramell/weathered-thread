/**
 * footer — Server Component: persistent site footer (copyright + a plain-
 * text "Shipping · Returns" label, not yet a link — no shipping/returns
 * page exists), rendered once from `app/(site)/layout.tsx` after
 * `{children}`, mirroring the persistent-nav pattern (`NavHeader`) in the
 * same layout.
 */
export default function Footer() {
  return (
    <footer className="flex items-center justify-between px-gutter-mobile py-6 font-mono text-caption-mono uppercase text-marsh-sage md:px-gutter-desktop">
      <span>© Weathered Thread</span>
      <span>Shipping · Returns</span>
    </footer>
  );
}
