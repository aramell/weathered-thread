"use server";

import { redirect } from "next/navigation";
import { priceBag, startBagCheckout } from "@/lib/bag";
import { parseCart, type PricedCart } from "@/lib/cart";
import { thankYouUrl } from "@/lib/checkout";
import { squareClient } from "@/lib/square-client";

/**
 * The bag arrives as the browser's stored picks and quantities (`raw`); `parseCart` drops
 * anything malformed, and prices always come from the catalog, never from the request.
 */
export async function priceBagAction(raw: string): Promise<PricedCart> {
  return priceBag(parseCart(raw));
}

export type StartCheckoutFailure = { error: "empty" | "unavailable" | "failed" };

/** Creates the Square checkout for the bag and sends the visitor there; returns only on failure. */
export async function startCheckout(raw: string): Promise<StartCheckoutFailure> {
  let result: Awaited<ReturnType<typeof startBagCheckout>>;
  try {
    result = await startBagCheckout(parseCart(raw), {
      client: squareClient(),
      redirectUrl: thankYouUrl(process.env.SHOP_ORIGIN),
    });
  } catch (error) {
    // Missing Square configuration; the message names a variable, never its value.
    console.error("Square checkout unavailable:", error instanceof Error ? error.message : "unknown error");
    return { error: "failed" };
  }
  // redirect() throws, so it stays outside the try.
  if (result.ok) redirect(result.url);
  return { error: result.reason };
}
