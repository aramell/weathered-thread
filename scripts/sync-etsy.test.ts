/**
 * Exercises scripts/sync-etsy.ts against stubbed Etsy responses and a temp
 * repo root — one test per row of the story's I/O & Edge-Case Matrix, run
 * with `npm run test:sync` (built-in node:test, no framework installed).
 */
import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";

import { renderSynced, runSync, SyncError, type SyncDeps, type SyncedListing } from "./sync-etsy";

const KEY = "abcdefghijklmnopqrstuvwx:0123456789";

type Stub = { status?: number; body?: unknown } | Error;

function listingBody(id: number, overrides: Record<string, unknown> = {}) {
  return {
    listing_id: id,
    title: "Pickleball &quot;Dink&quot; Tee",
    url: `https://www.etsy.com/listing/${id}/pickleball`,
    state: "active",
    price: { amount: 3200, divisor: 100, currency_code: "USD" },
    quantity: 12,
    created_timestamp: 1793060986,
    ...overrides,
  };
}

let root: string;
let calls: { url: string; key: string | null }[];
let stubs: Map<string, Stub>;
let mainFiles: Map<string, string>;
let warnings: string[];
let logs: string[];
let saved: string[];
let tokenCalls: string[];
let tokenStub: Stub;

function inventoryBody() {
  const product = (id: number, size: string, cents: number, quantity: number, extra: Record<string, unknown> = {}) => ({
    product_id: id,
    is_deleted: false,
    property_values: [
      { property_id: 100, property_name: "Primary color", values: ["Sage"] },
      { property_id: 62809790453, property_name: "Size", values: [size] },
    ],
    offerings: [{ offering_id: id * 10, quantity, is_enabled: true, is_deleted: false, price: { amount: cents, divisor: 100, currency_code: "USD" } }],
    ...extra,
  });
  return {
    products: [
      product(1, "S", 3200, 5),
      product(2, "M", 3400, 0, { offerings: [{ offering_id: 20, quantity: 9, is_enabled: false, is_deleted: false, price: { amount: 3400, divisor: 100, currency_code: "USD" } }] }),
      product(3, "L", 3600, 7, { is_deleted: true }),
    ],
  };
}

function imagesBody() {
  const image = (id: number, rank: number, extra: Record<string, unknown> = {}) => ({
    listing_image_id: id,
    rank,
    url_570xN: `https://i.etsystatic.com/1/r/il/a/${id}/il_570xN.${id}.jpg`,
    url_fullxfull: `https://i.etsystatic.com/1/r/il/a/${id}/il_fullxfull.${id}.jpg`,
    full_width: 2250,
    full_height: 3000,
    alt_text: null,
    ...extra,
  });
  // Deliberately out of rank order: the sync must sort.
  return { count: 2, results: [image(20, 2, { alt_text: "Back &amp; side" }), image(10, 1)] };
}

function deps(overrides: Partial<SyncDeps> = {}): SyncDeps {
  return {
    apiKey: KEY,
    refreshToken: "rt-old",
    saveRefreshToken: async (token) => {
      saved.push(token);
    },
    repoRoot: root,
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url === "https://api.etsy.com/v3/public/oauth/token") {
        calls.push({ url, key: null });
        tokenCalls.push(String(init?.body));
        if (tokenStub instanceof Error) throw tokenStub;
        const body = tokenStub.body ?? { access_token: "at-1", refresh_token: "rt-old" };
        return new Response(JSON.stringify(body), { status: tokenStub.status ?? 200 });
      }
      calls.push({ url, key: new Headers(init?.headers).get("x-api-key") });
      const stub = stubs.get(url.replace("https://openapi.etsy.com/v3/application", ""));
      if (stub === undefined) return new Response("not stubbed", { status: 404 });
      if (stub instanceof Error) throw stub;
      const body = stub.body;
      return new Response(typeof body === "string" ? body : JSON.stringify(body ?? {}), { status: stub.status ?? 200 });
    }) as typeof fetch,
    readMainFile: async (rel) => mainFiles.get(rel) ?? null,
    log: (line) => logs.push(line),
    warn: (line) => warnings.push(line),
    ...overrides,
  };
}

function stubListing(id: number, overrides: Record<string, unknown> = {}) {
  stubs.set(`/listings/${id}`, { body: listingBody(id, overrides) });
  stubs.set(`/listings/${id}/inventory`, { body: inventoryBody() });
  stubs.set(`/listings/${id}/images`, { body: imagesBody() });
}

async function writeManifest(manifest: unknown) {
  await fs.mkdir(path.join(root, "content", "catalog"), { recursive: true });
  await fs.writeFile(path.join(root, "content", "catalog", "listings.json"), JSON.stringify(manifest));
}

