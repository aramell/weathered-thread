/**
 * Brand rules from the Master Brand Guidelines v1.0 (Nov 2026), enforced so they cannot drift
 * (Story 6.3): the approved logo files are shipped byte for byte, nothing recreates the logo,
 * and no lighthouse imagery or invented Weathered Clay value appears. Run via `npm run test:catalog`.
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

const root = join(__dirname, "..");
const sha = (file: string) => createHash("sha256").update(readFileSync(join(root, file))).digest("hex");

/** SHA-256 of the approved transparent PNGs supplied by the owner (Nov 2026). A change here means the artwork changed: confirm it is a newly approved file. */
const APPROVED_LOGOS = {
  "public/images/brand/WT_Logo_Lockup.png": "0c685ef7a149", // horizontal secondary lockup
  "public/images/brand/WT_Logo_Primary.png": "4c0418bd61dd", // stacked primary logo
  "public/images/brand/WT_Mark.png": "be7a3039fe59",
} as const;

function sourceFiles(dir: string): string[] {
  return readdirSync(join(root, dir)).flatMap((name) => {
    const relative = join(dir, name);
    if (statSync(join(root, relative)).isDirectory()) return sourceFiles(relative);
    return /\.(tsx?|css)$/.test(name) && !name.endsWith(".test.ts") ? [relative] : [];
  });
}

describe("brand rules", () => {
  for (const [file, prefix] of Object.entries(APPROVED_LOGOS)) {
    it(`${file} is the approved artwork`, () => {
      assert.ok(sha(file).startsWith(prefix), `${file} no longer matches the approved file`);
    });
  }

  it("the header uses the approved files, not a font-set wordmark", () => {
    const header = readFileSync(join(root, "components/nav-header.tsx"), "utf8");
    assert.match(header, /images\/brand\/WT_Mark\.png/);
    assert.match(header, /images\/brand\/WT_Logo_Lockup\.png/);
  });

  it("no lighthouse reference anywhere in app, components, lib or content", () => {
    for (const file of ["app", "components", "lib", "content"].flatMap(sourceFiles)) {
      assert.doesNotMatch(readFileSync(join(root, file), "utf8"), /lighthouse/i, `${file} mentions a lighthouse`);
    }
  });

  it("Weathered Clay is not used until its hex is confirmed", () => {
    for (const file of ["app", "components", "lib"].flatMap(sourceFiles)) {
      assert.doesNotMatch(readFileSync(join(root, file), "utf8"), /weathered[ -]?clay/i, `${file} uses Weathered Clay`);
    }
  });

  it("the About page keeps the owner's copy, and no unconfirmed claims", () => {
    const about = readFileSync(join(root, "app/(site)/about/page.tsx"), "utf8").replace(/\s+/g, " ");
    for (const line of [
      "Some places just stay with us.",
      "A sense of place, stitched in.",
      "The beauty is in the details.",
      "Made to look better lived in.",
      "Not just something to wear, but something to remember.",
      "Shop the Collection",
    ]) {
      assert.ok(about.includes(line), `About page is missing: ${line}`);
    }
    assert.doesNotMatch(about, /business days/i, "no processing-time claim until the owner confirms one");
  });

  it("the homepage shows the approved stacked logo, not a typed name", () => {
    const home = readFileSync(join(root, "app/(site)/page.tsx"), "utf8");
    assert.match(home, /images\/brand\/WT_Logo_Primary\.png/);
  });
});
