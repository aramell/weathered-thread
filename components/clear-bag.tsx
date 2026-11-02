"use client";

import { useEffect } from "react";
import { cartStore } from "@/lib/cart-store";

/** Empties the bag once the visitor is back from Square's checkout. Renders nothing. */
export default function ClearBag() {
  useEffect(() => {
    cartStore.clear();
  }, []);
  return null;
}
