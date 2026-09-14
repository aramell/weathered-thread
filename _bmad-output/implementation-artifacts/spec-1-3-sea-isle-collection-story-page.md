---
title: 'Sea Isle Collection Story Page'
type: 'feature'
created: '2026-09-14'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '6e93e8b18adfdb7e52f5557d596717f7995e9539'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Home's "Shop Sea Isle" button already links to `/collections/sea-isle`, but that route doesn't exist yet — visitors can't read the full Sea Isle story or see its motifs anywhere but Home's short feature block.

**Approach:** Build `app/(site)/collections/[slug]/page.tsx`, reusing `collection-story-block` for the PLACE → STORY moment, then a new `motif-tile` presentational component below it for a gallery of all 13 authored Sea Isle motifs — browse/read only, no tap-to-select.

## Boundaries & Constraints

**Always:** Route lives at `app/(site)/collections/[slug]/page.tsx` (dynamic segment, per epic architecture), with `generateStaticParams` returning only `sea-isle`; unknown slugs call `notFound()`. Page renders `collection-story-block` first (eyebrow "Collection", heading "Sea Isle", PLACE → STORY copy, existing scroll-triggered reveal — no changes to that component), then a motif gallery of all 13 Sea Isle motifs below it: Seagull, Wave, Smile You're in Sea Isle, Water Tower, Life Ring, Turtle, Bike, Boat, Exit 17, Nautical Map – Fish Alley, Beach Chair, Pickleball, Lobster Loft — each a `motif-tile` (Paper Raised surface, `caption-mono` name label, `rounded` corners, flat placeholder glyph block, no `<img>`, no spinner — same precedent as `product-card`). Collection + motif data hardcoded inline in the page file, matching Story 1.1's `shopItems` precedent (Epic 2's authoring pipeline doesn't exist yet). Mobile-first ~390px, no horizontal scroll; gallery reflows to more columns at desktop widths.

**Never:** No tap/selection behavior, `selected` state, or navigation into a picker on `motif-tile` — that's Epic 3. No `content/` pipeline or CMS-backed data — Epic 2. Do not modify `collection-story-block.tsx`. Do not enable `cacheComponents`. No `button-primary` CTA on this page — decided against adding "Shop the Collection" since it has no live destination until Epic 3's Shop surface ships; the page stays pure browse/read, matching the AC exactly.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Sea Isle visited | `GET /collections/sea-isle` | `collection-story-block` renders, then all 13 `motif-tile`s with real names, in order | N/A |
| Unknown collection | `GET /collections/nonexistent` | `notFound()` → Next.js not-found page | 404 |

</frozen-after-approval>

## Code Map

