---
title: 'Motif Selection on Collection Story (Epic 3 Story 3.2)'
type: 'feature'
created: '2026-09-16'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '7eaa6ec7967ab118b3c2be0c2731d7b2b530257f'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Sea Isle Collection Story's 13 `motif-tile`s are read-only decoration — tapping one does nothing, so a visitor who wants to start "design-first" (pick a motif, then a garment) has no way in. Story 3.1 already solved the mirror-image "garment-first" entry with a placeholder-data stub; motif-first has no equivalent yet.

**Approach:** Make each `motif-tile` on the Collection Story tappable: on tap it shows the Antique Brass selected border and navigates to a new minimal Product-surface stub (`/collections/[slug]/[motif]`) with that motif pre-selected and no garment chosen yet — the exact mirror of Story 3.1's `/shop/[type]/[color]` stub. Motif data moves into a shared placeholder module (adding a `slug` field) the same way Story 3.1 introduced `lib/placeholder-shop-data.ts`, kept isolated from Epic 2's real `content/catalog/` pipeline.

## Boundaries & Constraints

**Always:**
- Add `slug` (kebab-case, derived from `name`) to each of the 13 motif entries; move them from the inline array in `app/(site)/collections/[slug]/page.tsx` into a new `lib/placeholder-motif-data.ts` (mirroring `lib/placeholder-shop-data.ts`'s shape/exports: array + `getMotif(slug)` lookup), and have the Collection Story page import from there.
- Keep this data file separate from `content/catalog/` — never mimic `synced.ts`/`authored.ts` shape.
- New route `app/(site)/collections/[slug]/[motif]/page.tsx`, static-generated via `generateStaticParams` over the collection's motifs, `notFound()` on an unknown motif slug.
- Reuse `components/button-secondary.tsx` for a "Back to Collection" link to `/collections/{slug}`, and the existing disabled-button pattern from Story 3.1's stub for Add to Bag.
- Tap target and focus/selection behavior follow the accessibility floor already established for this epic (≥44×44px, visible focus state, no color-only affordance).
- The motif-first stub renders a flat Sailcloth placeholder block (matching `product-card`'s no-image fallback) below the motif name, with copy "Choose a garment for this piece." — decided to keep visual parity with Story 3.1's stub layout (image/block + copy + disabled Add to Bag).

**Never:**
- Never build Story 3.3's full Product Picker (swatch/size interactivity, live preview, sticky Add-to-Bag, motif gallery). This route is a minimal landing stub only, exactly as scoped for Story 3.1's counterpart.
- Never add a garment-selection UI to this stub — it shows the "no garment chosen yet" empty state and stops there.
- Never change `components/motif-tile.tsx`'s read-only browse usage elsewhere (only the Collection Story's rendering of it gains tap behavior).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid collection + motif | `/collections/sea-isle/water-tower` | Renders motif name, flat placeholder block, "Choose a garment for this piece.", disabled Add to Bag, "Back to Collection" link to `/collections/sea-isle` | N/A |
| Unknown motif slug under valid collection | `/collections/sea-isle/bogus-motif` | 404 via `notFound()` | N/A |
| Tap a motif tile on Collection Story | Visitor taps any `motif-tile` | Tile shows Antique Brass selected border; navigation to `/collections/{slug}/{motif-slug}` follows | N/A |

</frozen-after-approval>

## Code Map

- `app/(site)/collections/[slug]/page.tsx:6,16-40,100-104` -- inline `Motif`/`Collection` types and hardcoded 13-entry array to extract into the new lib module; motif tiles currently rendered with no wrapper (`<MotifTile name={motif.name} />`, no Link).
- `components/motif-tile.tsx` -- presentational, props `{name: string}` only, explicit doc comment noting Epic 3 adds interactivity on top of it; do not change its own read-only contract, wrap it instead.
- `lib/placeholder-shop-data.ts` -- pattern reference for the new `lib/placeholder-motif-data.ts` (types, array, `get*(slug)` lookup fn).
- `app/(site)/shop/[type]/[color]/page.tsx` -- direct structural template for the new `[motif]` stub page (route param typing via `PageProps<...>`, `generateStaticParams`, `generateMetadata`, disabled native Add to Bag button, `ButtonSecondary` back-link).
- `components/product-card.tsx` -- reference for the no-image flat-block fallback styling used on the new stub page.
- `app/globals.css:9` -- `--color-antique-brass` token, already defined, for the selected-tile border.
- No existing tap-to-select Client Component pattern exists in the repo (`collection-story-block.tsx`'s and `nav-scroll-shell.tsx`'s `useState` usages are unrelated scroll state) -- this story introduces the first one; keep it a small, local client wrapper around `MotifTile`, not a new global state pattern.

## Tasks & Acceptance

**Execution:**
- [x] `lib/placeholder-motif-data.ts` -- new file: `Motif {slug, name}`, `motifs` array (13 entries, current names + derived slugs), `getMotif(slug)` -- shared source for both the Collection Story page and the new route.
- [x] `app/(site)/collections/[slug]/page.tsx` -- source motifs from the new lib module instead of the inline array; wrap each `MotifTile` in a small client-side tappable wrapper that applies the Antique Brass selected border on tap and navigates to `/collections/{slug}/{motif.slug}`.
- [x] `app/(site)/collections/[slug]/[motif]/page.tsx` -- new page per Code Map's structural template; `notFound()` on unknown motif; renders motif name, flat placeholder block, "Choose a garment for this piece.", disabled Add to Bag, `ButtonSecondary` "Back to Collection" link.

**Acceptance Criteria:**
- Given a visitor on the Sea Isle Collection Story, when they tap a `motif-tile`, then it shows the Antique Brass selected border and they land on `/collections/sea-isle/{motif-slug}`.
- Given a visitor on that new page, when it renders, then it shows that motif selected, no garment chosen, a disabled Add to Bag control, and a "Back to Collection" link back to `/collections/sea-isle`.
- Given an unknown motif slug in the URL under a valid collection, when the page renders, then Next.js returns a 404.

## Implementation Notes

- Slug derivation: kebab-cased manually per motif name (lowercase, spaces/slashes/apostrophes/punctuation collapsed to single hyphens, e.g. "Life Preserver / N.J." -> `life-preserver-n-j`, "Smile You're in Sea Isle" -> `smile-youre-in-sea-isle`). No shared slugify helper was introduced since this is a fixed 13-entry placeholder set.
- New `components/motif-tile-link.tsx` is the small local client wrapper called for in the Code Map -- wraps the untouched, still-presentational `MotifTile` in a `next/link` `Link` with per-instance `useState` for the tap-selected state. Selected state renders `border-antique-brass` (vs. `border-transparent` at rest, so no layout shift) and also sets `aria-current="true"` so the affordance isn't color-only; a `focus-visible` outline covers keyboard focus.
- Stub page field order follows the spec's literal wording ("block... below the motif name"): `h1` motif name, then the flat Sailcloth placeholder block, then the "Choose a garment for this piece." copy, disabled Add to Bag button, `ButtonSecondary` back-link -- this differs from Story 3.1's stub (image first, then name) by design per this spec.
- `motifs` array in `lib/placeholder-motif-data.ts` is not per-collection (flat, like Story 3.1's `colorways`) since only one collection (`sea-isle`) exists today; `generateStaticParams` on the new route iterates that flat list directly, matching Code Map's instruction to keep this isolated from `content/catalog/`.
- Post-review patches (applied directly, implementation subagent unreachable for re-engagement): exported `getCollection` from `app/(site)/collections/[slug]/page.tsx` and call it from the `[motif]` stub's `generateMetadata` and page component (`notFound()`/`return {}` when the collection segment doesn't resolve, mirroring the existing motif-not-found branch); guarded `MotifTileLink`'s `onClick` to skip `setSelected(true)` on modifier-key or non-primary-button clicks (`metaKey`/`ctrlKey`/`shiftKey`/`altKey`/`button !== 0`); reworded `lib/placeholder-motif-data.ts`'s header comment to attribute the eventual real-data migration to Epic 2's authored `content/catalog/` pipeline rather than Squarespace sync (motifs never sync from Squarespace). Re-verified via `npm run build`, `npm run lint`, and live browser checks: `/collections/nope/sic-water-tower` now 404s, ctrl/cmd-click on two different tiles no longer leaves both simultaneously showing the selected border, and a normal tap still shows the border (confirmed visible across 6+ animation frames) before navigating.

## Spec Change Log

## Review Triage Log

- **New `[motif]` stub route never validates the collection (`slug`) param, only `motif`** — verdict `medium`. Confirmed live: `GET /collections/nope/sic-water-tower` returns 200 (not 404), rendering full stub content with a "Back to Collection" link that itself 404s. Raised independently by verification-gap (missing-adoption gap: sibling `/shop/[type]/[color]/page.tsx` validates both dynamic segments via `if (!garmentType || !colorway) notFound()`, this route validates only `motif`) and edge-case-hunter (three findings: the page skips validating `slug`; `generateMetadata` does the same; and the Intent's "exact mirror of Story 3.1's stub" claim doesn't hold since 3.1's stub validates both segments). Same root cause, one entry. Route: `patch`.
- **`components/motif-tile-link.tsx`'s `onClick` sets `selected=true` unconditionally, regardless of modifier keys or click button** — verdict `medium`. Confirmed live via two independent ctrl/cmd-clicks (dispatched with `ctrlKey`/`metaKey`) on two different tiles in the same tab: each opened a new tab (default browser behavior, current tab never navigated) yet both tiles ended up simultaneously showing `border-antique-brass`/`aria-current="true"` in the original tab — a direct, reproducible violation of this story's own AC ("only one motif can be selected at a time in this context"). Raised independently by blind-hunter and edge-case-hunter (two findings: the missing modifier-key guard, and the lack of any shared/mutually-exclusive selection state across tiles) — same root cause (no guard against non-primary clicks), one entry. Route: `patch`.
- **`lib/placeholder-motif-data.ts` header comment misattributes motif data provenance to Squarespace** — verdict `low`. Confirmed: the comment says this is a stand-in "until real Squarespace-synced inventory lands," but per `epic-3-context.md`'s Technical Decisions, motifs are repo-authored only and have no Squarespace representation (only garments/colors/prices sync from Squarespace). A future reader would form a wrong mental model of the eventual replacement path. Route: `patch`.
- **Motif data (`lib/placeholder-motif-data.ts`) is a flat, global list with no per-collection scoping** — verdict `low`. Confirmed by reading the file and both new/modified pages: neither `app/(site)/collections/[slug]/page.tsx` nor the new `[motif]/page.tsx` filters motifs by `collection.slug`, and `generateStaticParams` on the new route pre-renders the full motif list regardless of which collection segment it's nested under. Currently produces no observable divergence — exactly one collection (`sea-isle`) exists anywhere in the codebase. Raised independently by verification-gap (Other findings), blind-hunter, and edge-case-hunter (generateStaticParams cross-product framing); same root cause, one entry. This mirrors Story 3.1's own explicit, human-approved precedent of applying one flat placeholder-data list uniformly (its 4 colorways applied identically to all garment types) ahead of real Epic 2 data — the intent this spec extends already accepted that scope boundary. Route: `defer`.
- **No automated test coverage exists for this story's new code** — verdict `low`. Confirmed: repo-wide, no test framework, config, or script exists (consistent with every prior story spec's own logged finding on this same gap, e.g. `spec-1-5-homepage-email-signup.md`, `spec-1-2-site-wide-navigation.md`). Pre-existing, project-wide condition, not something this story introduces or is scoped to fix. Route: `defer`.
- **Product-surface stub renders motif name before the placeholder image block, reversing `epic-3-context.md`'s stated fixed content order** (blind-hunter) — verdict `low`. The field order was explicitly specified in this spec's own frozen Boundaries ("renders a flat ... placeholder block ... below the motif name"), so the only fix is editing this build's own frozen spec text. Rejected per the standing rule against findings whose fix is to edit this build's spec.
- **"Selected state may never be visibly perceptible before navigation" (React state update racing the route transition)** (blind-hunter) — verdict `false`. Refuted by direct testing: dispatching a real click and polling via `requestAnimationFrame` showed the `border-antique-brass` class applied and persisting across at least 6 animation frames (~100ms) before the destination page's DOM replaced it — a real, consistently reproducible visual flash, not accidental timing.
- **Manual slug derivation (no shared slugify helper) is "untracked tech debt"** (blind-hunter) — verdict rejected. No concrete failure scenario named, only speculative future inconsistency risk; does not meet the bar for a named harm.
- **`generateMetadata` and the page component each independently call `getMotif` and implement their own not-found branch** (blind-hunter) — verdict `false`. This is the standard Next.js App Router idiom (metadata generation and page rendering are independent exports with no built-in data-sharing layer), already present identically in this route's own cited structural template (`/shop/[type]/[color]/page.tsx`); not a defect introduced by this story.
- **`aria-current="true"` is a questionable ARIA token for a tapped-tile affordance** (blind-hunter) — verdict `false`. `aria-current="true"` is an explicitly valid enumerated value in the WAI-ARIA spec for marking a generic "current" item in a set (e.g. a selected item in a list), not limited to page/step/date/time; refuted by the spec's own documented use case.
- **Selection state doesn't survive back-button navigation to the Collection Story** (blind-hunter) — verdict rejected/out of scope. Neither the AC nor the spec requires preserving selection across navigation; a neutral, unselected state on return is a reasonable default that violates no stated requirement.

## Verification

**Commands:**
- `npm run build` -- expected: succeeds with no type errors, all `/collections/[slug]/[motif]` static params generate cleanly.
- `npm run lint` -- expected: no new errors.

**Manual checks (if no CLI):**
- `npm run dev`, visit `/collections/sea-isle`, tap each motif tile, confirm the Antique Brass border shows and navigation lands on the matching `/collections/sea-isle/{slug}` stub.
- Visit `/collections/sea-isle/bogus-motif`, confirm 404.
- Visit `/collections/bogus-collection/sic-water-tower`, confirm 404.
