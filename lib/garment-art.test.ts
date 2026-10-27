import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { garmentArtKind } from "./garment-art";

describe("garmentArtKind", () => {
  it("maps each Etsy style to its caricature", () => {
    assert.equal(garmentArtKind("heavyweight-crewneck"), "crewneck");
    assert.equal(garmentArtKind("lightweight-crewneck"), "crewneck");
    assert.equal(garmentArtKind("long-sleeve-tee"), "long-sleeve");
    assert.equal(garmentArtKind("heavyweight-tee"), "tee");
  });

  it("accepts display names and falls back to the tee for unknown styles", () => {
    assert.equal(garmentArtKind("Long Sleeve Tee"), "long-sleeve");
    assert.equal(garmentArtKind("Heavyweight Crewneck"), "crewneck");
    assert.equal(garmentArtKind("something-new"), "tee");
    assert.equal(garmentArtKind(""), "tee");
  });
});
