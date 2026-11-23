# Change set: align with Master Brand Guidelines v1.0 (Nov 2026)

Source: `Weathered_Thread_Brand_Guidelines_Master_2026.pdf`. Audit found palette, tagline,
Weathered Clay handling, lighthouse rule and offered sizes (S/M/L only) already compliant.
Three items remain. Small, one branch, no new dependencies beyond one Google font.

## C1. Anton for location wording  (the only substantive change)
Guide: Anton is the standard for location names; all caps, slightly increased letter spacing.
Not for the logo, not for site-wide headlines.

- `app/layout.tsx`: load `Anton` via `next/font/google` (`--font-anton`, weight 400).
- `app/globals.css`: add `--font-location: var(--font-anton), Impact, sans-serif` and a
  `--text-location` token (uppercase, ~0.04em tracking).
- Apply to location wording only:
  - `components/collection-story-block.tsx:92` heading when it is a place ("SEA ISLE");
    the "Weathered Thread" brand collection heading must stay Fraunces (not a location).
    Add an explicit `location` prop rather than guessing from the string.
  - `app/(site)/page.tsx:33` pass it for Sea Isle.
  - Collection label above motif names in the product picker / motif tile (the "Sea Isle" caption).
  - `collections/[slug]` page heading when the collection is a place.
  - Add `kind: "place" | "brand"` to `lib/collections.ts` to drive this.
- `DESIGN.md` Typography: "three typefaces" becomes four; document Anton's one job and
  the do-not (no logo recreation, no headlines).
- Open check: Anton at display size on the dark Deep Harbor block, mobile (30px token) and
  contrast. Eyeball in browser before merge.

Acceptance: place names in the listed spots render in Anton uppercase; brand heading and all
other display text unchanged; no layout shift (font `display: swap` default).

## C2. Collection/campaign line  (DECIDED)
Guide: "For places worth remembering" is allowed as collection/campaign language only.

Decision (Andrew): use it as the Sea Isle collection eyebrow.
- `lib/collections.ts` Sea Isle: `eyebrow: "For places worth remembering"` (was "Collection").
  The brand collection keeps "Collection".
- `app/(site)/page.tsx:33` hardcodes `eyebrow="Launch Collection"`; switch it to the
  collection's eyebrow so the home block and the collection page agree. Decided: drop
  "Launch Collection" entirely.
- Keep it out of the site tagline and metadata. Layout meta description unchanged.
- Check the eyebrow's mono/uppercase style holds up at this length on mobile.

## C3. Tagline discipline in copy (two lines, smaller than first estimated)
Existing product copy is already in voice. Only the tagline is used as a trailing fragment,
lowercase, inside body copy:

- `lib/collections.ts` brand story: "...everyday favorites. Made to remember."
- `content/catalog/wt-horizontal-logo/authored.ts:6`: "...everyday favorite. Made to remember."

Guide wants the tagline written exactly. Replace with plain story copy (e.g. end after
"everyday favorites.") and leave the exact tagline to the home page, about page and title.
Note: `lib/collections.ts` and `authored.ts` are also touched by uncommitted work on
`square-hosted-checkout`; do this after that is committed or stashed.

## Housekeeping (optional, bundle if convenient)
- Trim unused `2XL`/`3XL` from `SIZE_ORDER` in `lib/shop.ts:15`.
- Add a pointer in `docs/` naming the guidelines PDF as brand source of truth.

## Not in scope / pending on the owner
- Logo artwork: PDF contains none; cannot verify site logo usage.
- Weathered Clay hex: unlocked, do not invent.
- Photography direction: no code change; applies to future shoots/listing images.

## Order and size
C3 (trivial) -> C2 (decided) -> C1 (~half a day incl. visual check). Tests: existing
suites should be unaffected; add a small test only if `kind` drives logic in `lib/collections.ts`.
