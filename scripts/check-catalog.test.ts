/**
 * Exercises scripts/check-catalog.ts against temp catalog directories — one test
 * per row of Story 2.2's and Story 2.4's I/O & Edge-Case Matrices, run with
 * `npm run test:catalog`.
 */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, it } from "node:test";
import { promisify } from "node:util";

import { checkCatalog } from "./check-catalog";
import { renderSynced } from "./sync-etsy";

const execFileAsync = promisify(execFile);

// Real sync output, so the checker is tested against what the sync actually writes.
const SYNCED = renderSynced({
  listingId: 111,
  name: "Pickleball Tee",
  url: "https://www.etsy.com/listing/111/pickleball",
  state: "active",
  priceCents: 3200,
  quantity: 12,
  createdTimestamp: 1,
  variations: [],
  images: [],
});

const authoredSource = (fields: Record<string, string> = {}) => {
  const values = { motifName: "Pickleball", story: "The paddle that took over the courts.", collection: "sea-isle", ...fields };
  return `export const authored = ${JSON.stringify(values, null, 2)} as const;\n`;
};

const INDEX = `import { authored } from "./authored";
import { synced } from "./synced";

export const listing = { ...synced, ...authored } as const;
`;

let catalogDir: string;

beforeEach(async () => {
  catalogDir = await fs.mkdtemp(path.join(os.tmpdir(), "check-catalog-"));
});

afterEach(async () => {
  await fs.rm(catalogDir, { recursive: true, force: true });
});

async function writeListing(slug: string, files: Record<string, string | null>) {
  const dir = path.join(catalogDir, slug);
  await fs.mkdir(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    if (content !== null) await fs.writeFile(path.join(dir, name), content);
  }
}

type CatalogFiles = {
  /** Slugs in listings.json; a string is written verbatim, null writes no file. */
  manifest?: string[] | string | null;
  /** registry.ts source; a string is written verbatim, null writes no file. */
  registry?: string[] | string | null;
};

/** A registry.ts that imports each slug's index.ts, as an owner would write it. */
const registrySource = (slugs: string[]) =>
  [
    ...slugs.map((slug, i) => `import { listing as l${i} } from "./${slug}";`),
    `export const registry = { ${slugs.map((slug, i) => `${JSON.stringify(slug)}: l${i}`).join(", ")} };`,
    "",
  ].join("\n");

/** Writes listings.json and registry.ts; both default to `slugs`, so the three agree. */
async function writeCatalog(slugs: string[], { manifest = slugs, registry = slugs }: CatalogFiles = {}) {
  if (manifest !== null) {
    const text = typeof manifest === "string" ? manifest : JSON.stringify(Object.fromEntries(manifest.map((slug) => [slug, 111])));
    await fs.writeFile(path.join(catalogDir, "listings.json"), text);
  }
  if (registry !== null) {
    await fs.writeFile(path.join(catalogDir, "registry.ts"), typeof registry === "string" ? registry : registrySource(registry));
  }
}

// A registry that names slugs without importing their (broken or absent) directories.
const inlineRegistry = (...slugs: string[]) =>
  `export const registry = { ${slugs.map((slug) => `${JSON.stringify(slug)}: {}`).join(", ")} };\n`;

const validFiles = () => ({ "synced.ts": SYNCED, "authored.ts": authoredSource(), "index.ts": INDEX });

