/**
 * cart-store — keeps the bag in the visitor's browser (localStorage) and tells React when it
 * changes. The bag is client-side on purpose: the pages stay static instead of turning dynamic
 * to read a cookie. It holds picks and quantities only (see `lib/cart.ts`); the server prices
 * them at checkout. Storage can be missing or throw (private window, blocked site data), so the
 * store falls back to memory for the page's lifetime rather than failing.
 */
import {
  addItem,
  parseCart,
  removeItem,
  serializeCart,
  setQuantity,
  type Cart,
  type CartPick,
} from "./cart";

export const CART_STORAGE_KEY = "wt-bag";

export type CartStorage = Pick<Storage, "getItem" | "setItem">;

const EMPTY: Cart = [];

export function createCartStore(storage: CartStorage | null) {
  let current: Cart = EMPTY;
  let lastRaw: string | null | undefined;
  const listeners = new Set<() => void>();

  /** Re-reads storage so another tab's change shows up; the same object comes back until it differs. */
  function getSnapshot(): Cart {
    if (!storage) return current;
    let raw: string | null;
    try {
      raw = storage.getItem(CART_STORAGE_KEY);
    } catch {
      return current;
    }
    if (raw !== lastRaw) {
      lastRaw = raw;
      current = parseCart(raw);
    }
    return current;
  }

  function update(change: (cart: Cart) => Cart) {
    const next = change(getSnapshot());
    if (next === current) return;
    current = next;
    try {
      const raw = serializeCart(next);
      storage?.setItem(CART_STORAGE_KEY, raw);
      lastRaw = raw;
    } catch {
      // Not persisted: the bag lives in memory until the page closes.
    }
    for (const listener of listeners) listener();
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY || event.key === null) listener();
    };
    if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
    };
  }

  return {
    getSnapshot,
    getServerSnapshot: (): Cart => EMPTY,
    subscribe,
    add: (pick: CartPick, quantity = 1) => update((cart) => addItem(cart, pick, quantity)),
    setQuantity: (key: string, quantity: number) => update((cart) => setQuantity(cart, key, quantity)),
    remove: (key: string) => update((cart) => removeItem(cart, key)),
    clear: () => update(() => []),
  };
}

function browserStorage(): CartStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The one bag for this page. On the server it has no storage and stays empty. */
export const cartStore = createCartStore(browserStorage());
