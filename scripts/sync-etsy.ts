/**
 * sync-etsy — manually-run catalog sync (Epic 2, Story 2.1).
 *
 * Reads the human-owned manifest `content/catalog/listings.json`
 * (motif slug -> Etsy listing_id), fetches each listing (`getListing`) and its
 * per-variation inventory (`getListingInventory`, OAuth `listings_r`) from Etsy
 * Open API v3, and writes `content/catalog/{slug}/synced.ts`. Run with
 * `npm run sync:etsy`; it is never part of `next build` and the site never
 * calls Etsy at build or request time.
 *
 * OAuth: run `npm run auth:etsy` once to store ETSY_REFRESH_TOKEN in .env.local.
 * Each sync exchanges it for a short-lived access token and persists the rotated
 * refresh token (even if the sync later fails) so the next run still works.
 *
 * All-or-nothing: any failure aborts before a single file is written. The
 * script fully owns `synced.ts` and never creates, reads or writes
 * `authored.ts` or `index.ts`, and never deletes anything.
 */
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";

import { clientIdFromApiKey, OAuthError, refreshAccessToken, upsertEnvVar } from "./etsy-oauth";

const execFileAsync = promisify(execFile);

const API_BASE = "https://openapi.etsy.com/v3/application";
const SLUG_PATTERN = /^[a-z0-9-]+$/;
const REQUEST_TIMEOUT_MS = 30_000;

export class SyncError extends Error {}

/** One purchasable style/color/size combination from the listing's inventory. */
export type SyncedVariation = {
  productId: number;
  /** Etsy property name -> chosen value, e.g. `{ "Size": "M", "Primary color": "Sage" }`. */
  options: Readonly<Record<string, string>>;
  priceCents: number;
  /** 0 when the offering is disabled. */
  quantity: number;
};

export type SyncedListing = {
  listingId: number;
  name: string;
  url: string;
  state: string;
  priceCents: number;
  quantity: number;
  variations: readonly SyncedVariation[];
};

export type SyncDeps = {
  /** `<keystring>:<shared_secret>`; undefined/blank fails before any call. */
  apiKey: string | undefined;
  /** From `npm run auth:etsy`; undefined/blank fails before any call. */
  refreshToken: string | undefined;
  /** Persist a rotated refresh token (called as soon as Etsy returns one). */
  saveRefreshToken: (token: string) => Promise<void>;
  fetch: typeof fetch;
  /** Repo root; `content/catalog/` is resolved beneath it. */
  repoRoot: string;
  /** Text of a file at `main`'s tip, or null when `main`/the file is unresolvable. */
  readMainFile: (repoRelativePath: string) => Promise<string | null>;
  log: (line: string) => void;
  warn: (line: string) => void;
};

export type SyncResult = { written: string[]; warnings: string[] };

type Manifest = { slug: string; listingId: number }[];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function expectRecord(value: unknown, what: string): Record<string, unknown> {
  if (!isRecord(value)) throw new SyncError(`${what}: malformed response (expected an object)`);
  return value;
}

function expectString(value: unknown, what: string): string {
  if (typeof value !== "string") throw new SyncError(`${what}: malformed response (expected a string)`);
  return value;
}

function expectCount(value: unknown, what: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new SyncError(`${what}: malformed response (expected a non-negative integer)`);
  }
  return value;
}

// Etsy returns listing titles HTML-escaped (e.g. `&quot;`); decode
// once so downstream React renders the real characters.
const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1].toLowerCase() === "x" ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : match;
    }
    return NAMED_ENTITIES[body.toLowerCase()] ?? match;
  });
}

/** Etsy `{amount, divisor, currency_code}` -> integer USD cents. */
function moneyToCents(value: unknown, what: string): number {
  const money = expectRecord(value, `${what} price`);
  const { amount, divisor, currency_code: currency } = money;
  if (currency !== "USD") {
    throw new SyncError(`${what}: unsupported currency ${JSON.stringify(currency)} (USD only)`);
  }
  if (typeof amount !== "number" || !Number.isInteger(amount) || amount < 0) {
    throw new SyncError(`${what}: malformed price amount`);
  }
  if (typeof divisor !== "number" || !Number.isInteger(divisor) || divisor <= 0) {
    throw new SyncError(`${what}: malformed price divisor`);
  }
  if ((amount * 100) % divisor !== 0) {
    throw new SyncError(`${what}: price ${amount}/${divisor} is not a whole number of cents`);
  }
  return (amount * 100) / divisor;
}