describe("check-catalog", () => {
  it("valid listing: reported ok", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog(["pickleball"]);
    assert.deepEqual(await checkCatalog(catalogDir), { ok: ["pickleball"], problems: [] });
  });

  it("empty catalog: no listings, no problems (listings.json and README are not listings)", async () => {
    await writeCatalog([]);
    await fs.writeFile(path.join(catalogDir, "README.md"), "# catalog\n");
    assert.deepEqual(await checkCatalog(catalogDir), { ok: [], problems: [] });
  });

  it("synced, not yet authored: reports the missing authored.ts and index.ts", async () => {
    await writeListing("pickleball", { "synced.ts": SYNCED });
    await writeCatalog(["pickleball"], { registry: inlineRegistry("pickleball") });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^pickleball: missing authored\.ts, index\.ts/);
  });

  it("missing index.ts: reported", async () => {
    await writeListing("pickleball", { ...validFiles(), "index.ts": null });
    await writeCatalog(["pickleball"], { registry: inlineRegistry("pickleball") });
    const { problems } = await checkCatalog(catalogDir);
    assert.deepEqual(problems, ["pickleball: missing index.ts"]);
  });

  it("blank field: names the field", async () => {
    await writeListing("pickleball", { ...validFiles(), "authored.ts": authoredSource({ story: "  " }) });
    await writeCatalog(["pickleball"]);
    const { problems } = await checkCatalog(catalogDir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /pickleball: authored\.ts field `story` must be a non-empty string/);
  });

  it("key collision: names the key", async () => {
    await writeListing("pickleball", {
      ...validFiles(),
      "authored.ts": authoredSource({ name: "Pickleball" }),
    });
    await writeCatalog(["pickleball"]);
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /pickleball: authored\.ts field `name` collides with a synced\.ts field/);
  });

  it("wrong merge: index.ts exporting synced only is reported", async () => {
    await writeListing("pickleball", {
      ...validFiles(),
      "index.ts": `import { synced } from "./synced";\nexport const listing = { ...synced } as const;\n`,
    });
    await writeCatalog(["pickleball"]);
    const { problems } = await checkCatalog(catalogDir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /pickleball: index\.ts `listing` must equal \{ \.\.\.synced, \.\.\.authored \}/);
  });

  it("bad names: a non-slug directory and a non-slug collection are both reported", async () => {
    await writeListing("Sea_Isle", validFiles());
    await writeListing("beach-chair", { ...validFiles(), "authored.ts": authoredSource({ collection: "Sea Isle" }) });
    await writeCatalog(["Sea_Isle", "beach-chair"]);
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.equal(problems.length, 2);
    assert.match(problems.join("\n"), /beach-chair: authored\.ts field `collection` must be a collection slug/);
    assert.match(problems.join("\n"), /Sea_Isle: directory name must match/);
  });
});

describe("check-catalog load failures", () => {
  it("authored.ts that throws on import: one reported problem, no rejection", async () => {
    await writeListing("pickleball", { ...validFiles(), "authored.ts": `throw new Error("typo in the file");\n` });
    await writeCatalog(["pickleball"], { registry: inlineRegistry("pickleball") });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.ok(problems.some((p) => /^pickleball: authored\.ts failed to load: /.test(p)), problems.join("\n"));
  });

  it("index.ts exporting the wrong name: reported", async () => {
    await writeListing("pickleball", {
      ...validFiles(),
      "index.ts": INDEX.replace("export const listing", "export const merged"),
    });
    await writeCatalog(["pickleball"], { registry: inlineRegistry("pickleball") });
    const { problems } = await checkCatalog(catalogDir);
    assert.deepEqual(problems, ["pickleball: index.ts must export an object named `listing`"]);
  });
});

