"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { priceBagAction, startCheckout, type StartCheckoutFailure } from "@/app/(site)/bag/actions";
import { useCart } from "@/components/use-cart";
import { itemKey, MAX_QUANTITY, SHIPPING_CENTS, serializeCart, type PricedLine } from "@/lib/cart";
import { cartStore } from "@/lib/cart-store";
import { formatPrice } from "@/lib/format-price";

const FAILURE_COPY: Record<StartCheckoutFailure["error"], string> = {
  failed: "That didn’t go through — try again.",
  unavailable: "Something in your bag is no longer available. Remove it to continue.",
  empty: "Your bag is empty.",
};

const stepperClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-sm border border-line font-mono text-label-mono text-wet-ink disabled:cursor-not-allowed disabled:opacity-40";

/**
 * bag-view — the bag page's one Client Component. The stored picks come from the browser
 * (`useCart`); the server prices them (`priceBagAction`) and builds the Square checkout
 * (`startCheckout`). Quantity changes are priced locally from the server's unit prices.
 */
export default function BagView() {
  const cart = useCart();
  const raw = serializeCart(cart);
  const [priced, setPriced] = useState<Map<string, PricedLine> | null>(null);
  const [failure, setFailure] = useState<StartCheckoutFailure["error"] | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (cart.length === 0) return;
    let stale = false;
    priceBagAction(raw)
      .then((result) => {
        if (!stale) setPriced(new Map(result.lines.map((line) => [line.key, line])));
      })
      .catch(() => {
        if (!stale) setFailure("failed");
      });
    return () => {
      stale = true;
    };
    // `raw` is the serialized `cart`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [raw]);

  if (cart.length === 0) {
    return (
      <section className="mx-auto w-full max-w-md bg-sailcloth px-gutter-mobile py-story-gap text-center md:px-gutter-desktop">
        <h1 className="mb-4 font-display text-headline">Your bag is empty.</h1>
        <p className="mb-6 font-body text-body">Pick a design and a garment, and it will wait for you here.</p>
        <Link
          href="/shop"
          className="inline-flex min-h-11 items-center justify-center rounded-sm bg-deep-harbor px-5 font-mono text-label-mono uppercase text-sailcloth"
        >
          Shop
        </Link>
      </section>
    );
  }

  const lineFor = (key: string) => priced?.get(key);
  const allPriced = cart.every((item) => lineFor(itemKey(item)));
  const hasUnavailable = cart.some((item) => lineFor(itemKey(item))?.status === "unavailable");
  const subtotalCents = cart.reduce((total, item) => {
    const line = lineFor(itemKey(item));
    return total + (line?.status === "ok" ? line.pick.priceCents * item.quantity : 0);
  }, 0);
  const canCheckout = allPriced && !hasUnavailable && !pending;

  const checkout = () => {
    setFailure(null);
    startTransition(async () => {
      const result = await startCheckout(raw);
      if (result) setFailure(result.error);
    });
  };

  return (
    <section className="mx-auto w-full max-w-xl px-gutter-mobile py-story-gap md:px-gutter-desktop">
      <h1 className="mb-6 font-display text-headline">Your bag</h1>

      <ul className="mb-6 divide-y divide-line border-y border-line">
        {cart.map((item) => {
          const key = itemKey(item);
          const line = lineFor(key);
          return (
            <li key={key} className="flex flex-col gap-3 py-4">
              {line?.status === "unavailable" ? (
                <p className="font-body text-body">That piece is no longer available.</p>
              ) : line ? (
                <div className="flex items-baseline justify-between gap-4">
                  <p className="font-body text-body-sm">
                    {line.pick.motifName} — {line.pick.garment}, {line.pick.color}, size {line.pick.size}
                  </p>
                  <p className="font-mono text-price-mono">{formatPrice(line.pick.priceCents * item.quantity)}</p>
                </div>
              ) : (
                <p className="font-body text-body-sm text-marsh-sage">Loading…</p>
              )}
              <div className="flex items-center justify-between gap-4">
                {line?.status === "unavailable" ? (
                  <span />
                ) : (
                  <div className="flex items-center gap-2" role="group" aria-label="Quantity">
                    <button
                      type="button"
                      className={stepperClass}
                      aria-label="Decrease quantity"
                      disabled={item.quantity <= 1}
                      onClick={() => cartStore.setQuantity(key, item.quantity - 1)}
                    >
                      −
                    </button>
                    <span className="min-w-6 text-center font-mono text-label-mono" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className={stepperClass}
                      aria-label="Increase quantity"
                      disabled={item.quantity >= MAX_QUANTITY}
                      onClick={() => cartStore.setQuantity(key, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  className="inline-flex min-h-11 items-center px-2 font-mono text-label-mono uppercase text-wet-ink underline underline-offset-2"
                  onClick={() => cartStore.remove(key)}
                >
                  Remove
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <dl className="mb-6 flex flex-col gap-2 font-body text-body-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="font-mono text-price-mono">{allPriced ? formatPrice(subtotalCents) : "—"}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Shipping (flat rate, US)</dt>
          <dd className="font-mono text-price-mono">{formatPrice(SHIPPING_CENTS)}</dd>
        </div>
        <div className="flex justify-between border-t border-line pt-2">
          <dt>Total</dt>
          <dd className="font-mono text-price-mono">
            {allPriced && !hasUnavailable ? formatPrice(subtotalCents + SHIPPING_CENTS) : "—"}
          </dd>
        </div>
      </dl>

      <p role="alert" className="mb-4 font-body text-body">
        {failure ? FAILURE_COPY[failure] : null}
      </p>
      <button
        type="button"
        disabled={!canCheckout}
        onClick={checkout}
        className="mb-4 inline-flex min-h-11 w-full items-center justify-center rounded-sm bg-deep-harbor px-5 font-mono text-label-mono uppercase text-sailcloth disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "Taking you to checkout…" : "Checkout"}
      </button>
      <p className="font-body text-body-sm text-marsh-sage">
        You&apos;ll enter your address and pay on Square&apos;s secure checkout.
      </p>
    </section>
  );
}
