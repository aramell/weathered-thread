/**
 * check-catalog — verifies every `content/catalog/{slug}/` directory follows the
 * synced.ts + authored.ts + index.ts convention (Epic 2, Story 2.2), and that
 * `listings.json`, `registry.ts` and the directories agree on the set of slugs
 * and on each listing (Story 2.4). Run with `npm run check:catalog`; it is never
 * part of `next build`.
 *
 * It dynamic-imports each listing's modules and the registry, so the merge and
 * the registry are proven, not just the presence of files. It only reads; it
 * never writes into the catalog.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";

import type { AuthoredContent } from "../content/catalog/types";

const SLUG_PATTERN = /^[a-z0-9-]+$/;
const FILES = ["synced.ts", "authored.ts", "index.ts"] as const;
// Exhaustive over AuthoredContent: adding or renaming a field there fails tsc until this follows.
const AUTHORED_FIELDS = Object.keys({
  motifName: true,
  story: true,
  collection: true,
} satisfies Record<keyof AuthoredContent, true>) as (keyof AuthoredContent)[];

export type CatalogReport = {
  /**
   * Slugs with no problem reported. When listings.json or registry.ts is unusable, the
   * comparisons that need it are skipped (that file's own problem line is reported separately).
   */
  ok: string[];
  /** One line per problem; per-slug lines start `{slug}: `, file-level lines start with the file name. */
  problems: string[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function exists(file: string): Promise<boolean> {
  return fs.stat(file).then(() => true, () => false);
}

async function loadExport(file: string, name: string): Promise<Record<string, unknown> | string> {
  let mod: Record<string, unknown>;
  try {
    mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
  } catch (error) {
    return `${path.basename(file)} failed to load: ${error instanceof Error ? error.message : String(error)}`;
  }
  const value = mod[name];
  return isRecord(value) ? value : `${path.basename(file)} must export an object named \`${name}\``;
}

/** The manifest's slugs, or one problem line when `listings.json` is unusable. */
async function loadManifest(file: string): Promise<Set<string> | string> {
  let text: string;
  try {
    text = await fs.readFile(file, "utf8");
  } catch (error) {
    return `listings.json could not be read: ${error instanceof Error ? error.message : String(error)}`;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (error) {
    return `listings.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`;
  }
  return isRecord(parsed) ? new Set(Object.keys(parsed)) : "listings.json must be a JSON object mapping slug to Etsy listing id";
}

type ListingCheck = {
  problems: string[];
  /** The directory's `index.ts` `listing`, when it loaded. */
  listing?: Record<string, unknown>;
};

async function checkListing(catalogDir: string, slug: string): Promise<ListingCheck> {
  const problems: string[] = [];
  if (!SLUG_PATTERN.test(slug)) {
    problems.push(`directory name must match ${SLUG_PATTERN} (lowercase letters, digits, hyphens)`);
  }

  const dir = path.join(catalogDir, slug);
  const missing: string[] = [];
  for (const file of FILES) {
    if (!(await exists(path.join(dir, file)))) missing.push(file);
  }
  if (missing.length > 0) {
    const notAuthored = missing.includes("authored.ts")
      ? " (a synced listing still needs authored.ts and index.ts)"
      : "";
    problems.push(`missing ${missing.join(", ")}${notAuthored}`);
    return { problems };
  }

  const [synced, authored, listing] = await Promise.all([
    loadExport(path.join(dir, "synced.ts"), "synced"),
    loadExport(path.join(dir, "authored.ts"), "authored"),
    loadExport(path.join(dir, "index.ts"), "listing"),
  ]);
  for (const result of [synced, authored, listing]) {
    if (typeof result === "string") problems.push(result);
  }
  const loaded = typeof listing === "string" ? undefined : listing;
  if (typeof synced === "string" || typeof authored === "string") return { problems, listing: loaded };

  for (const field of AUTHORED_FIELDS) {
    const value = authored[field];
    if (typeof value !== "string" || value.trim() === "") {
      problems.push(`authored.ts field \`${field}\` must be a non-empty string`);
    }
  }
  if (typeof authored.collection === "string" && authored.collection.trim() !== "" && !SLUG_PATTERN.test(authored.collection)) {
    problems.push(`authored.ts field \`collection\` must be a collection slug matching ${SLUG_PATTERN}, got "${authored.collection}"`);
  }

  const shared = Object.keys(authored).filter((key) => key in synced);
  for (const key of shared) {
    problems.push(`authored.ts field \`${key}\` collides with a synced.ts field of the same name`);
  }

  if (typeof listing !== "string" && shared.length === 0 && !isDeepStrictEqual(listing, { ...synced, ...authored })) {
    problems.push("index.ts `listing` must equal { ...synced, ...authored } — every synced and authored field, unchanged");
  }
  return { problems, listing: loaded };
}

export async function checkCatalog(catalogDir: string): Promise<CatalogReport> {
  const report: CatalogReport = { ok: [], problems: [] };
  const entries = await fs.readdir(catalogDir, { withFileTypes: true });
  const directories = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);

  const [manifestResult, registryResult] = await Promise.all([
    loadManifest(path.join(catalogDir, "listings.json")),
    loadExport(path.join(catalogDir, "registry.ts"), "registry"),
  ]);
  // A file that cannot be used is one problem; the comparisons that need it are skipped.
  const manifest = typeof manifestResult === "string" ? null : manifestResult;
  const registry = typeof registryResult === "string" ? null : registryResult;
  for (const result of [manifestResult, registryResult]) {
    if (typeof result === "string") report.problems.push(result);
  }
  const registryKeys = registry ? new Set(Object.keys(registry)) : null;
  const directorySet = new Set(directories);

  const slugs = [...new Set([...directories, ...(manifest ?? []), ...(registryKeys ?? [])])].sort();
  for (const slug of slugs) {
    const problems: string[] = [];
    const inDirectory = directorySet.has(slug);
    const inManifest = manifest?.has(slug) ?? false;
    const inRegistry = registryKeys?.has(slug) ?? false;

    let listing: Record<string, unknown> | undefined;
    if (inDirectory) {
      const check = await checkListing(catalogDir, slug);
      problems.push(...check.problems);
      listing = check.listing;
    }

    if (registryKeys && !inRegistry && (inManifest || inDirectory)) {
      problems.push("not in registry.ts, so the site will not show it");
    }
    if (manifest && registryKeys && !inManifest && inRegistry) {
      problems.push("in registry.ts but not in listings.json");
    }
    if (manifest && !inManifest && inDirectory) {
      problems.push("directory has no slug in listings.json");
    }
    if (!inDirectory && (inManifest || inRegistry)) {
      problems.push("has no directory (not yet synced, or a stale entry in listings.json or registry.ts)");
    }
    if (registry && inRegistry && listing !== undefined && !isDeepStrictEqual(registry[slug], listing)) {
      problems.push("registry.ts entry is not the same listing as index.ts `listing`");
    }

    if (problems.length === 0) report.ok.push(slug);
    else report.problems.push(...problems.map((problem) => `${slug}: ${problem}`));
  }
  return report;
}

async function main(): Promise<void> {
  const catalogDir = path.join(process.cwd(), "content", "catalog");
  let report: CatalogReport;
  try {
    report = await checkCatalog(catalogDir);
  } catch (error) {
    const detail = (error as NodeJS.ErrnoException).code === "ENOENT"
      ? `${catalogDir} not found — run from the repo root`
      : error instanceof Error ? error.message : String(error);
    console.error(`check-catalog: ${detail}`);
    process.exitCode = 1;
    return;
  }
  if (report.ok.length === 0 && report.problems.length === 0) {
    console.log("check-catalog: no listings yet");
    return;
  }
  for (const slug of report.ok) console.log(`ok   ${slug}`);
  for (const problem of report.problems) console.error(`FAIL ${problem}`);
  if (report.problems.length > 0) process.exitCode = 1;
}

if (path.basename(process.argv[1] ?? "") === "check-catalog.ts") {
  void main();
}
