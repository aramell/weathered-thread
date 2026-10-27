import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { buildGallerySlides, defaultPhotoIndex, previewSlideIndex, slideLabel } from "./picker-gallery";

const images = [
  { url: "a.jpg", alt: "A" },
  { url: "b.jpg", alt: "B" },
];

describe("buildGallerySlides", () => {
  it("puts the preview last after the N photos", () => {
    const slides = buildGallerySlides(images, "front.jpg");
    assert.equal(slides.length, 3);
    assert.deepEqual(slides[2], { kind: "preview", url: "front.jpg" });
    assert.equal(slides[0].kind, "photo");
  });

  it("has no preview slide without a front image", () => {
    assert.equal(buildGallerySlides(images, null).length, 2);
  });

  it("is empty with no photos and no preview", () => {
    assert.deepEqual(buildGallerySlides([], null), []);
  });
});

describe("previewSlideIndex", () => {
  it("is the last slide when a preview exists", () => {
    assert.equal(previewSlideIndex(4, true), 4);
    assert.equal(previewSlideIndex(0, true), 0);
  });

  it("is null without a preview, so the index is left alone", () => {
    assert.equal(previewSlideIndex(4, false), null);
  });
});

describe("defaultPhotoIndex", () => {
  it("opens on the second (zoomed-in) photo when there are several", () => {
    assert.equal(defaultPhotoIndex(2), 1);
    assert.equal(defaultPhotoIndex(6), 1);
  });

  it("opens on the first photo when there is one or none", () => {
    assert.equal(defaultPhotoIndex(1), 0);
    assert.equal(defaultPhotoIndex(0), 0);
  });
});

describe("slideLabel", () => {
  it("is 1-based", () => {
    assert.equal(slideLabel(0, 5), "Photo 1 of 5");
    assert.equal(slideLabel(4, 5), "Photo 5 of 5");
  });
});
