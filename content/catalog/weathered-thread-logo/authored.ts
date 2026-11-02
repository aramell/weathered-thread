import type { AuthoredContent } from "../types";

export const authored = {
  motifName: "Stacked Logo",
  story:
    "A simple expression of the Weathered Thread mark, stitched for everyday wear. The WT signature and the Weathered Thread name, embroidered in a clean, understated stack.",
  collection: "brand",
  photos: [
    {
      src: "/images/designs/weathered-thread-logo/01.jpg",
      width: 1200,
      height: 1600,
      alt: "Charcoal crewneck sweatshirt on a wooden hanger, the Weathered Thread script logo embroidered on the left chest.",
    },
    {
      src: "/images/designs/weathered-thread-logo/02.jpg",
      width: 1600,
      height: 1600,
      alt: "Close-up of the cream “wt” script monogram above the words “Weathered Thread”.",
    },
    {
      src: "/images/designs/weathered-thread-logo/03.jpg",
      width: 1600,
      height: 1600,
      alt: "A person in sunglasses and a denim jacket over the charcoal crewneck, standing among autumn trees.",
    },
    {
      src: "/images/designs/weathered-thread-logo/04.jpg",
      width: 1600,
      height: 1600,
      alt: "Back of the crewneck on a wooden hanger, with the small Weathered Thread label below the collar.",
    },
    {
      src: "/images/designs/weathered-thread-logo/05.jpg",
      width: 1600,
      height: 1600,
      alt: "Inside the back of the collar, showing the woven Weathered Thread label.",
    },
    {
      src: "/images/designs/weathered-thread-logo/06.jpg",
      width: 1600,
      height: 1600,
      alt: "Cuff of the crewneck, with the Weathered Thread label stitched at the edge.",
    },
    {
      src: "/images/designs/weathered-thread-logo/07.jpg",
      width: 1600,
      height: 1600,
      alt: "Charcoal tee on a hanger outdoors, the Weathered Thread logo on the left chest.",
    },
    {
      src: "/images/designs/weathered-thread-logo/08.jpg",
      width: 1254,
      height: 1254,
      alt: "Weathered Thread sizes and colors chart: sizes S, M and L; colors Ivory, Blue Jean, Pepper and Bay.",
    },
    {
      src: "/images/designs/weathered-thread-logo/09.jpg",
      width: 1254,
      height: 1254,
      alt: "Weathered Thread style chart: Heavyweight T-Shirt, Long Sleeve T-Shirt, Heavyweight Crewneck and Lightweight Crewneck, all in Comfort Colors.",
    },
  ],
} as const satisfies AuthoredContent;
