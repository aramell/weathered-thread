# Change set: Brand Identity Board (25 Nov 2026)

Source: Brand Identity Board + Product Story board (screenshots from Andrew; Canva template link not readable, 403). Hexes read from screenshots: verify against Canva.

Decisions (Andrew, 25 Nov): swap Marsh Sage and Antique Brass for board tones; widen Anton to embroidery-style lettering.

## Done on branch `brand-board-2026-11`
- Tokens: `wet-ink` -> `weathered-ink` `#292824`; Deep Harbor `#304650`; new `warm-parchment` `#F4F0E7` as body background; `marsh-sage` -> `olive` `#6B6C4F`; `antique-brass` -> `clay-brown` `#906E5E` (focus outlines, selected-tile border) and `deep-gold` `#B89766` (defined, decoration only).
- Why not Deep Gold for borders/focus: 2.4:1 on Parchment, below the 3:1 non-text minimum. Olive 4.8:1 passes for text.
- Garment swatches (`lib/shop-presentation.ts`): Pepper `#505050`, Ivory `#EADDCD`, Blue Jean `#6A7E97`, Bay `#A6A799`.
- Hero headline: "Stitched in." in Fraunces italic, Deep Harbor (italic loaded in `app/layout.tsx`).
- Logo files renamed to board naming: `WT_Logo_Primary.png` is now the stacked logo (was `Stacked`); `WT_Logo_Lockup.png` is the horizontal secondary lockup (was `Primary`). Contents unchanged; brand-rules test hashes updated.
- `DESIGN.md` updated (palette, Anton scope, Fraunces italic).

## Open
- Anton widened in policy only; no new embroidery-lettering spot added yet. Pick where (e.g. footer sign-off "MADE TO REMEMBER · STITCHED IN").
- Embroidery thread palette not used anywhere yet.
- Board sample "EST. 1911 · NO. 04" is not shipped; needs a confirmed founding year.
- Confirm hexes against Canva; logo navy on the board is not Deep Harbor (artwork unchanged).
