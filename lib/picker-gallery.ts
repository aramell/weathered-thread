/**
 * picker-gallery — slide model for the Product hero gallery: the design's Etsy photos first,
 * then (once a garment and color are chosen) the garment preview as the last slide.
 */
export type GalleryImage = { url: string; alt: string };

export type GallerySlide =
  | { kind: "photo"; url: string; alt: string }
  | { kind: "preview"; url: string };

/** `previewUrl` is null until a garment and color are chosen, or when the color has no photo. */
export function buildGallerySlides(images: GalleryImage[], previewUrl: string | null): GallerySlide[] {
  const slides: GallerySlide[] = images.map((image) => ({ kind: "photo", url: image.url, alt: image.alt }));
  if (previewUrl) slides.push({ kind: "preview", url: previewUrl });
  return slides;
}

/** Slide to jump to when a color is picked: the preview (last) slide, or null when there is none. */
export function previewSlideIndex(imageCount: number, hasPreview: boolean): number | null {
  return hasPreview ? imageCount : null;
}

/** Slide a chosen design opens on: Etsy's second photo is the zoomed-in design; else the only photo. */
export function defaultPhotoIndex(imageCount: number): number {
  return imageCount > 1 ? 1 : 0;
}

/** Announced position, 0-based `index`: "Photo 1 of 5". */
export function slideLabel(index: number, total: number): string {
  return `Photo ${index + 1} of ${total}`;
}