const syncedPath = (slug: string) => path.join(root, "content", "catalog", slug, "synced.ts");
const exists = (p: string) => fs.stat(p).then(() => true, () => false);

async function listWrittenFiles(): Promise<string[]> {
  const out: string[] = [];
  const walk = async (dir: string) => {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else out.push(path.relative(root, full));
    }
  };
  await walk(path.join(root, "content"));
  return out.sort();
}

async function assertRejects(promise: Promise<unknown>, pattern: RegExp) {
  await assert.rejects(promise, (error: unknown) => {
    assert.ok(error instanceof SyncError, `expected SyncError, got ${String(error)}`);
    assert.match(error.message, pattern);
    assert.ok(!error.message.includes(KEY), "error must never contain the API key");
    return true;
  });
}

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sync-etsy-"));
  calls = [];
  stubs = new Map();
  mainFiles = new Map();
  warnings = [];
  logs = [];
  saved = [];
  tokenCalls = [];
  tokenStub = {};
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

describe("happy path", () => {
  it("writes one synced.ts per listing with cents prices, sends the key, and leaves authored.ts alone", async () => {
    await writeManifest({ pickleball: 111, "beach-day": 222 });
    stubListing(111);
    stubListing(222);
    const authored = path.join(root, "content", "catalog", "pickleball", "authored.ts");
    await fs.mkdir(path.dirname(authored), { recursive: true });
    await fs.writeFile(authored, "// human-edited\n");

    const result = await runSync(deps());

    assert.deepEqual(result.written, ["content/catalog/pickleball/synced.ts", "content/catalog/beach-day/synced.ts"]);
    const apiCalls = calls.filter((c) => c.key !== null);
    assert.equal(apiCalls.length, 6, "listing + inventory + images per listing");
    assert.ok(apiCalls.every((c) => c.key === KEY));
    assert.equal(tokenCalls.length, 1);
    assert.equal(await fs.readFile(authored, "utf8"), "// human-edited\n");
    assert.deepEqual(await listWrittenFiles(), [
      "content/catalog/beach-day/synced.ts",
      "content/catalog/listings.json",
      "content/catalog/pickleball/authored.ts",
      "content/catalog/pickleball/synced.ts",
    ]);

    const text = await fs.readFile(syncedPath("pickleball"), "utf8");
    const json = text.match(/export const synced = (\{[\s\S]*\}) as const;/)?.[1];
    const synced = JSON.parse(json ?? "null") as SyncedListing;
    assert.equal(synced.name, 'Pickleball "Dink" Tee');
    assert.equal(synced.url, "https://www.etsy.com/listing/111/pickleball");
    assert.equal(synced.priceCents, 3200);
    assert.equal(synced.quantity, 12);
    assert.equal(synced.createdTimestamp, 1793060986);
    assert.equal(synced.state, "active");
    assert.deepEqual(synced.variations, [
      { productId: 1, options: { "Primary color": "Sage", Size: "S" }, priceCents: 3200, quantity: 5 },
      { productId: 2, options: { "Primary color": "Sage", Size: "M" }, priceCents: 3400, quantity: 0 },
    ]);
    assert.deepEqual(
      synced.images,
      [
        {
          url: "https://i.etsystatic.com/1/r/il/a/10/il_570xN.10.jpg",
          fullUrl: "https://i.etsystatic.com/1/r/il/a/10/il_fullxfull.10.jpg",
          width: 2250,
          height: 3000,
          alt: "",
        },
        {
          url: "https://i.etsystatic.com/1/r/il/a/20/il_570xN.20.jpg",
          fullUrl: "https://i.etsystatic.com/1/r/il/a/20/il_fullxfull.20.jpg",
          width: 2250,
          height: 3000,
          alt: "Back & side",
        },
      ],
      "photos are rank-ordered and alt text is entity-decoded",
    );
    assert.equal(text, renderSynced(synced), "output is deterministic");
  });
});

