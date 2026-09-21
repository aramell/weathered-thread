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
    ...overrides,
  };
}

let root: string;
let calls: { url: string; key: string | null }[];
let stubs: Map<string, Stub>;
let mainFiles: Map<string, string>;
let warnings: string[];
let logs: string[];

function deps(overrides: Partial<SyncDeps> = {}): SyncDeps {
  return {
    apiKey: KEY,
    repoRoot: root,
    fetch: (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
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
    assert.ok(calls.length === 2 && calls.every((c) => c.key === KEY && !c.url.includes("/inventory")));
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
    assert.equal(synced.state, "active");
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
      [{ status: 403 }, /HTTP 403.*OAuth/],
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
      renderSynced({ listingId: 111, name: "x", url: "https://www.etsy.com/listing/111", state: "active", priceCents: 3200, quantity: 1 }),
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
      renderSynced({ listingId: 111, name: "x", url: "https://www.etsy.com/listing/111", state: "active", priceCents: 3200, quantity: 1 }),
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