describe("check-catalog registry drift", () => {
  it("agree: slug in manifest, registry and directory with the same listing is ok", async () => {
    await writeListing("pickleball", validFiles());
    await writeListing("beach-chair", { ...validFiles(), "authored.ts": authoredSource({ motifName: "Beach Chair" }) });
    await writeCatalog(["pickleball", "beach-chair"]);
    assert.deepEqual(await checkCatalog(catalogDir), { ok: ["beach-chair", "pickleball"], problems: [] });
  });

  it("unregistered: in manifest and directory but not the registry", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog(["pickleball"], { registry: [] });
    assert.deepEqual(await checkCatalog(catalogDir), {
      ok: [],
      problems: ["pickleball: not in registry.ts, so the site will not show it"],
    });
  });

  it("extra registry key: in registry but not the manifest", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog([], { registry: ["pickleball"] });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.deepEqual(problems, [
      "pickleball: in registry.ts but not in listings.json",
      "pickleball: directory has no slug in listings.json",
    ]);
  });

  it("extra registry key with no directory either: reported for both gaps", async () => {
    await writeCatalog([], { registry: inlineRegistry("ghost") });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /^ghost: in registry\.ts but not in listings\.json/);
    assert.match(problems[1], /^ghost: has no directory/);
  });

  it("stray directory: not in the manifest (nor the registry)", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog([]);
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.equal(problems.length, 2);
    assert.match(problems.join("\n"), /pickleball: directory has no slug in listings\.json/);
    assert.match(problems.join("\n"), /pickleball: not in registry\.ts/);
  });

  it("not yet synced: manifest slug with no directory", async () => {
    await writeCatalog(["pickleball"], { registry: inlineRegistry("pickleball") });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^pickleball: has no directory/);
  });

  it("not yet synced and not registered: both gaps named", async () => {
    await writeCatalog(["pickleball"], { registry: [] });
    const { problems } = await checkCatalog(catalogDir);
    assert.equal(problems.length, 2);
    assert.ok(problems.every((p) => p.startsWith("pickleball: ")));
    assert.match(problems.join("\n"), /not in registry\.ts/);
    assert.match(problems.join("\n"), /has no directory/);
  });

  it("different listing: registry entry differs from index.ts listing", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog(["pickleball"], { registry: `export const registry = { pickleball: { motifName: "Pickleball" } };\n` });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^pickleball: registry\.ts entry is not the same listing/);
  });

  it("different listing: an entry registered under another listing's slug is caught", async () => {
    await writeListing("pickleball", validFiles());
    await writeListing("beach-chair", { ...validFiles(), "authored.ts": authoredSource({ motifName: "Beach Chair" }) });
    await writeCatalog(["pickleball", "beach-chair"], {
      registry: `import { listing as a } from "./pickleball";\nimport { listing as b } from "./beach-chair";\nexport const registry = { pickleball: b, "beach-chair": a };\n`,
    });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /^beach-chair: registry\.ts entry is not the same listing/);
    assert.match(problems[1], /^pickleball: registry\.ts entry is not the same listing/);
  });

  it("only the drifting slug is left out of ok", async () => {
    await writeListing("pickleball", validFiles());
    await writeListing("beach-chair", { ...validFiles(), "authored.ts": authoredSource({ motifName: "Beach Chair" }) });
    await writeCatalog(["pickleball", "beach-chair"], { registry: ["pickleball"] });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, ["pickleball"]);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^beach-chair: not in registry\.ts/);
  });

  it("existing per-directory problems still fail a slug that agrees everywhere else", async () => {
    await writeListing("pickleball", { ...validFiles(), "authored.ts": authoredSource({ story: "" }) });
    await writeCatalog(["pickleball"]);
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.match(problems.join("\n"), /pickleball: authored\.ts field `story`/);
  });

  it("all empty: no listings, no problems", async () => {
    await writeCatalog([]);
    assert.deepEqual(await checkCatalog(catalogDir), { ok: [], problems: [] });
  });
});

describe("check-catalog unusable manifest or registry", () => {
  const cases: [string, CatalogFiles, RegExp][] = [
    ["missing listings.json", { manifest: null }, /^listings\.json could not be read/],
    ["non-JSON listings.json", { manifest: "{ not json" }, /^listings\.json is not valid JSON/],
    ["array listings.json", { manifest: "[]" }, /^listings\.json must be a JSON object/],
    ["null listings.json", { manifest: "null" }, /^listings\.json must be a JSON object/],
    ["missing registry.ts", { registry: null }, /^registry\.ts failed to load/],
    ["registry.ts that throws", { registry: `throw new Error("boom");\n` }, /^registry\.ts failed to load: .*boom/],
    ["registry.ts without a registry export", { registry: `export const other = {};\n` }, /^registry\.ts must export an object named `registry`/],
    ["registry.ts exporting a non-object", { registry: `export const registry = [];\n` }, /^registry\.ts must export an object named `registry`/],
  ];

  for (const [name, files, expected] of cases) {
    it(`${name}: one problem, no rejection`, async () => {
      await writeCatalog([], files);
      const { ok, problems } = await checkCatalog(catalogDir);
      assert.deepEqual(ok, []);
      assert.equal(problems.length, 1, problems.join("\n"));
      assert.match(problems[0], expected);
    });
  }

  it("bad manifest: the registry-vs-directory comparisons still run", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog(["pickleball"], { manifest: "nope", registry: [] });
    const { problems } = await checkCatalog(catalogDir);
    assert.equal(problems.length, 2);
    assert.match(problems[0], /^listings\.json is not valid JSON/);
    assert.equal(problems[1], "pickleball: not in registry.ts, so the site will not show it");
  });

  it("bad manifest: a registry key is not reported as missing from the unreadable manifest", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog(["pickleball"], { manifest: "nope" });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, ["pickleball"]);
    assert.equal(problems.length, 1, problems.join("\n"));
    assert.match(problems[0], /^listings\.json is not valid JSON/);
  });

  it("bad registry: the manifest-vs-directory comparisons still run", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog(["pickleball", "beach-chair"], { registry: null });
    const { problems } = await checkCatalog(catalogDir);
    assert.equal(problems.length, 2, problems.join("\n"));
    assert.match(problems[0], /^registry\.ts failed to load/);
    assert.match(problems.join("\n"), /beach-chair: has no directory/);
    assert.ok(problems.every((p) => !/^pickleball: /.test(p)), "pickleball agrees where it can be compared");
  });
});

