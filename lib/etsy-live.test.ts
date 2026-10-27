import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createLiveEtsy, type StoredTokens, type TokenStore } from "./etsy-live";
import { livePrice, parseInventory } from "./etsy-inventory";

const inventoryBody = {
  products: [
    {
      product_id: 1,
      property_values: [
        { property_name: "Style", values: ["Heavyweight Tee"] },
        { property_name: "Primary color", values: ["Ivory"] },
        { property_name: "Size", values: ["M"] },
      ],
      offerings: [{ quantity: 4, is_enabled: true, price: { amount: 3600, divisor: 100, currency_code: "USD" } }],
    },
  ],
};

const NOW = 10_000_000_000;

function memoryStore(initial: StoredTokens | null = null) {
  let value = initial;
  const writes: StoredTokens[] = [];
  const store: TokenStore = {
    read: async () => value,
    write: async (tokens) => {
      value = tokens;
      writes.push(tokens);
    },
  };
  return { store, writes, current: () => value };
}

/** Routes Etsy's token endpoint and inventory endpoint; records every call. */
function etsyStub(options: { refreshStatus?: number; inventoryStatus?: number } = {}) {
  const calls: { url: string; auth: string | null }[] = [];
  let refreshes = 0;
  const stub = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push({ url, auth: new Headers(init?.headers).get("authorization") });
    if (url.includes("/oauth/token")) {
      refreshes += 1;
      if (options.refreshStatus) return new Response("nope", { status: options.refreshStatus });
      return Response.json({ access_token: `at-${refreshes}`, refresh_token: `rt-${refreshes}` });
    }
    return options.inventoryStatus
      ? new Response("no", { status: options.inventoryStatus })
      : Response.json(inventoryBody);
  }) as typeof fetch;
  return { stub, calls, refreshCount: () => refreshes };
}

const deps = (over: Partial<Parameters<typeof createLiveEtsy>[0]>) => ({
  apiKey: "key:secret",
  seedRefreshToken: "seed-rt",
  fetch: etsyStub().stub,
  now: () => NOW,
  store: memoryStore().store,
  ...over,
});

describe("live Etsy inventory", () => {
  it("seeds from env, stores the rotated pair, and parses variations", async () => {
    const etsy = etsyStub();
    const memory = memoryStore();
    const live = createLiveEtsy(deps({ fetch: etsy.stub, store: memory.store }));

    const variations = await live.fetchVariations(7);

    assert.equal(variations[0].options["Primary color"], "Ivory");
    assert.equal(variations[0].quantity, 4);
    assert.equal(memory.current()?.refreshToken, "rt-1");
    assert.equal(etsy.calls.at(-1)?.auth, "Bearer at-1");
  });

  it("reuses a fresh stored access token without refreshing", async () => {
    const etsy = etsyStub();
    const memory = memoryStore({ accessToken: "stored-at", refreshToken: "stored-rt", obtainedAt: NOW - 60_000 });
    const live = createLiveEtsy(deps({ fetch: etsy.stub, store: memory.store, seedRefreshToken: undefined }));

    await live.fetchVariations(7);

    assert.equal(etsy.refreshCount(), 0);
    assert.equal(etsy.calls[0].auth, "Bearer stored-at");
  });

  it("refreshes with the stored refresh token, not the env seed, once the access token is old", async () => {
    const etsy = etsyStub();
    const memory = memoryStore({ accessToken: "old", refreshToken: "stored-rt", obtainedAt: 0 });
    const live = createLiveEtsy(deps({ fetch: etsy.stub, store: memory.store }));

    await live.fetchVariations(7);

    assert.equal(etsy.refreshCount(), 1);
    assert.equal(memory.current()?.refreshToken, "rt-1");
  });

  it("shares one refresh between concurrent reads", async () => {
    const etsy = etsyStub();
    const live = createLiveEtsy(deps({ fetch: etsy.stub }));

    await Promise.all([live.fetchVariations(1), live.fetchVariations(2), live.fetchVariations(3)]);

    assert.equal(etsy.refreshCount(), 1);
  });

  it("falls back to a token another instance just stored when the refresh is rejected", async () => {
    const etsy = etsyStub({ refreshStatus: 400 });
    let reads = 0;
    const store: TokenStore = {
      read: async () => (reads++ === 0 ? null : { accessToken: "peer-at", refreshToken: "peer-rt", obtainedAt: NOW }),
      write: async () => {},
    };
    const live = createLiveEtsy(deps({ fetch: etsy.stub, store }));

    await live.fetchVariations(7);

    assert.equal(etsy.calls.at(-1)?.auth, "Bearer peer-at");
  });

  it("throws when no refresh token exists anywhere", async () => {
    const live = createLiveEtsy(deps({ seedRefreshToken: undefined }));
    await assert.rejects(live.fetchVariations(7), /no Etsy refresh token/);
  });

  it("forces a refresh on the next read after Etsy rejects the access token", async () => {
    const etsy = etsyStub({ inventoryStatus: 401 });
    const memory = memoryStore();
    const live = createLiveEtsy(deps({ fetch: etsy.stub, store: memory.store }));

    await assert.rejects(live.fetchVariations(7), /HTTP 401/);

    assert.equal(memory.current()?.obtainedAt, 0);
  });
});

describe("parseInventory / livePrice", () => {
  it("skips deleted products and zeroes a disabled offering", () => {
    const body = {
      products: [
        { product_id: 1, is_deleted: true, offerings: [] },
        {
          product_id: 2,
          property_values: [],
          offerings: [{ quantity: 9, is_enabled: false, price: { amount: 100, divisor: 100, currency_code: "USD" } }],
        },
      ],
    };
    const parsed = parseInventory(body, "x");
    assert.equal(parsed.length, 1);
    assert.equal(parsed[0].quantity, 0);
  });

  it("prices the listing at its lowest in-stock variation, else the lowest overall", () => {
    const v = (priceCents: number, quantity: number) => ({ productId: priceCents, options: {}, priceCents, quantity });
    assert.equal(livePrice([v(3000, 0), v(3600, 2), v(4000, 1)], 1), 3600);
    assert.equal(livePrice([v(3000, 0), v(3600, 0)], 1), 3000);
    assert.equal(livePrice([], 1234), 1234);
  });
});
