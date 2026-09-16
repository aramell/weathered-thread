type AddToBagBarProps = {
  price: string;
  disabled: boolean;
  visible: boolean;
};

/**
 * add-to-bag-bar — sticky mobile "Add to Bag" CTA that mirrors the
 * primary button's price and enabled/disabled state, per EXPERIENCE.md's
 * Interaction Primitives ("Sticky 'Add to Bag' bar appears on mobile once
 * the primary button scrolls out of view"). Presentational only:
 * `ProductPickerShell` owns all selection state and the `visible` flag
 * (via `IntersectionObserver` on the primary button), mirroring
 * `nav-scroll-shell.tsx`'s client-boundary/scroll-effect shape. Always
 * mounted so the transition can animate; `md:hidden` keeps it off desktop
 * entirely, and it's inert (no tab stop, `aria-hidden`) while not visible.
 */
export default function AddToBagBar({ price, disabled, visible }: AddToBagBarProps) {
  return (
    <div
      aria-hidden={!visible}
      className={`fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 border-t border-line bg-sailcloth px-gutter-mobile py-3 shadow-[0_-4px_12px_rgba(43,42,38,0.12)] transition-transform duration-200 md:hidden ${
        visible ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
    >
      <p className="font-mono text-price-mono">{price}</p>
      <button
        type="button"
        disabled={disabled}
        tabIndex={visible ? 0 : -1}
        className="inline-flex min-h-11 flex-1 max-w-56 items-center justify-center rounded-sm bg-deep-harbor px-5 font-mono text-label-mono uppercase text-sailcloth disabled:cursor-not-allowed disabled:opacity-50"
      >
        Add to Bag
      </button>
    </div>
  );
}
