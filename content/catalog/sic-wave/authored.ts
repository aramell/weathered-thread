import type { AuthoredContent } from "../types";

export const authored = {
  motifName: "Sea Isle Wave",
  story:
    "A simple wave paired with the words \"Sea Isle City\", an everyday reminder of a place worth remembering.",
  collection: "sea-isle",
  photos: [
    {
      src: "/images/designs/sic-wave/01.jpg",
      width: 1200,
      height: 1600,
      alt: "Light gray tee on a wooden hanger, navy wave and “Sea Isle City” wordmark on the left chest.",
    },
    {
      src: "/images/designs/sic-wave/02.jpg",
      width: 1600,
      height: 1600,
      alt: "Close-up of the navy wave and “Sea Isle City” wordmark embroidered on the chest.",
    },
    {
      src: "/images/designs/sic-wave/03.jpg",
      width: 1600,
      height: 1600,
      alt: "Back of the light gray tee on a wooden hanger, with the small Weathered Thread label below the collar.",
    },
    {
      src: "/images/designs/sic-wave/04.jpg",
      width: 1600,
      height: 1600,
      alt: "Inside the back of the collar, showing the woven Weathered Thread label.",
    },
    {
      src: "/images/designs/sic-wave/05.jpg",
      width: 1600,
      height: 1600,
      alt: "Hem of the Ivory tee, with the Weathered Thread label stitched at the edge.",
    },
    {
      src: "/images/designs/sic-wave/06.jpg",
      width: 1600,
      height: 1600,
      alt: "Detail of the navy wave and “Sea Isle City” wordmark embroidery.",
    },
    {
      src: "/images/designs/sic-wave/07.jpg",
      width: 1254,
      height: 1254,
      alt: "Weathered Thread sizes and colors chart: sizes S, M and L; colors Ivory, Blue Jean, Pepper and Bay.",
    },
    {
      src: "/images/designs/sic-wave/08.jpg",
      width: 1254,
      height: 1254,
      alt: "Weathered Thread style chart: Heavyweight T-Shirt, Long Sleeve T-Shirt, Heavyweight Crewneck and Lightweight Crewneck, all in Comfort Colors.",
    },
  ],
} as const satisfies AuthoredContent;
