import type { AuthoredContent } from "../types";

export const authored = {
  motifName: "Water Tower",
  story:
    "A water tower on the skyline means you're close. One of Sea Isle City's most recognizable landmarks, stitched in a simple, understated way.",
  collection: "sea-isle",
  photos: [
    {
      src: "/images/designs/sic-water-tower/01.jpg",
      width: 1200,
      height: 1600,
      alt: "Sage-gray tee on a wooden hanger, a blue water tower reading “SIC” embroidered on the left chest.",
    },
    {
      src: "/images/designs/sic-water-tower/02.jpg",
      width: 1600,
      height: 1600,
      alt: "Close-up of the blue water tower embroidery reading “SIC”.",
    },
    {
      src: "/images/designs/sic-water-tower/03.jpg",
      width: 1600,
      height: 1600,
      alt: "Back of the tee on a wooden hanger, with the small Weathered Thread label below the collar.",
    },
    {
      src: "/images/designs/sic-water-tower/04.jpg",
      width: 1600,
      height: 1600,
      alt: "Inside the back of the collar, showing the woven Weathered Thread label.",
    },
    {
      src: "/images/designs/sic-water-tower/05.jpg",
      width: 1600,
      height: 1600,
      alt: "Sleeve hem of the tee, with the Weathered Thread label stitched at the edge.",
    },
    {
      src: "/images/designs/sic-water-tower/06.jpg",
      width: 1600,
      height: 1600,
      alt: "Sage-gray tee on a hanger in warm light, the water tower embroidered on the chest.",
    },
    {
      src: "/images/designs/sic-water-tower/07.jpg",
      width: 1254,
      height: 1254,
      alt: "Weathered Thread sizes and colors chart: sizes S, M and L; colors Ivory, Blue Jean, Pepper and Bay.",
    },
    {
      src: "/images/designs/sic-water-tower/08.jpg",
      width: 1254,
      height: 1254,
      alt: "Weathered Thread style chart: Heavyweight T-Shirt, Long Sleeve T-Shirt, Heavyweight Crewneck and Lightweight Crewneck, all in Comfort Colors.",
    },
  ],
} as const satisfies AuthoredContent;
