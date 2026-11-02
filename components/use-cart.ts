"use client";

import { useSyncExternalStore } from "react";
import { cartStore } from "@/lib/cart-store";

/** The visitor's bag; empty during server render and hydration, then the stored bag. */
export function useCart() {
  return useSyncExternalStore(cartStore.subscribe, cartStore.getSnapshot, cartStore.getServerSnapshot);
}