describe("failure rows write nothing", () => {
  it("missing key: no API calls, no files", async () => {
    await writeManifest({ pickleball: 111 });
    for (const apiKey of [undefined, "", "   "]) {
      await assertRejects(runSync(deps({ apiKey })), /ETSY_API_KEY is not set/);
    }
    assert.equal(calls.length, 0);
    assert.equal(await exists(syncedPath("pickleball")), false);
  });

  it("API failure (401, 403, 429, 500, network, malformed) on any listing aborts the whole run", async () => {
    await writeManifest({ pickleball: 111, "beach-day": 222 });
    const cases: [Stub, RegExp][] = [
      [{ status: 401, body: { error: "bad key" } }, /HTTP 401/],
      [{ status: 403 }, /HTTP 403.*rejected/],
      [{ status: 429 }, /HTTP 429.*rate limited/],
      [{ status: 500 }, /HTTP 500/],
      [new TypeError("fetch failed"), /network error: fetch failed/],
      [{ body: "<html>not json" }, /not valid JSON/],
      [{ body: { listing_id: 222 } }, /malformed response/],
    ];
    for (const [stub, pattern] of cases) {
      stubs = new Map();
      calls = [];
      stubListing(111);
      stubs.set("/listings/222", stub);
      await assertRejects(runSync(deps()), pattern);
      assert.equal(await exists(syncedPath("pickleball")), false, "first listing must not be written");
      assert.equal(await exists(syncedPath("beach-day")), false);
    }
  });

  it("bad URL host: names the listing and URL", async () => {
    await writeManifest({ pickleball: 111, "beach-day": 222 });
    for (const url of [
      "https://evil.example.com/listing/222",
      "https://etsy.com.evil.example/listing/222",
      "https://notetsy.com/listing/222",
      "http://www.etsy.com/listing/222",
      "not a url",
    ]) {
      stubs = new Map();
      stubListing(111);
      stubListing(222, { url });
      await assertRejects(runSync(deps()), new RegExp(`listing "beach-day".*${url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
      assert.equal(await exists(syncedPath("pickleball")), false);
    }
  });

  it("accepts etsy.com and any subdomain over https", async () => {
    await writeManifest({ pickleball: 111 });
    for (const url of ["https://etsy.com/listing/111", "https://www.etsy.com/listing/111", "https://shop.etsy.com/listing/111"]) {
      stubListing(111, { url });
      await runSync(deps());
    }
  });

  it("missing listing (404) names the listing", async () => {
    await writeManifest({ pickleball: 111, "beach-day": 222 });
    stubListing(111);
    stubs.set("/listings/222", { status: 404, body: { error: "not found" } });
    await assertRejects(runSync(deps()), /listing "beach-day" \(222\).*HTTP 404/);
    assert.equal(await exists(syncedPath("pickleball")), false);
  });

  it("non-USD currency fails the run", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111, { price: { amount: 3200, divisor: 100, currency_code: "CAD" } });
    await assertRejects(runSync(deps()), /unsupported currency "CAD"/);
    assert.equal(await exists(syncedPath("pickleball")), false);
  });

  it("bad manifest: no API calls, no files", async () => {
    const cases: [() => Promise<void>, RegExp][] = [
      [async () => {}, /manifest not found/],
      [async () => fs.writeFile(path.join(root, "content", "catalog", "listings.json"), "{nope"), /not valid JSON/],
      [() => writeManifest({}), /is empty/],
      [() => writeManifest([111]), /must be an object/],
      [() => writeManifest({ Pickleball: 111 }), /slug "Pickleball" is invalid/],
      [() => writeManifest({ "../escape": 111 }), /slug "..\/escape" is invalid/],
      [() => writeManifest({ pickleball: "111" }), /listing_id must be a positive integer/],
    ];
    await fs.mkdir(path.join(root, "content", "catalog"), { recursive: true });
    for (const [setup, pattern] of cases) {
      await setup();
      await assertRejects(runSync(deps()), pattern);
    }
    assert.equal(calls.length, 0);
    assert.equal(await exists(syncedPath("pickleball")), false);
  });
});

describe("OAuth", () => {
  it("missing refresh token: no calls, points at auth:etsy", async () => {
    await writeManifest({ pickleball: 111 });
    for (const refreshToken of [undefined, "", "  "]) {
      await assertRejects(runSync(deps({ refreshToken })), /ETSY_REFRESH_TOKEN is not set.*auth:etsy/);
    }
    assert.equal(calls.length, 0);
  });

  it("refreshes with the keystring as client_id, sends the bearer token, and persists a rotated refresh token", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111);
    tokenStub = { body: { access_token: "at-new", refresh_token: "rt-new" } };
    let auth: string | null = null;
    const base = deps();
    await runSync({
      ...base,
      fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input).endsWith("/inventory")) auth = new Headers(init?.headers).get("authorization");
        return base.fetch(input, init);
      }) as typeof fetch,
    });
    const form = new URLSearchParams(tokenCalls[0]);
    assert.equal(form.get("grant_type"), "refresh_token");
    assert.equal(form.get("client_id"), KEY.split(":")[0]);
    assert.equal(form.get("refresh_token"), "rt-old");
    assert.equal(auth, "Bearer at-new");
    assert.deepEqual(saved, ["rt-new"]);
  });

  it("unchanged refresh token is not re-saved", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111);
    await runSync(deps());
    assert.deepEqual(saved, []);
  });

  it("rotated token is saved even when a later listing fails, and nothing is written", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111);
    stubs.set("/listings/111/inventory", { status: 500 });
    tokenStub = { body: { access_token: "at-new", refresh_token: "rt-new" } };
    await assertRejects(runSync(deps()), /inventory: HTTP 500/);
    assert.deepEqual(saved, ["rt-new"]);
    assert.equal(await exists(syncedPath("pickleball")), false);
  });

  it("token endpoint failures abort with no files and never echo tokens", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111);
    for (const [stub, pattern] of [
      [{ status: 400, body: { error: "invalid_grant" } }, /token refresh: HTTP 400.*auth:etsy/],
      [new TypeError("fetch failed"), /token refresh: network error/],
      [{ body: { access_token: "x" } }, /malformed token response/],
    ] as [Stub, RegExp][]) {
      tokenStub = stub;
      await assertRejects(runSync(deps()), pattern);
    }
    assert.equal(await exists(syncedPath("pickleball")), false);
  });

  it("inventory 401 and malformed inventory abort the run", async () => {
    await writeManifest({ pickleball: 111 });
    for (const [stub, pattern] of [
      [{ status: 401 }, /inventory: HTTP 401/],
      [{ body: {} }, /expected products/],
    ] as [Stub, RegExp][]) {
      stubListing(111);
      stubs.set("/listings/111/inventory", stub);
      await assertRejects(runSync(deps()), pattern);
    }
    assert.equal(await exists(syncedPath("pickleball")), false);
  });
});

describe("image failures write nothing", () => {
  it("HTTP errors, malformed bodies and non-Etsy image hosts abort the run", async () => {
    await writeManifest({ pickleball: 111 });
    const evil = imagesBody();
    evil.results[0].url_570xN = "https://evil.example.com/x.jpg";
    for (const [stub, pattern] of [
      [{ status: 500 }, /images: HTTP 500/],
      [{ body: {} }, /expected results/],
      [{ body: evil }, /not https on etsystatic\.com/],
    ] as [Stub, RegExp][]) {
      stubListing(111);
      stubs.set("/listings/111/images", stub);
      await assertRejects(runSync(deps()), pattern);
    }
    assert.equal(await exists(syncedPath("pickleball")), false);
  });
});

describe("warning rows still write", () => {
  it("inactive listing: written with state recorded, warning printed", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111, { state: "sold_out" });
    const result = await runSync(deps());
    assert.match(await fs.readFile(syncedPath("pickleball"), "utf8"), /"state": "sold_out"/);
    assert.equal(result.warnings.length, 1);
    assert.match(warnings[0], /listing "pickleball".*not active.*sold_out/);
  });

  it("price regression vs main: warns with old and new price, still writes, run succeeds", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111, { price: { amount: 2500, divisor: 100, currency_code: "USD" } });
    mainFiles.set(
      "content/catalog/pickleball/synced.ts",
      renderSynced({ listingId: 111, name: "x", url: "https://www.etsy.com/listing/111", state: "active", priceCents: 3200, quantity: 1, createdTimestamp: 1, variations: [], images: [] }),
    );
    await runSync(deps());
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /price regression.*"pickleball".*\$32\.00 -> \$25\.00/);
    assert.match(await fs.readFile(syncedPath("pickleball"), "utf8"), /"priceCents": 2500/);
  });

  it("price increase or unchanged vs main: no warning", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111, { price: { amount: 3600, divisor: 100, currency_code: "USD" } });
    mainFiles.set(
      "content/catalog/pickleball/synced.ts",
      renderSynced({ listingId: 111, name: "x", url: "https://www.etsy.com/listing/111", state: "active", priceCents: 3200, quantity: 1, createdTimestamp: 1, variations: [], images: [] }),
    );
    await runSync(deps());
    assert.deepEqual(warnings, []);
  });

  it("no main ref: regression check skipped with a note, run proceeds", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111);
    const result = await runSync(deps({ readMainFile: async () => null }));
    assert.equal(result.written.length, 1);
    assert.ok(logs.some((line) => /regression check skipped.*"pickleball"/.test(line)));
    assert.deepEqual(warnings, []);
  });

  it("orphaned listing: directory untouched, warning lists it, nothing deleted", async () => {
    await writeManifest({ pickleball: 111 });
    stubListing(111);
    const orphan = syncedPath("old-motif");
    await fs.mkdir(path.dirname(orphan), { recursive: true });
    await fs.writeFile(orphan, "// stale\n");
    await runSync(deps());
    assert.equal(await fs.readFile(orphan, "utf8"), "// stale\n");
    assert.equal(warnings.length, 1);
    assert.match(warnings[0], /not in this run, left untouched: old-motif/);
  });
});

describe("build isolation", () => {
  it("no script reachable from build references sync-etsy", async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    for (const name of ["build", "prebuild", "postbuild"]) {
      assert.ok(!(pkg.scripts[name] ?? "").includes("sync-etsy"), `${name} must not reference sync-etsy`);
    }
    assert.equal(pkg.scripts.build, "next build");
  });
});
