/**
 * format-price — the one place integer-cents prices become a display
 * string. Prices are integer cents (the Etsy-synced shape); every surface that shows a
 * price renders it through this function instead of formatting inline.
 */
export function formatPrice(cents: number): string {
  const dollars = cents / 100;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}
