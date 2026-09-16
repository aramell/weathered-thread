- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page.md`
  summary: No automated test framework exists in this repo, so nothing verifies the homepage's `/collections/sea-isle` link keeps resolving (rather than 404ing) if the hardcoded slug strings on either side ever drift, and no test accompanies the new route or `MotifTile` component.
  evidence: Repo-wide search finds no test files, no jest/vitest/playwright dependency, and no test script in package.json; standing up test infrastructure is bigger than this story's scope.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page.md`
  summary: The Sea Isle story paragraph is duplicated verbatim between the homepage teaser (`app/(site)/page.tsx`, Story 1.1) and the new Collection Story page, with no shared source — the two can drift out of sync on future edits.
  evidence: Confirmed byte-for-byte duplicate; accepted for now as a consequence of this story's spec-directed "hardcode inline" approach (matching Story 1.1's `shopItems` precedent) ahead of Epic 2's real content pipeline, which will replace hardcoded data entirely.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page.md`
  summary: `motif-tile` has no stable `slug`/`id` — only the display name — so Epic 3's picker will need to define how a tile links to picker state beyond string-matching the name.
  evidence: Confirmed `motif.name` is the sole identifier used as both label and React key; out of this story's scope since tap-to-select/picker wiring is explicitly Epic 3's, but worth deciding before that story starts.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page.md`
  summary: `nav-header`'s "Collections" link points to `/collections`, which 404s — there is no `app/(site)/collections/page.tsx` (an index of all collections).
  evidence: Confirmed via route listing; pre-existing from Story 1.2, not caused by this story, surfaced while tracing this route's consumers.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: `components/nav-scroll-shell.tsx` measures `navHeight` via `offsetHeight` once at mount, with no re-measure on window resize, orientation change, or webfont-load reflow — the sticky/hairline scroll threshold can go stale.
  evidence: Confirmed the `useEffect` has an empty dependency array and no resize/ResizeObserver listener; introduced by Story 1.2 (`6e93e8b`), not this story, surfaced while reviewing the bundled diff.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: `app/(site)/collections/[slug]/page.tsx`'s `generateMetadata` reads `collection.story[0]` with no check that `story` is non-empty, so a future collection with an empty `story` array would silently get an `undefined` meta description.
  evidence: Confirmed by reading the function; introduced by Story 1.3 (`88f345c`), not this story, surfaced while reviewing the bundled diff.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: Shipped homepage/layout code still uses Fraunces + IBM Plex Mono, but the in-flight `sprint-change-proposal-2026-09-15.md` rework (reflected in uncommitted edits to `epics.md`/DESIGN.md/EXPERIENCE.md) calls for Libre Franklin body copy — code and planning docs are currently out of sync.
  evidence: Confirmed by diffing planning-doc changes against `app/layout.tsx`/`app/globals.css`/`app/(site)/page.tsx` in the same diff; this is scope for the correct-course rework, not this story.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: The homepage's fixed section order per spec-1-1 (7 sections) has not been updated to add "product philosophy" and "lifestyle imagery" sections that the in-flight correct-course rework specifies in epics.md/EXPERIENCE.md.
  evidence: Confirmed `app/(site)/page.tsx` still renders exactly the original 7 sections; the rework is not yet implemented as of this review, which is expected since spec-1-1 predates the proposal.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: spec-1-1's `<frozen-after-approval>` Intent block still describes pre-correct-course scope (Fraunces/IBM Plex Mono, 7 fixed sections) with nothing in the spec itself flagging it as pending renegotiation per the sprint-change proposal.
  evidence: Confirmed by reading the frozen block; the correct-course workflow, not this build run, is responsible for updating/flagging frozen specs when scope changes.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: The 13 new Sea Isle motif names introduced by the correct-course rework in `epics.md` are not yet reflected in `app/(site)/collections/[slug]/page.tsx` or `spec-1-3-sea-isle-collection-story-page.md`, which still use the old motif names.
  evidence: Confirmed by comparing epics.md's updated AC list against the shipped code/spec; expected since this rework is still in flight and out of Story 1.1's scope.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: `epic-1-context.md`'s cached "Requirements & Constraints" section still quotes the old 13 motif names verbatim even though its stated source (`epics.md`) has since changed.
  evidence: Confirmed by comparing the cached context file against the current epics.md; the context file is documented as auto-regenerating but nothing currently marks it stale.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: The new 13-motif-name list added to `epics.md` mixes naming conventions — some entries spell "Sea Isle City" out fully, one abbreviates to "SIC", and capitalization is inconsistent across entries.
  evidence: Confirmed by reading the list in epics.md; worth normalizing before this becomes shipped product copy.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: The new "product philosophy" and "lifestyle imagery" homepage sections are named in epics.md/EXPERIENCE.md but the actual copy requirement ("Made to look better lived in") only appears in the sprint-change-proposal's prose, not in epics.md's Story 1.1 AC that implementers will actually consult.
  evidence: Confirmed by comparing sprint-change-proposal-2026-09-15.md Section 4 against epics.md's current Story 1.1 AC list.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: The new "lifestyle imagery" homepage section doesn't say whether it follows the rest of Epic 1's explicit placeholder-color-block convention (no `<img>`, no spinner, until Epic 2 photography) or how it satisfies epic-1-context.md's "cold load shows no spinner" constraint and the UX doc's alt-text requirement.
  evidence: Confirmed by reading epic-1-context.md's constraints against the new section's description in epics.md/EXPERIENCE.md; unresolved as of this review.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: `sprint-change-proposal-2026-09-15.md` Section 1 asserts a fourth planning area (product-page content requirements) "already matched" what's planned, requiring no change, but gives no citation, unlike every other claim in the same proposal.
  evidence: Confirmed by reading the proposal; this claim can't currently be checked against a source.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: `sprint-change-proposal-2026-09-15.md` references a "Weathered Thread — Next Iteration Notes" / "CURRENT WEBSITE WORKING DOCUMENT" throughout but never gives a file path or location for it, so none of the proposal's claims can be checked against their source.
  evidence: Confirmed by reading the proposal in full; no such reference is given anywhere in the diff.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-homepage-renders-with-brand-identity.md`
  summary: epics.md's new About-page AC (handmade-variation copy, processing-time copy, "Sea Isle as first chapter" positioning) gives no guidance on where this content lands relative to the page's existing "brand idea, philosophy, and tagline" content.
  evidence: Confirmed by reading the new AC block; unlike other ACs in the same doc (e.g. FR15's homepage section order), it doesn't pin placement.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-site-wide-navigation.md`
  summary: The nav's sticky/hairline scroll-toggle behavior (the story's central acceptance criteria) has no automated test — a regression (e.g. an inverted scroll comparison, or a dropped desktop override) would ship undetected.
  evidence: Confirmed no test framework exists anywhere in the repo (no jest/vitest/playwright/RTL, no test script in package.json, no CI workflows); the only verification is a one-time manual chrome-devtools-mcp pass recorded in prose in the spec's Implementation Notes. Adding a first test is a project-wide infrastructure decision, not a fix scoped to this story.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-site-wide-navigation.md`
  summary: The brand color-contrast requirement (Wet-Ink-on-Sailcloth, Sailcloth-on-Deep-Harbor must clear WCAG AA at body text size, per epic-1-context.md) has no automated check — a future token-value change could silently drop below AA.
  evidence: Confirmed no accessibility-check tooling (axe, pa11y, or similar) exists or is configured anywhere in the repo; same root cause as the test-infrastructure gap above.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-site-wide-navigation.md`
  summary: `components/collection-story-block.tsx`'s fade-reveal transition has no `prefers-reduced-motion` check, so visitors who've opted out of motion still get the 700ms opacity animation.
  evidence: Confirmed by reading the component (Story 1.1, `cab085d`); surfaced during Story 1.2's review because its diff range inadvertently included Story 1.1's cumulative changes, but the component itself is Story 1.1's, not Story 1.2's.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-site-wide-navigation.md`
  summary: `app/globals.css`'s `--text-display-lg-mobile` token omits a letter-spacing value that its desktop counterpart `--text-display-lg` defines (`-0.01em`), an inconsistency in the type scale not called out as intentional.
  evidence: Confirmed by reading the token block (Story 1.1, `cab085d`); same diff-range artifact as above, not caused by Story 1.2.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page-2.md`
  summary: The `collection-story-block` narrative prose ("A water tower on the skyline, a life ring at the marina, the exit you take when you're almost there...") references landmarks by their pre-correction phrasing ("life ring," "the exit"), which now sits just above motif-tile labels using the corrected names ("Life Preserver / N.J.", "Exit 17 / Sea Isle City") — a soft naming mismatch between narrative copy and gallery captions. The identical sentence is also duplicated on the homepage (`app/(site)/page.tsx`).
  evidence: Confirmed the prose is unchanged and the motif labels are changed; out of this story's approved scope (sprint-change-proposal-2026-09-15.md's Technical Impact section scopes the rework to the `motifs` array only, not narrative copy) — rewriting brand-voice prose needs its own stakeholder sign-off, not a code-level fix.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-sea-isle-collection-story-page-2.md`
  summary: The corrected 13-motif list (approved verbatim in sprint-change-proposal-2026-09-15.md) mixes caption conventions: most are Title Case place names, one is an unexplained initialism ("SIC Water Tower" — "SIC" is never expanded anywhere on the page), and one is lowercase ("Sea Isle shoreline / sailboat"). Three names are also noticeably longer than the rest and embed slashes.
  evidence: Verified these are the exact strings from the approved proposal/epics.md AC, not an implementation choice — normalizing casing or expanding "SIC" would mean altering brand-approved customer-facing copy without sign-off, so it's flagged rather than silently changed.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-4-about-page.md`
  summary: No page besides Home renders a `<footer>` (copyright/shipping info) — `app/(site)/layout.tsx` only injects the nav, so every other route (Collection Story, now About) ends with no site-wide footer.
  evidence: Confirmed `app/(site)/collections/[slug]/page.tsx` (Story 1.3) also has no footer, so this is a pre-existing sitewide pattern gap, not introduced by Story 1.4; deciding whether footer belongs in `app/(site)/layout.tsx` (persistent, like nav) or stays per-page is a design call bigger than one story.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-5-homepage-email-signup.md`
  summary: The repo has zero automated tests anywhere (no test files, config, or `package.json` script) — Story 1.5's new `subscribeEmail` Server Action, the first logic in the site that calls a paid external API and mutates real third-party state, ships with only live-manual and lint/build verification.
  evidence: Confirmed via repo-wide search (no `*.test.*`/`*.spec.*` files, no jest/vitest/playwright config, no test script) during Story 1.5's review; this is a pre-existing gap present since Story 1.1, not something this story introduced — establishing the repo's first test framework and mocking convention is a project-level decision bigger than one story's trivial-fix bar.

- source_spec: `_bmad-output/implementation-artifacts/spec-collection-story-block-reduced-motion.md`
  summary: The uncommitted edit to `app/(site)/page.tsx` (removing the hero eyebrow "Made to Remember. Stitched in." and changing the `<h1>` to that same string, replacing "A sense of place, stitched in.") contradicts `spec-1-1-homepage-renders-with-brand-identity-2.md`'s already-shipped, explicit constraint to leave "every mono/label element (nav wordmark, nav links, eyebrows, prices, footer) untouched," creates a verbatim duplicate `<h1>` with the About page, and leaves Home as the only section on the site with no eyebrow label above its heading (About, Home's own "Shop" section, and `CollectionStoryBlock` all pair one).
  evidence: Confirmed by reading `spec-1-1-homepage-renders-with-brand-identity-2.md`'s frozen Approach/Implementation Notes (explicitly scopes to font-only changes, eyebrows untouched) against the current `git diff app/(site)/page.tsx`, and by comparing the new `<h1>` text against `app/(site)/about/page.tsx:30`. This is the site owner's own pre-existing uncommitted edit (predates this build session), not something this story caused — flagged rather than changed.

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-sync-squarespace-garment-data.md`
  summary: The price-regression check's scope (Open Question + I/O matrix) only covers `price` going down; it doesn't say what should happen if inventory drops to zero, a product name changes, or a product URL changes in a way that should also warrant a warning before overwriting `main`'s data.
  evidence: Confirmed by reading `epic-2-context.md`'s "a previously-synced field (e.g. an older price)" wording (implies any field) against the spec's Open Questions/I-O Matrix, which define regression handling for price only. Not fixed now because Story 2.1 itself is blocked pending Squarespace commerce setup (see project memory `squarespace_not_configured.md`) and unapproved (`status: draft`).

- source_spec: `_bmad-output/implementation-artifacts/spec-homepage-hero-eyebrow-copy.md`
  summary: Home's `<h1>` ("Made to Remember. Stitched in.") remains word-for-word identical to About's `<h1>` (`app/(site)/about/page.tsx:30`), giving two distinct pages the same top-of-page heading.
  evidence: Confirmed by comparing `app/(site)/page.tsx:23` against `app/(site)/about/page.tsx:30`. Predates this fix (already present in the site owner's own uncommitted edit); the site owner explicitly chose to keep the new `<h1>` text over reverting to the original "A sense of place, stitched in." when this fix restored the eyebrow, so resolving the duplication itself needs a separate copy decision.

- source_spec: `_bmad-output/implementation-artifacts/spec-homepage-hero-eyebrow-copy.md`
  summary: The homepage hero's new eyebrow "Weathered Thread" repeats the nav wordmark (`components/nav-header.tsx:24`) directly above it and the root `<title>` (`app/layout.tsx:28`), unlike every other eyebrow on the site (Launch Collection, Process, About), which is section-specific rather than a brand-name repeat.
  evidence: Confirmed via grep across the three files. This was the site owner's explicit choice among three offered options ("Weathered Thread", "Embroidered Apparel", "Est. for the towns worth remembering"), not an oversight — flagged for possible reconsideration, not changed unilaterally.

- source_spec: `_bmad-output/implementation-artifacts/spec-sitewide-footer-non-home-pages.md`
  summary: The footer's copyright line ("© Weathered Thread") has no year, which is more noticeable now that it ships on every route instead of Home alone.
  evidence: Confirmed the text is unchanged, verbatim from Home's original footer (predates this story); adding a year is a copy decision, not this story's scope.

- source_spec: `_bmad-output/implementation-artifacts/spec-sitewide-footer-non-home-pages.md`
  summary: `text-marsh-sage` (`#7C8567`) on `--color-sailcloth` (`#EFEAE0`) computes to roughly 3.24:1 contrast, below WCAG AA's 4.5:1 for normal-size text, and the footer's caption-mono/uppercase text is small — this was previously confined to Home's footer and now ships on every route under `(site)`.
  evidence: Confirmed the token pair and markup are unchanged from Home's original footer (predates this story); distinct from the already-logged "no automated contrast check" gap above (`spec-1-2-site-wide-navigation.md` entry), which covers Wet-Ink-on-Sailcloth and Sailcloth-on-Deep-Harbor, not this pair. Fixing the token value is a brand-color decision bigger than this story's scope.

- source_spec: `_bmad-output/implementation-artifacts/spec-sitewide-footer-non-home-pages.md`
  summary: The footer's "Shipping · Returns" text has no destination — it is not a link, and no shipping/returns page exists anywhere in `app/` — so every route now surfaces a non-actionable label that reads like it should be clickable.
  evidence: Confirmed via route listing (no matching page) and `website-build-handoff-prd.md:81`, which lists shipping policy/returns copy as planned but not yet built; the text/markup is unchanged from Home's original footer, so this predates this story and building the actual page is a larger scope than this fix.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-motif-selection-on-collection-story.md`
  summary: `lib/placeholder-motif-data.ts`'s flat, global motif list has no per-collection scoping field, so once a second collection exists, every collection page (and the `/collections/[slug]/[motif]` stub's `generateStaticParams`) would render/pre-render all motifs from every collection rather than just its own.
  evidence: Confirmed via code reading — neither `app/(site)/collections/[slug]/page.tsx` nor the new `[motif]/page.tsx` filters by `collection.slug`, and no field exists on `Motif` to filter by. Currently produces no observable divergence since exactly one collection (`sea-isle`) exists anywhere in the codebase; mirrors Story 3.1's own explicit precedent of applying one flat placeholder list uniformly ahead of real Epic 2 data, so scoping this properly is out of scope until a second collection or real authored-motif data lands.

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-motif-selection-on-collection-story.md`
  summary: No automated test coverage exists for `getMotif()`'s not-found path, the 13 motif slugs' uniqueness, or `MotifTileLink`'s tap/`aria-current`/modifier-click behavior — the first tap-to-select Client Component pattern in the repo, which later Epic 3 stories are likely to follow.
  evidence: Confirmed repo-wide — no test files, config, or `package.json` script exist anywhere (same pre-existing, project-wide gap logged against nearly every prior story, e.g. `spec-1-5-homepage-email-signup.md`, `spec-1-2-site-wide-navigation.md`); establishing a test framework is a project-level decision bigger than any one story's scope.
