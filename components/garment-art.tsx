import type { GarmentArtKind } from "@/lib/garment-art";

type GarmentArtProps = {
  kind: GarmentArtKind;
  /** Selected garment color; the untinted Garment Blank fill when omitted. */
  tint?: string;
  className?: string;
};

const INK = "#2B2A26";

/**
 * garment-art — hand-drawn caricature of a garment type (Tee, Long Sleeve Tee, Crewneck),
 * ported from the key-product.html mock symbols. Loose Wet Ink outline with soft ribbing and
 * hem details, filled with the garment color. Decorative: hidden from assistive tech, the
 * caller always supplies the text label.
 */
export default function GarmentArt({ kind, tint, className }: GarmentArtProps) {
  return (
    <span
      aria-hidden="true"
      className={`block text-garment-blank ${className ?? ""}`}
      style={tint ? { color: tint } : undefined}
    >
      <svg viewBox="0 0 100 100" className="block h-full w-full" focusable="false">
        {kind === "tee" && (
          <>
            <path d="M35 14 C42 26 58 26 65 14 L85.5 23 L96 45.5 L80 52 L76.5 43 L77.5 86 C58 90.5 42 90.5 22.5 86 L23.5 43 L20 52 L4 45.5 L14.5 23 Z" fill="currentColor" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M37.5 15 C44 24 56 24 62.5 15" fill="none" stroke={INK} strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M27 80 C44 84 56 84 73 80" fill="none" stroke={INK} strokeOpacity=".45" strokeWidth="1.4" strokeDasharray="2 3" strokeLinecap="round" />
          </>
        )}
        {kind === "long-sleeve" && (
          <>
            <path d="M35 14 C42 26 58 26 65 14 L85.5 22 L97 77.5 L82 82 L74 46 L77.5 86 C58 90.5 42 90.5 22.5 86 L26 46 L18 82 L3 77.5 L14.5 22 Z" fill="currentColor" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M37.5 15 C44 24 56 24 62.5 15" fill="none" stroke={INK} strokeOpacity=".55" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M27 80 C44 84 56 84 73 80" fill="none" stroke={INK} strokeOpacity=".45" strokeWidth="1.4" strokeDasharray="2 3" strokeLinecap="round" />
          </>
        )}
        {kind === "crewneck" && (
          <>
            <path d="M33.5 14 C42 30 58 30 66.5 14 L85.5 22 L97 77.5 L82 82 L74 46 L77.5 86 C58 90.5 42 90.5 22.5 86 L26 46 L18 82 L3 77.5 L14.5 22 Z" fill="currentColor" stroke={INK} strokeWidth="2.4" strokeLinejoin="round" />
            <path d="M36 15 C44 25 56 25 64 15" fill="none" stroke={INK} strokeOpacity=".6" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M39 15.5 C45 22 55 22 61 15.5" fill="none" stroke={INK} strokeOpacity=".6" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M23 76 C42 80.5 58 80.5 77 76" fill="none" stroke={INK} strokeOpacity=".65" strokeWidth="1.8" strokeLinecap="round" />
            <path d="M80 71 L94.5 68 M81 66 L95.5 63 M20 71 L5.5 68 M19 66 L4.5 63" fill="none" stroke={INK} strokeOpacity=".6" strokeWidth="1.6" strokeLinecap="round" />
          </>
        )}
      </svg>
    </span>
  );
}
