/**
 * Every top-level nav link must have a page, so Collections can never 404 again (Story 5.1).
 * Reads the link list from the nav source and checks `app/(site)/<segment>/page.tsx` exists.
 * Run via `npm run test:catalog`.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "node:test";

import { collections } from "./collections";

const root = join(__dirname, "..");
const navSource = readFileSync(join(root, "components/nav-header.tsx"), "utf8");
const hrefs = [...navSource.matchAll(/href:\s*"(\/[a-z-]*)"/g)].map((match) => match[1]);

describe("nav routes", () => {
  it("finds the nav links", () => {
    assert.ok(hrefs.length >= 3, `expected nav links, found ${hrefs.join(", ")}`);
  });

  for (const href of hrefs) {
    it(`${href} has a page`, () => {
      const segment = href === "/" ? "" : href.slice(1);
      assert.ok(
        existsSync(join(root, "app/(site)", segment, "page.tsx")),
        `no app/(site)${href}/page.tsx`,
      );
    });
  }

  it("every collection slug has a collection page route", () => {
    assert.ok(existsSync(join(root, "app/(site)/collections/[slug]/page.tsx")));
    assert.ok(collections.length > 0);
  });
});
