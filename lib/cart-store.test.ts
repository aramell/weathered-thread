import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { itemKey, parseCart, type CartPick } from "./cart";
import { CART_STORAGE_KEY, createCartStore, type CartStorage } from "./cart-store";

const wave: CartPick = { slug: "sic-wave", style: "heavyweight-tee", color: "ivory", size: "M" };
const boat: CartPick = { slug: "sic-iconic-boat", style: "crewneck", color: "bay", size: "L" };

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  const storage: CartStorage = {
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
  };
  return { storage, data };
}

describe("createCartStore", () => {
  it("starts empty and persists what is added", () => {
    const { storage, data } = memoryStorage();
    const store = createCartStore(storage);
    assert.deepEqual(store.getSnapshot(), []);

    store.add(wave, 2);
    assert.deepEqual(store.getSnapshot(), [{ ...wave, quantity: 2 }]);
    assert.deepEqual(parseCart(data[CART_STORAGE_KEY]), [{ ...wave, quantity: 2 }]);
  });

  it("loads a bag saved earlier", () => {
    const { storage } = memoryStorage({ [CART_STORAGE_KEY]: JSON.stringify([{ ...boat, quantity: 3 }]) });
    assert.deepEqual(createCartStore(storage).getSnapshot(), [{ ...boat, quantity: 3 }]);
  });

  it("returns the same snapshot object until the bag changes, as useSyncExternalStore requires", () => {
    const store = createCartStore(memoryStorage().storage);
    store.add(wave);
    assert.equal(store.getSnapshot(), store.getSnapshot());
    const before = store.getSnapshot();
    store.add(boat);
    assert.notEqual(store.getSnapshot(), before);
  });

  it("sets quantity, removes a line and clears the bag", () => {
    const store = createCartStore(memoryStorage().storage);
    store.add(wave);
    store.add(boat);
    store.setQuantity(itemKey(wave), 4);
    assert.equal(store.getSnapshot()[0].quantity, 4);
    store.remove(itemKey(boat));
    assert.deepEqual(store.getSnapshot().map((item) => item.slug), ["sic-wave"]);
    store.clear();
    assert.deepEqual(store.getSnapshot(), []);
  });

  it("notifies subscribers on change and stops after they unsubscribe", () => {
    const store = createCartStore(memoryStorage().storage);
    let calls = 0;
    const unsubscribe = store.subscribe(() => {
      calls += 1;
    });
    store.add(wave);
    store.setQuantity(itemKey(wave), 2);
    assert.equal(calls, 2);
    unsubscribe();
    store.add(boat);
    assert.equal(calls, 2);
  });

  it("picks up a change another tab wrote to storage", () => {
    const { storage, data } = memoryStorage();
    const store = createCartStore(storage);
    store.add(wave);
    data[CART_STORAGE_KEY] = JSON.stringify([{ ...boat, quantity: 1 }]);
    assert.deepEqual(store.getSnapshot().map((item) => item.slug), ["sic-iconic-boat"]);
  });

  it("treats unreadable stored data as an empty bag", () => {
    const { storage } = memoryStorage({ [CART_STORAGE_KEY]: "{not json" });
    assert.deepEqual(createCartStore(storage).getSnapshot(), []);
  });

  it("keeps working in memory when storage throws (private window, blocked site data)", () => {
    const storage: CartStorage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const store = createCartStore(storage);
    assert.doesNotThrow(() => store.add(wave));
    assert.equal(store.getSnapshot().length, 1);
  });

  it("works with no storage at all (server render)", () => {
    const store = createCartStore(null);
    assert.deepEqual(store.getSnapshot(), []);
    store.add(wave);
    assert.equal(store.getSnapshot().length, 1);
  });

  it("reports whether an add changed the bag", () => {
    const store = createCartStore(memoryStorage().storage);
    assert.equal(store.add(wave, 10), true);
    assert.equal(store.add(wave), false, "a line already at the quantity cap takes no more");
    assert.equal(store.getSnapshot()[0].quantity, 10);
    assert.equal(store.add(boat), true);
  });
});
