/**
 * sync-photos — copy each design's Etsy photos into this site (`npm run sync:photos`).
 *
 * Run it after `npm run sync:etsy`. For every design in `content/catalog/listings.json` (or only
 * the slugs you pass) it downloads the listing's photos from the synced `images` list, scales
 * each to fit 1600px (never enlarging), and writes `public/images/designs/{slug}/NN.jpg` in
 * Etsy's order. It never touches `authored.ts`: alt text is written by a person.
 *
 *   npm run sync:photos                  # every design
 *   npm run sync:photos -- sic-wave      # one design
 *
 * Afterwards it compares the files with the design's `authored.photos`. For a new design it
 * prints a `photos` block to paste into `authored.ts` (fill in each alt); for an existing one it
 * says where Etsy's order, count or crop no longer matches the alt text on file, so you can
 * review those alts. Old files with a higher number than Etsy now has are deleted.
 */
import { mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import sharp from "sharp";

const ROOT = process.cwd();
const MAX_EDGE = 1600;
const QUALITY = 80;

type SyncedImage = { fullUrl: string };
type Photo = { src: string; width: number; height: number; alt: string };

async function loadExport<T>(file: string, name: string): Promise<T | null> {
  try {
    const mod = (await import(pathToFileURL(file).href)) as Record<string, unknown>;
    return (mod[name] ?? (mod.default as Record<string, unknown> | undefined)?.[name] ?? null) as T | null;
  } catch {
    return null;
  }
}

async function download(url: string): Promise<Buffer> {
  const host = new URL(url).hostname;
  if (host !== "i.etsystatic.com") throw new Error(`refusing to download from ${host}`);
  const response = await fetch(url, { signal: AbortSignal.timeout(30_000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

async function syncDesign(slug: string): Promise<void> {
  const dir = path.join(ROOT, "content", "catalog", slug);
  const synced = await loadExport<{ images: SyncedImage[] }>(path.join(dir, "synced.ts"), "synced");
  if (!synced || synced.images.length === 0) throw new Error(`${slug}: no synced images; run npm run sync:etsy first`);

  const outDir = path.join(ROOT, "public", "images", "designs", slug);
  await mkdir(outDir, { recursive: true });

  const written: Photo[] = [];
  for (const [index, image] of synced.images.entries()) {
    const name = `${String(index + 1).padStart(2, "0")}.jpg`;
    const output = await sharp(await download(image.fullUrl))
      .rotate()
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: QUALITY, progressive: true })
      .toBuffer({ resolveWithObject: true });
    await writeFile(path.join(outDir, name), output.data);
    written.push({ src: `/images/designs/${slug}/${name}`, width: output.info.width, height: output.info.height, alt: "" });
  }

  for (const file of await readdir(outDir)) {
    const number = Number(file.match(/^(\d+)\.jpg$/)?.[1]);
    if (number > written.length) await rm(path.join(outDir, file));
  }

  const authored = await loadExport<{ photos?: readonly Photo[] }>(path.join(dir, "authored.ts"), "authored");
  console.log(`${slug}: wrote ${written.length} photos`);
  if (!authored?.photos) {
    console.log(`  new design: paste into authored.ts and fill in every alt:`);
    console.log(JSON.stringify(written, null, 2).replace(/^/gm, "  "));
    return;
  }
  const known = authored.photos;
  if (known.length !== written.length) {
    console.log(`  CHECK: authored.ts lists ${known.length} photos, Etsy now has ${written.length}; review the alt text`);
  }
  written.forEach((photo, index) => {
    const before = known[index];
    if (before && (before.width !== photo.width || before.height !== photo.height)) {
      console.log(`  CHECK: photo ${index + 1} is now ${photo.width}x${photo.height} (was ${before.width}x${before.height}); the alt may no longer match`);
    }
  });
}

async function main(): Promise<void> {
  const manifest = JSON.parse(await readFile(path.join(ROOT, "content", "catalog", "listings.json"), "utf8")) as Record<string, number>;
  const requested = process.argv.slice(2);
  const unknown = requested.filter((slug) => !(slug in manifest));
  if (unknown.length > 0) throw new Error(`not in listings.json: ${unknown.join(", ")}`);
  for (const slug of requested.length > 0 ? requested : Object.keys(manifest)) await syncDesign(slug);
}

if (path.basename(process.argv[1] ?? "") === "sync-photos.ts") {
  main().catch((error) => {
    console.error(`sync-photos: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}
