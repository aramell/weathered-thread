/**
 * check-catalog — verifies every `content/catalog/{slug}/` directory follows the
 * synced.ts + authored.ts + index.ts convention (Epic 2, Story 2.2). Run with
 * `npm run check:catalog`; it is never part of `next build`.
 *
 * It dynamic-imports each listing's modules, so the merge is proven, not just
 * the presence of files. It only reads; it never writes into the catalog.
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
  /** Directories that passed every check. */
  ok: string[];
  /** One line per problem, each naming the directory. */
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

async function checkListing(catalogDir: string, slug: string): Promise<string[]> {
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
    return problems;
  }

  const [synced, authored, listing] = await Promise.all([
    loadExport(path.join(dir, "synced.ts"), "synced"),
    loadExport(path.join(dir, "authored.ts"), "authored"),
    loadExport(path.join(dir, "index.ts"), "listing"),
  ]);
  for (const result of [synced, authored, listing]) {
    if (typeof result === "string") problems.push(result);
  }
  if (typeof synced === "string" || typeof authored === "string") return problems;

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
  return problems;
}

export async function checkCatalog(catalogDir: string): Promise<CatalogReport> {
  const report: CatalogReport = { ok: [], problems: [] };
  const entries = await fs.readdir(catalogDir, { withFileTypes: true });
  const slugs = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const slug of slugs) {
    const problems = await checkListing(catalogDir, slug);
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
