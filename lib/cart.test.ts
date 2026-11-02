import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  addItem,
  cartCount,
  itemKey,
  MAX_LINES,
  MAX_QUANTITY,
  parseCart,
  priceCart,
  removeItem,
  serializeCart,
  setQuantity,
  type Cart,
  type CartPick,
  type ResolvedPick,
} from "./cart";

const wave: CartPick = { slug: "sic-wave", style: "heavyweight-tee", color: "ivory", size: "M" };
const boat: CartPick = { slug: "sic-iconic-boat", style: "crewneck", color: "bay", size: "L" };

describe("addItem", () => {
  it("adds a new pick with quantity 1 by default", () => {
    assert.deepEqual(addItem([], wave), [{ ...wave, quantity: 1 }]);
  });

  it("raises the quantity when the same pick is added again", () => {
    const cart = addItem(addItem([], wave), wave, 2);
    assert.deepEqual(cart, [{ ...wave, quantity: 3 }]);
  });

  it("keeps different picks as separate lines, in the order added", () => {
    const cart = addItem(addItem([], wave), boat);
    assert.deepEqual(cart.map((item) => item.slug), ["sic-wave", "sic-iconic-boat"]);
  });

  it("treats a different size or color of the same design as a different line", () => {
    const cart = addItem(addItem([], wave), { ...wave, size: "L" });
    assert.equal(cart.length, 2);
  });

  it("caps a line at the maximum quantity", () => {
    const cart = addItem(addItem([], wave, MAX_QUANTITY), wave, 5);
    assert.equal(cart[0].quantity, MAX_QUANTITY);
  });

  it("does not add a line past the line limit but still merges into an existing one", () => {
    let cart: Cart = [];
    for (let i = 0; i < MAX_LINES; i += 1) cart = addItem(cart, { ...wave, size: `S${i}` });
    assert.equal(cart.length, MAX_LINES);
    assert.equal(addItem(cart, boat).length, MAX_LINES);
    assert.equal(addItem(cart, { ...wave, size: "S0" })[0].quantity, 2);
  });

  it("does not mutate the cart it was given", () => {
    const cart: Cart = Object.freeze([Object.freeze({ ...wave, quantity: 1 })]);
    assert.doesNotThrow(() => addItem(cart, wave));
  });
});

describe("setQuantity and removeItem", () => {
  const cart = addItem(addItem([], wave), boat);

  it("sets a line's quantity", () => {
    assert.equal(setQuantity(cart, itemKey(wave), 4)[0].quantity, 4);
  });

  it("clamps to 1 to 10", () => {
    assert.equal(setQuantity(cart, itemKey(wave), 0)[0].quantity, 1);
    assert.equal(setQuantity(cart, itemKey(wave), -3)[0].quantity, 1);
    assert.equal(setQuantity(cart, itemKey(wave), 99)[0].quantity, MAX_QUANTITY);
    assert.equal(setQuantity(cart, itemKey(wave), 2.9)[0].quantity, 2);
  });

  it("leaves the cart alone for a non-number quantity or an unknown line", () => {
    assert.deepEqual(setQuantity(cart, itemKey(wave), Number.NaN), cart);
    assert.deepEqual(setQuantity(cart, "nope", 3), cart);
  });

  it("removes only the named line", () => {
    assert.deepEqual(removeItem(cart, itemKey(wave)).map((item) => item.slug), ["sic-iconic-boat"]);
    assert.deepEqual(removeItem(cart, "nope"), cart);
  });

  it("counts units across lines", () => {
    assert.equal(cartCount(setQuantity(cart, itemKey(wave), 3)), 4);
    assert.equal(cartCount([]), 0);
  });
});

describe("serializeCart and parseCart", () => {
  it("round-trips a cart", () => {
    const cart = addItem(addItem([], wave, 2), boat);
    assert.deepEqual(parseCart(serializeCart(cart)), cart);
  });

  it("reads missing, empty or unreadable storage as an empty bag", () => {
    for (const raw of [null, undefined, "", "not json", "{", "42", '"x"', "null", '{"a":1}']) {
      assert.deepEqual(parseCart(raw), [], String(raw));
    }
  });

  it("drops malformed entries and keeps the good ones", () => {
    const raw = JSON.stringify([
      { ...wave, quantity: 2 },
      { slug: "x", style: "y", color: "z" },
      { ...boat, quantity: "3" },
      { ...boat, size: "", quantity: 1 },
      null,
      7,
    ]);
    assert.deepEqual(parseCart(raw), [{ ...wave, quantity: 2 }]);
  });

  it("clamps stored quantities and rounds them down", () => {
    const parsed = parseCart(JSON.stringify([{ ...wave, quantity: 500 }, { ...boat, quantity: 0 }]));
    assert.deepEqual(parsed.map((item) => item.quantity), [MAX_QUANTITY, 1]);
    assert.equal(parseCart(JSON.stringify([{ ...wave, quantity: 2.7 }]))[0].quantity, 2);
  });

  it("merges duplicate lines and enforces the line limit", () => {
    const merged = parseCart(JSON.stringify([{ ...wave, quantity: 2 }, { ...wave, quantity: 3 }]));
    assert.deepEqual(merged, [{ ...wave, quantity: 5 }]);

    const many = Array.from({ length: MAX_LINES + 5 }, (_, i) => ({ ...wave, size: `S${i}`, quantity: 1 }));
    assert.equal(parseCart(JSON.stringify(many)).length, MAX_LINES);
  });

  it("ignores extra fields, including any stored price", () => {
    const parsed = parseCart(JSON.stringify([{ ...wave, quantity: 1, priceCents: 1, name: "free shirt" }]));
    assert.deepEqual(parsed, [{ ...wave, quantity: 1 }]);
  });

  it("rejects over-long strings", () => {
    assert.deepEqual(parseCart(JSON.stringify([{ ...wave, slug: "a".repeat(500), quantity: 1 }])), []);
  });
});

describe("priceCart", () => {
  const resolved: ResolvedPick = {
    motifName: "SIC Wave",
    garment: "Heavyweight Tee",
    color: "Ivory",
    size: "M",
    priceCents: 3600,
  };
  const resolve = (item: CartPick) => (item.slug === "sic-wave" ? resolved : null);

  it("prices each line from the resolver and sums the subtotal", () => {
    const cart = addItem([], wave, 3);
    const priced = priceCart(cart, resolve);
    assert.equal(priced.lines.length, 1);
    const [line] = priced.lines;
    assert.ok(line.status === "ok");
    assert.equal(line.lineCents, 10800);
    assert.equal(line.pick.garment, "Heavyweight Tee");
    assert.equal(priced.subtotalCents, 10800);
    assert.equal(priced.hasUnavailable, false);
  });

  it("flags a line the resolver can't price and leaves it out of the subtotal", () => {
    const cart = addItem(addItem([], wave), boat);
    const priced = priceCart(cart, resolve);
    assert.deepEqual(priced.lines.map((line) => line.status), ["ok", "unavailable"]);
    assert.equal(priced.subtotalCents, 3600);
    assert.equal(priced.hasUnavailable, true);
  });

  it("prices an empty bag at zero", () => {
    assert.deepEqual(priceCart([], resolve), { lines: [], subtotalCents: 0, hasUnavailable: false });
  });
});