- `app/(site)/collections/[slug]/page.tsx` -- new, Server Component: dynamic route, `generateStaticParams` for `sea-isle`, `notFound()` otherwise; holds hardcoded Sea Isle collection + motif data.
- `components/motif-tile.tsx` -- new, Server Component (non-interactive): Paper Raised surface, `caption-mono` name, `rounded` corners, flat placeholder glyph — visual contract Epic 3 will later wrap with tap-to-select.
- `components/collection-story-block.tsx` -- reuse as-is (built in Story 1.1); pass `eyebrow="Collection"`, `heading="Sea Isle"`, story copy as children.
- `app/(site)/page.tsx` -- reference only; already links to `/collections/sea-isle` (Story 1.1's "Shop Sea Isle" button) — no changes needed.
- `app/globals.css` -- reference only; `caption-mono`, `paper-raised`, `rounded`, `line` tokens already exist from Story 1.1.

## Tasks & Acceptance

**Execution:**
- [x] `components/motif-tile.tsx` -- build the non-interactive motif tile -- shared visual contract, reused (made interactive) by Epic 3
- [x] `app/(site)/collections/[slug]/page.tsx` -- build the dynamic collection route with hardcoded Sea Isle data -- fulfills the `/collections/sea-isle` link already live on Home

**Acceptance Criteria:**
- Given a visitor navigates to the Sea Isle Collection Story, when the page loads, then it renders `collection-story-block` first (Deep Harbor surface, Sailcloth text, PLACE → STORY copy) via scroll-triggered reveal, never autoplay/carousel, and a motif gallery renders below it.
- Given Sea Isle currently has 13 authored motifs, when the gallery renders, then all 13 motif-tiles show with their real names, and tapping a motif to start the picker is out of scope for this story.

## Implementation Notes

Built `components/motif-tile.tsx` (Server Component, non-interactive) mirroring `product-card.tsx`'s visual contract: `rounded bg-paper-raised p-4` surface, flat `bg-sailcloth` glyph block (no `<img>`, no spinner), `caption-mono` name label. No `selected` state or click handling.

Built `app/(site)/collections/[slug]/page.tsx` as a Server Component with the Sea Isle collection + all 13 motifs hardcoded inline (matching `shopItems` in `app/(site)/page.tsx`). `generateStaticParams` returns only `{ slug: "sea-isle" }`; unmatched slugs call `notFound()`. Renders `CollectionStoryBlock` (eyebrow "Collection", heading "Sea Isle", PLACE → STORY copy carried over verbatim from Home's feature block) followed by a motif gallery (`grid-cols-2` mobile → `md:grid-cols-3` → `lg:grid-cols-4`, `gap-4`, same gutter tokens as the Shop grid). No CTA added, per the spec's "Never" list. `collection-story-block.tsx` was not modified.

Used the `PageProps<'/collections/[slug]'>` typed-route helper (consistent with `RootLayout`'s use of `LayoutProps<'/'>`), per `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`.

**Review patch round:** the original step-03 implementation subagent was no longer reachable for re-engagement, so the orchestrator applied the five `patch`-routed review findings directly: added `generateMetadata` (Sea Isle-specific title/description, per `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md`'s `PageProps` pattern), added a visually-hidden (`sr-only`) page `<h1>` without touching `collection-story-block.tsx`, added `role="list"`/`aria-labelledby`/`role="listitem"` wiring between the "Motifs" label and the gallery, and switched both the motif-tile and story-paragraph React keys from content-derived (`motif.name`, `paragraph`) to index-composed keys to remove the theoretical duplicate-content key-collision risk. See `## Review Triage Log` for the full finding set and dispositions.

## Spec Change Log

## Review Triage Log

- **[medium → patch]** No page-specific `metadata` on `app/(site)/collections/[slug]/page.tsx` — the route silently inherits the root layout's homepage `<title>`/`description`. Verified: confirmed no `export const metadata`/`generateMetadata` anywhere in the diff. Real SEO/link-preview gap for a standalone, shareable page.
- **[medium → patch]** No `<h1>` exists anywhere on the route — `CollectionStoryBlock` only renders an `<h2>`, and the spec forbids modifying that component. Verified: confirmed by reading the component and the new page; Home has its own separate `<h1>` in its Hero section but this route has no equivalent. Real a11y/SEO heading-hierarchy gap.
- **[low → patch]** The "Motifs" section label (`<p>`) has no programmatic association (`aria-labelledby`/`role="list"`) with the motif grid below it. Verified: confirmed plain `<p>` + `<div className="grid">` with no ARIA wiring. Real but minor — each tile is still individually text-labeled, satisfying the AC.
- **[low → patch]** `motif-tile` React `key` is `motif.name` alone; two motifs sharing a name would collide. Verified: current 13 names are distinct, so not currently reachable, but the fix (compose the key with the array index) is a trivial one-line correction, so it proceeds rather than being auto-rejected as low.
- **[low → patch]** Story-paragraph `key={paragraph}` (the paragraph's own text) would collide on two identical paragraphs. Verified: only one paragraph exists today, so not currently reachable, but again the fix (index-based key) is a trivial one-liner.
- **[false]** Eyebrow text differs between Home ("Launch Collection") and this page ("Collection") — flagged as a possible oversight. Disproved: the frozen spec's Boundaries & Constraints explicitly directs `eyebrow "Collection"` for this page, distinct from Home's "Launch Collection" framing (Home announces Sea Isle as the site's debut collection; this page just labels the content type). Intentional, not a bug.
- **[false]** Motifs grid adds `lg:grid-cols-4` where the Shop grid on Home stops at `md:grid-cols-3` — flagged as an inconsistent pattern. Disproved: the two galleries hold very different item counts (13 motifs vs. 4 shop items); an extra desktop column for the larger set is a reasonable, content-driven choice, and nothing in the spec or design docs requires identical breakpoints across unrelated card types.
- **[false]** No empty-state copy if the `motifs` array were empty. Disproved: the only collection defined in this diff is a hardcoded literal with exactly 13 entries — there is no runtime path in this story's code that can produce zero motifs for an existing collection; the concern only applies to a future collection that doesn't exist yet.
- **[false]** No TODO/ticket marker on the placeholder glyph blocks for future real photography. Disproved: `motif-tile.tsx`'s doc comment documents this exactly the way `product-card.tsx` (Story 1.1) already does for the same situation — a plain descriptive comment, no ticket-tagging convention exists anywhere else in this repo.
- **[low → reject]** No uniqueness guard on collection `slug` — a future duplicate slug would leave the second entry silently unreachable. Verified: true, no guard exists, but with exactly one hardcoded entry today this isn't reachable, and a proper fix (e.g., restructuring the array into a keyed object) is more than a trivial correction — rejected per the low-finding rule (unlikely in everyday use + fix beyond a direct correction).
- **[medium, unverified → defer]** (verification-gap, pre-verified) No automated check that the homepage's `/collections/sea-isle` href actually resolves to the Sea Isle collection rather than 404ing if the slug ever drifts between the two hardcoded strings. Filed pre-verified: repo has no test framework/files/scripts at all (confirmed via repo-wide search). Disposition accepted as filed — standing up test infrastructure is bigger than this story's scope. Grouped with the next entry (same root cause: no test infra exists).
- **[low → defer]** (blind-hunter) No automated test accompanies the new route or `MotifTile` — same root cause as the entry above (no test framework in this repo at all); grouped, not double-counted.
- **[low → defer]** Sea Isle story paragraph is duplicated verbatim between `app/(site)/page.tsx` (Story 1.1's homepage teaser) and the new `app/(site)/collections/[slug]/page.tsx` — flagged independently by both blind-hunter and verification-gap. Verified: true, byte-for-byte duplicate. Judged as an accepted tradeoff of this story's spec-directed "hardcode inline, matching Story 1.1's `shopItems` precedent" approach (Epic 2's content pipeline will replace hardcoded data entirely) rather than a defect to fix now — deferred as future cleanup.
- **[out of scope → defer]** `motif.name` is the only identifier on each tile (no stable `slug`/`id`), so nothing links a tile to Epic 3's eventual picker beyond string-matching the display name. Verified: true. Rejected as this story's problem: the intent explicitly excludes building tap-to-select/picker wiring (Epic 3's concern), and a stable id's only current value is for that future wiring — deferred for Epic 3 to define alongside real picker state.
- **[pre-existing → defer]** (verification-gap) `nav-header.tsx`'s "Collections" link points to `/collections` (no slug), which 404s — there is no `app/(site)/collections/page.tsx`. Verified: true, but `nav-header.tsx` is untouched by this diff (built in Story 1.2) — not caused by this story.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors
- `npm run build` -- expected: builds cleanly, statically generates `/collections/sea-isle`

**Manual checks (if no CLI):**
- `npm run dev`, load `/collections/sea-isle` at ~390px: story block reveals on scroll, 13 motif tiles render below with correct names, no horizontal scroll, tiles are not tappable/interactive.
- Load `/collections/nonexistent` → 404.

**Results (2026-09-14):**
- `npm run lint` -- passed, no errors.
- `npm run build` -- passed; route table shows `● /collections/sea-isle` prerendered via `generateStaticParams` (SSG), `○ /` and `○ /_not-found` static.
- `npm run dev` + `curl`: `GET /collections/sea-isle` → `200`, response body contains all 13 motif names exactly once each plus the "Sea Isle" heading/copy; `GET /collections/nonexistent` → `404`.
- `motif-tile.tsx` markup confirmed non-interactive (no button/anchor/onClick, `<div>`-based, `aria-hidden` glyph block only).

**Post-review patch verification (2026-09-14):**
- `npm run lint` -- passed, no errors.
- `npm run build` -- passed; route table still shows `● /collections/sea-isle` prerendered via SSG.
- `npm run dev` + `curl` on `/collections/sea-isle`: `<title>Sea Isle — Weathered Thread</title>` present, exactly one `<h1>`, `role="list"` present on the motif grid, 13 `role="listitem"` elements. `GET /collections/nonexistent` still returns `404`.
