/**
 * Exercises scripts/check-catalog.ts against temp catalog directories — one test
 * per row of Story 2.2's I/O & Edge-Case Matrix, run with `npm run test:catalog`.
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

const validFiles = () => ({ "synced.ts": SYNCED, "authored.ts": authoredSource(), "index.ts": INDEX });

describe("check-catalog", () => {
  it("valid listing: reported ok", async () => {
    await writeListing("pickleball", validFiles());
    assert.deepEqual(await checkCatalog(catalogDir), { ok: ["pickleball"], problems: [] });
  });

  it("empty catalog: no listings, no problems (listings.json and README are not listings)", async () => {
    await fs.writeFile(path.join(catalogDir, "listings.json"), "{}");
    await fs.writeFile(path.join(catalogDir, "README.md"), "# catalog\n");
    assert.deepEqual(await checkCatalog(catalogDir), { ok: [], problems: [] });
  });

  it("synced, not yet authored: reports the missing authored.ts and index.ts", async () => {
    await writeListing("pickleball", { "synced.ts": SYNCED });
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /^pickleball: missing authored\.ts, index\.ts/);
  });

  it("missing index.ts: reported", async () => {
    await writeListing("pickleball", { ...validFiles(), "index.ts": null });
    const { problems } = await checkCatalog(catalogDir);
    assert.deepEqual(problems, ["pickleball: missing index.ts"]);
  });

  it("blank field: names the field", async () => {
    await writeListing("pickleball", { ...validFiles(), "authored.ts": authoredSource({ story: "  " }) });
    const { problems } = await checkCatalog(catalogDir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /pickleball: authored\.ts field `story` must be a non-empty string/);
  });

  it("key collision: names the key", async () => {
    await writeListing("pickleball", {
      ...validFiles(),
      "authored.ts": authoredSource({ name: "Pickleball" }),
    });
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
    const { problems } = await checkCatalog(catalogDir);
    assert.equal(problems.length, 1);
    assert.match(problems[0], /pickleball: index\.ts `listing` must equal \{ \.\.\.synced, \.\.\.authored \}/);
  });

  it("bad names: a non-slug directory and a non-slug collection are both reported", async () => {
    await writeListing("Sea_Isle", validFiles());
    await writeListing("beach-chair", { ...validFiles(), "authored.ts": authoredSource({ collection: "Sea Isle" }) });
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
    const { ok, problems } = await checkCatalog(catalogDir);
    assert.deepEqual(ok, []);
    assert.ok(problems.some((p) => /^pickleball: authored\.ts failed to load: /.test(p)), problems.join("\n"));
  });

  it("index.ts exporting the wrong name: reported", async () => {
    await writeListing("pickleball", {
      ...validFiles(),
      "index.ts": INDEX.replace("export const listing", "export const merged"),
    });
    const { problems } = await checkCatalog(catalogDir);
    assert.deepEqual(problems, ["pickleball: index.ts must export an object named `listing`"]);
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
    const repo = await asRepoRoot();
    const result = await run(repo);
    assert.equal(result.code, 0);
    assert.match(result.stdout, /no listings yet/);
    await fs.rm(repo, { recursive: true, force: true });
    await fs.mkdir(catalogDir);
  });

  it("valid listing: exit 0 and an ok line", async () => {
    await writeListing("pickleball", validFiles());
    const repo = await asRepoRoot();
    const result = await run(repo);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /ok {3}pickleball/);
    await fs.rm(repo, { recursive: true, force: true });
    await fs.mkdir(catalogDir);
  });

  it("broken listing: exit 1 and a FAIL line naming the directory", async () => {
    await writeListing("pickleball", { "synced.ts": SYNCED });
    const repo = await asRepoRoot();
    const result = await run(repo);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /FAIL pickleball: missing authored\.ts, index\.ts/);
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
