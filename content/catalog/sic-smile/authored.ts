import type { AuthoredContent } from "../types";

export const authored = {
  motifName: "Smile, You're in Sea Isle",
  story:
    "A smiling sun and the words \"Smile, You're in Sea Isle\": the feeling of arriving at the shore and knowing you're exactly where you want to be.",
  collection: "sea-isle",
  photos: [
    {
      src: "/images/designs/sic-smile/01.jpg",
      width: 1200,
      height: 1600,
      alt: "Blue Jean long sleeve tee on a wooden hanger, a smiling sun in sunglasses embroidered on the left chest.",
    },
    {
      src: "/images/designs/sic-smile/02.jpg",
      width: 1600,
      height: 1600,
      alt: "Close-up of the smiling sun in sunglasses with the words “Smile you’re in Sea Isle”, embroidered on the chest.",
    },
    {
      src: "/images/designs/sic-smile/03.jpg",
      width: 1600,
      height: 1600,
      alt: "Back of the long sleeve tee on a wooden hanger, with the small Weathered Thread label below the collar.",
    },
    {
      src: "/images/designs/sic-smile/04.jpg",
      width: 1600,
      height: 1600,
      alt: "Inside the back of the collar, showing the woven Weathered Thread label.",
    },
    {
      src: "/images/designs/sic-smile/05.jpg",
      width: 1600,
      height: 1600,
      alt: "Cuff of the long sleeve tee, with the Weathered Thread label stitched at the edge.",
    },
    {
      src: "/images/designs/sic-smile/06.jpg",
      width: 1600,
      height: 1600,
      alt: "Detail of the smiling sun embroidery under a folded collar.",
    },
    {
      src: "/images/designs/sic-smile/07.jpg",
      width: 1254,
      height: 1254,
      alt: "Weathered Thread sizes and colors chart: sizes S, M and L; colors Ivory, Blue Jean, Pepper and Bay.",
    },
    {
      src: "/images/designs/sic-smile/08.jpg",
      width: 1254,
      height: 1254,
      alt: "Weathered Thread style chart: Heavyweight T-Shirt, Long Sleeve T-Shirt, Heavyweight Crewneck and Lightweight Crewneck, all in Comfort Colors.",
    },
  ],
} as const satisfies AuthoredContent;