describe("check:catalog CLI", () => {
  const tsx = path.join(process.cwd(), "node_modules", ".bin", "tsx");
  const script = path.join(process.cwd(), "scripts", "check-catalog.ts");

  async function run(cwd: string) {
    try {
      const { stdout, stderr } = await execFileAsync(tsx, [script], { cwd });
      return { code: 0, stdout, stderr };
    } catch (error) {
      const failure = error as { code: number; stdout: string; stderr: string };
      return { code: failure.code, stdout: failure.stdout, stderr: failure.stderr };
    }
  }

  // The CLI reads content/catalog under its cwd, so treat the temp dir as a repo root.
  const asRepoRoot = async () => {
    const repo = await fs.mkdtemp(path.join(os.tmpdir(), "check-catalog-cli-"));
    await fs.mkdir(path.join(repo, "content"));
    await fs.rename(catalogDir, path.join(repo, "content", "catalog"));
    return repo;
  };

  it("empty catalog: exit 0 and the no-listings note", async () => {
    await writeCatalog([]);
    const repo = await asRepoRoot();
    const result = await run(repo);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /no listings yet/);
    await fs.rm(repo, { recursive: true, force: true });
    await fs.mkdir(catalogDir);
  });

  it("valid listing: exit 0 and an ok line", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog(["pickleball"]);
    const repo = await asRepoRoot();
    const result = await run(repo);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /ok {3}pickleball/);
    await fs.rm(repo, { recursive: true, force: true });
    await fs.mkdir(catalogDir);
  });

  it("broken listing: exit 1 and a FAIL line naming the directory", async () => {
    await writeListing("pickleball", { "synced.ts": SYNCED });
    await writeCatalog(["pickleball"], { registry: inlineRegistry("pickleball") });
    const repo = await asRepoRoot();
    const result = await run(repo);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /FAIL pickleball: missing authored\.ts, index\.ts/);
    await fs.rm(repo, { recursive: true, force: true });
    await fs.mkdir(catalogDir);
  });

  it("registry drift: exit 1 and a FAIL line naming the slug", async () => {
    await writeListing("pickleball", validFiles());
    await writeCatalog(["pickleball"], { registry: [] });
    const repo = await asRepoRoot();
    const result = await run(repo);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /FAIL pickleball: not in registry\.ts/);
    await fs.rm(repo, { recursive: true, force: true });
    await fs.mkdir(catalogDir);
  });

  it("no content/catalog under cwd: exit 1 with a clear message, not a stack trace", async () => {
    const result = await run(os.tmpdir());
    assert.equal(result.code, 1);
    assert.match(result.stderr, /check-catalog: .*content\/catalog not found — run from the repo root/);
    assert.ok(!result.stderr.includes("    at "), "no stack trace");
  });
});

describe("build isolation", () => {
  it("no build lifecycle script references check-catalog", async () => {
    const pkg = JSON.parse(await fs.readFile(path.join(process.cwd(), "package.json"), "utf8")) as {
      scripts: Record<string, string>;
    };
    for (const name of ["build", "prebuild", "postbuild"]) {
      assert.doesNotMatch(pkg.scripts[name] ?? "", /check-catalog|check:catalog/, `${name} must not run the catalog check`);
    }
  });
});