/** A returned listing URL must be https on etsy.com or a subdomain. */
function assertEtsyUrl(url: string, slug: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new SyncError(`listing "${slug}": returned url is not a valid URL: ${url}`);
  }
  const host = parsed.hostname.toLowerCase();
  if (parsed.protocol !== "https:" || (host !== "etsy.com" && !host.endsWith(".etsy.com"))) {
    throw new SyncError(`listing "${slug}": returned url is not https on etsy.com: ${url}`);
  }
}

async function readManifest(catalogDir: string): Promise<Manifest> {
  const manifestPath = path.join(catalogDir, "listings.json");
  let raw: string;
  try {
    raw = await fs.readFile(manifestPath, "utf8");
  } catch {
    throw new SyncError(`manifest not found: content/catalog/listings.json (map each motif slug to its Etsy listing_id)`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SyncError("manifest content/catalog/listings.json is not valid JSON");
  }
  if (!isRecord(parsed)) {
    throw new SyncError('manifest content/catalog/listings.json must be an object like {"pickleball": 4012345678}');
  }
  const entries = Object.entries(parsed);
  if (entries.length === 0) {
    throw new SyncError("manifest content/catalog/listings.json is empty: add at least one slug -> listing_id");
  }
  return entries.map(([slug, listingId]) => {
    if (!SLUG_PATTERN.test(slug)) {
      throw new SyncError(`manifest slug "${slug}" is invalid (must match ${SLUG_PATTERN})`);
    }
    if (typeof listingId !== "number" || !Number.isSafeInteger(listingId) || listingId <= 0) {
      throw new SyncError(`manifest slug "${slug}": listing_id must be a positive integer`);
    }
    return { slug, listingId };
  });
}

async function etsyGet(
  deps: SyncDeps,
  apiKey: string,
  apiPath: string,
  what: string,
  accessToken?: string,
): Promise<unknown> {
  let response: Response;
  try {
    response = await deps.fetch(`${API_BASE}${apiPath}`, {
      headers: {
        "x-api-key": apiKey,
        accept: "application/json",
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    throw new SyncError(`${what}: network error: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!response.ok) {
    const hint =
      response.status === 401 || response.status === 403
        ? " (key or access token rejected, or the app is not approved for this endpoint)"
        : response.status === 429
          ? " (rate limited)"
          : response.status === 404
            ? " (not found)"
            : "";
    const detail = (await response.text().catch(() => "")).slice(0, 200).trim();
    throw new SyncError(`${what}: HTTP ${response.status}${hint}${detail ? ` — ${detail}` : ""}`);
  }
  try {
    return await response.json();
  } catch {
    throw new SyncError(`${what}: response was not valid JSON`);
  }
}

async function fetchVariations(
  deps: SyncDeps,
  apiKey: string,
  accessToken: string,
  slug: string,
  listingId: number,
): Promise<SyncedVariation[]> {
  const what = `listing "${slug}" (${listingId}) GET /listings/${listingId}/inventory`;
  const inventory = expectRecord(
    await etsyGet(deps, apiKey, `/listings/${listingId}/inventory`, what, accessToken),
    what,
  );
  if (!Array.isArray(inventory.products)) throw new SyncError(`${what}: malformed response (expected products[])`);

  const variations: SyncedVariation[] = [];
  for (const raw of inventory.products) {
    const product = expectRecord(raw, `${what} product`);
    if (product.is_deleted === true) continue;
    const productId = expectCount(product.product_id, `${what} product_id`);
    const offerings = Array.isArray(product.offerings) ? product.offerings : [];
    const offering = offerings
      .map((entry) => expectRecord(entry, `${what} product ${productId} offering`))
      .find((entry) => entry.is_deleted !== true);
    if (!offering) continue;

    const options: Record<string, string> = {};
    for (const rawValue of Array.isArray(product.property_values) ? product.property_values : []) {
      const property = expectRecord(rawValue, `${what} product ${productId} property`);
      const values = Array.isArray(property.values) ? property.values.filter((v): v is string => typeof v === "string") : [];
      const name =
        typeof property.property_name === "string" && property.property_name
          ? property.property_name
          : `property ${String(property.property_id)}`;
      options[name] = values.join(", ");
    }
    variations.push({
      productId,
      options,
      priceCents: moneyToCents(offering.price, `${what} product ${productId}`),
      quantity: offering.is_enabled === false ? 0 : expectCount(offering.quantity, `${what} product ${productId} quantity`),
    });
  }
  return variations;
}

async function fetchListing(
  deps: SyncDeps,
  apiKey: string,
  accessToken: string,
  slug: string,
  listingId: number,
): Promise<SyncedListing> {
  const listingWhat = `listing "${slug}" (${listingId}) GET /listings/${listingId}`;
  const listing = expectRecord(await etsyGet(deps, apiKey, `/listings/${listingId}`, listingWhat), listingWhat);
  if (listing.listing_id !== listingId) {
    throw new SyncError(`${listingWhat}: response listing_id ${String(listing.listing_id)} does not match`);
  }
  const url = expectString(listing.url, `${listingWhat} url`);
  assertEtsyUrl(url, slug);

  return {
    listingId,
    name: decodeEntities(expectString(listing.title, `${listingWhat} title`)),
    url,
    state: expectString(listing.state, `${listingWhat} state`),
    priceCents: moneyToCents(listing.price, listingWhat),
    quantity: expectCount(listing.quantity, `${listingWhat} quantity`),
    variations: await fetchVariations(deps, apiKey, accessToken, slug, listingId),
  };
}

export function renderSynced(listing: SyncedListing): string {
  return [
    "// Generated by scripts/sync-etsy.ts — do not edit. Overwritten on every sync.",
    "// Human-authored content belongs in authored.ts.",
    "",
    `export const synced = ${JSON.stringify(listing, null, 2)} as const;`,
    "",
  ].join("\n");
}

/** Listing price (cents) from a previously-generated synced.ts, or null if unparseable. */
function parseSyncedPrice(text: string): number | null {
  const match = /export const synced = (\{[\s\S]*\}) as const;\s*$/.exec(text);
  if (!match) return null;
  try {
    const parsed: unknown = JSON.parse(match[1]);
    return isRecord(parsed) && typeof parsed.priceCents === "number" ? parsed.priceCents : null;
  } catch {
    return null;
  }
}

const money = (cents: number) => `$${(cents / 100).toFixed(2)}`;

async function checkRegression(
  deps: SyncDeps,
  slug: string,
  listing: SyncedListing,
  warnings: string[],
  notes: string[],
): Promise<void> {
  const relPath = `content/catalog/${slug}/synced.ts`;
  const previousText = await deps.readMainFile(relPath);
  if (previousText === null) {
    notes.push(`regression check skipped for "${slug}": no ${relPath} on main`);
    return;
  }
  const previous = parseSyncedPrice(previousText);
  if (previous === null) {
    notes.push(`regression check skipped for "${slug}": main's ${relPath} could not be parsed`);
    return;
  }
  if (listing.priceCents < previous) {
    warnings.push(
      `price regression: listing "${slug}" would drop ${money(previous)} -> ${money(listing.priceCents)} vs main (written anyway; review before committing)`,
    );
  }
}

async function findOrphans(catalogDir: string, slugs: Set<string>): Promise<string[]> {
  const entries = await fs.readdir(catalogDir, { withFileTypes: true }).catch(() => []);
  const orphans: string[] = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || slugs.has(entry.name)) continue;
    const hasSynced = await fs
      .stat(path.join(catalogDir, entry.name, "synced.ts"))
      .then(() => true)
      .catch(() => false);
    if (hasSynced) orphans.push(entry.name);
  }
  return orphans.sort();
}

/** Write every file to a temp name first, then rename, so a write error leaves no synced.ts changed. */
async function writeAll(files: { target: string; content: string }[]): Promise<void> {
  const staged: { tmp: string; target: string }[] = [];
  try {
    for (const { target, content } of files) {
      await fs.mkdir(path.dirname(target), { recursive: true });
      const tmp = `${target}.tmp-${process.pid}`;
      await fs.writeFile(tmp, content, "utf8");
      staged.push({ tmp, target });
    }
  } catch (error) {
    await Promise.all(staged.map(({ tmp }) => fs.rm(tmp, { force: true })));
    throw new SyncError(`could not stage files, nothing written: ${error instanceof Error ? error.message : String(error)}`);
  }
  for (const { tmp, target } of staged) await fs.rename(tmp, target);
}

export async function runSync(deps: SyncDeps): Promise<SyncResult> {
  const apiKey = deps.apiKey?.trim();
  if (!apiKey) {
    throw new SyncError("ETSY_API_KEY is not set. Put `<keystring>:<shared_secret>` in .env.local and re-run.");
  }

  const refreshToken = deps.refreshToken?.trim();
  if (!refreshToken) {
    throw new SyncError("ETSY_REFRESH_TOKEN is not set. Run `npm run auth:etsy` once to authorize, then re-run.");
  }

  const catalogDir = path.join(deps.repoRoot, "content", "catalog");
  const manifest = await readManifest(catalogDir);

  let accessToken: string;
  try {
    const tokens = await refreshAccessToken(deps.fetch, { clientId: clientIdFromApiKey(apiKey), refreshToken });
    accessToken = tokens.accessToken;
    if (tokens.refreshToken !== refreshToken) await deps.saveRefreshToken(tokens.refreshToken);
  } catch (error) {
    throw new SyncError(
      error instanceof OAuthError ? error.message : `token refresh failed: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const listings: { slug: string; listing: SyncedListing }[] = [];
  for (const { slug, listingId } of manifest) {
    deps.log(`fetching ${slug} (${listingId})…`);
    listings.push({ slug, listing: await fetchListing(deps, apiKey, accessToken, slug, listingId) });
  }

  const warnings: string[] = [];
  const notes: string[] = [];
  for (const { slug, listing } of listings) {
    if (listing.state !== "active") {
      warnings.push(`listing "${slug}" (${listing.listingId}) is not active (state: ${listing.state}); written with its state recorded`);
    }
    await checkRegression(deps, slug, listing, warnings, notes);
  }
  const orphans = await findOrphans(catalogDir, new Set(manifest.map(({ slug }) => slug)));
  if (orphans.length > 0) {
    warnings.push(`previously-synced listings not in this run, left untouched: ${orphans.join(", ")}`);
  }

  await writeAll(
    listings.map(({ slug, listing }) => ({
      target: path.join(catalogDir, slug, "synced.ts"),
      content: renderSynced(listing),
    })),
  );

  const written = listings.map(({ slug }) => `content/catalog/${slug}/synced.ts`);
  for (const note of notes) deps.log(`note: ${note}`);
  for (const warning of warnings) deps.warn(`warning: ${warning}`);
  deps.log(`wrote ${written.length} file${written.length === 1 ? "" : "s"}:`);
  for (const file of written) deps.log(`  ${file}`);
  return { written, warnings };
}

async function readMainFileFromGit(repoRelativePath: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync("git", ["show", `main:${repoRelativePath}`], {
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout;
  } catch {
    return null;
  }
}

async function main(): Promise<void> {
  try {
    await runSync({
      apiKey: process.env.ETSY_API_KEY,
      refreshToken: process.env.ETSY_REFRESH_TOKEN,
      saveRefreshToken: (token) => upsertEnvVar(path.join(process.cwd(), ".env.local"), "ETSY_REFRESH_TOKEN", token),
      fetch,
      repoRoot: process.cwd(),
      readMainFile: readMainFileFromGit,
      log: (line) => console.log(line),
      warn: (line) => console.warn(line),
    });
  } catch (error) {
    console.error(`sync-etsy: ${error instanceof Error ? error.message : String(error)}`);
    console.error("sync-etsy: nothing was written.");
    process.exit(1);
  }
}

if (path.basename(process.argv[1] ?? "") === "sync-etsy.ts") {
  void main();
}
