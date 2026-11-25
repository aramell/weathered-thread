"use server";

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
export type StartCheckoutResult = StartCheckoutFailure | { url: string };

/**
 * Creates the Square checkout for the bag and returns its URL for the browser to open.
 * It returns the URL instead of calling `redirect()`: a redirecting Server Action rejects its
 * promise on the client, which the bag's error handling would show as a failed checkout.
 */
export async function startCheckout(raw: string): Promise<StartCheckoutResult> {
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
  if (result.ok) return { url: result.url };
  return { error: result.reason };
}
