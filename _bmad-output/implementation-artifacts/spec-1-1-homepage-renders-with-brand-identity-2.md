---
title: 'Homepage — Libre Franklin Body Copy Migration'
type: 'feature'
created: '2026-09-15'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
baseline_commit: 'f6890ae1d9fa88ec86881bbc0bda2eb85a261b52'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The homepage (`app/(site)/page.tsx`) and its two shared components (`components/product-card.tsx`, `components/collection-story-block.tsx`) still render body copy in Fraunces (`font-display` paired with `text-body`/`text-body-sm`) — the typeface DESIGN.md's 2026-09-15 typography correction retired for paragraph-length copy in favor of Libre Franklin. Story 1.4 already wired the `font-body` (Libre Franklin) token and applied it correctly on the new About page, but never touched the pre-existing homepage.

**Approach:** Swap every `font-display` occurrence paired with `text-body` or `text-body-sm` to `font-body`, on Home's own markup (`app/(site)/page.tsx`: hero paragraph, embroidery-detail paragraph, email-signup tagline, email-signup input) and its two shared, body-copy-bearing components (`product-card.tsx`'s item-name `<p>`, `collection-story-block.tsx`'s children wrapper `<div>`). Leave every headline/display-sized element (`text-display-lg`, `text-headline`, the italic brand-idea pull-quote) and every mono/label element (nav wordmark, nav links, eyebrows, prices, footer) untouched — only body/body-sm-scaled text moves. `collection-story-block.tsx` is shared with the Collection Story page (Story 1.3); per `epic-1-context.md`'s "keep the component consistent rather than diverging implementations" rule, fixing it here also corrects that page's body copy as an intended, not incidental, side effect. `nav-header.tsx`'s wordmark uses `text-body` for a logotype, not paragraph copy, and is sitewide chrome rather than homepage content — left unchanged, out of this narrowly-scoped migration.

</frozen-after-approval>

## Implementation Notes

- `app/(site)/page.tsx`: swapped `font-display` → `font-body` on the hero paragraph, embroidery-detail paragraph, email-signup tagline, and email-signup `<input>`. Left the `text-headline` section headers, the italic `text-headline` brand-idea pull-quote, and the footer (`font-mono`) untouched.
- `components/product-card.tsx`: swapped the item-name `<p>` from `font-display text-body` to `font-body text-body`. Price (`font-mono text-price-mono`) untouched.
- `components/collection-story-block.tsx`: swapped the children wrapper `<div>` from `font-display text-body` to `font-body text-body`. The eyebrow (`font-mono`) and `<h2>` heading (`font-display text-display-lg...`) untouched. This component is shared with the Collection Story page (Story 1.3, `/collections/sea-isle`), so that page's body copy is now corrected too — an intended consequence per `epic-1-context.md`'s "keep the component consistent" rule, not an incidental side effect.
- `components/nav-header.tsx` left unchanged: its `text-body`-sized wordmark is a logotype, not paragraph copy, and nav is sitewide chrome rather than homepage content.
- Verified: `npm run lint` (no errors) and `npm run build` (compiles, all four routes prerender, no type errors). Inspected built HTML: `index.html` and `collections/sea-isle.html` now contain `font-body` on their paragraph text; nav wordmark class in `index.html` still reads `font-display text-body text-wet-ink` (unchanged); `about.html` (Story 1.4, already migrated) unaffected.

## Review Triage Log

- **[low → patch]** `app/layout.tsx`'s `Libre_Franklin` comment claimed `font-body` "is only applied on About's new copy for now" and "must not change" existing pages' output — both now false since this diff. Verified stale against the current diff. Fixed: rewrote the comment to describe the sitewide rule (body/body-sm-scaled text uses `font-body`; headline/display/mono elements don't) instead of a point-in-time scope claim.
- **[false]** (blind-hunter) `app/(site)/about/page.tsx`'s docstring "implies a distinction from the rest of the site" now that Home also uses `font-body`. Disproved: the docstring only states About's own local choice ("uses the corrected `font-body`... rather than Fraunces"), which remains true; it never claims exclusivity to About.
- **[low → reject]** (blind-hunter) `product-card.tsx`/`collection-story-block.tsx` docstrings don't record the Fraunces→Libre Franklin rationale inline, and nothing in the three changed files flags that `nav-header.tsx`'s wordmark or the Collection Story page's incidental re-typography are deliberate. Real absence, but this repo's established convention (every prior story, including this one and Story 1.4) documents such rationale in the committed spec artifact and commit message, not inline comments on every stylistic swap — consistent practice, not a gap. Fix would mean adding rationale comments this codebase doesn't otherwise use.
- **[false]** (blind-hunter) Rationale for the swap "lives only in an out-of-tree, session-scoped spec artifact" that risks being archived/deleted, leaving the diff unexplained. Disproved: every prior spec under `_bmad-output/implementation-artifacts/` (spec-1-1, spec-1-3, spec-1-3-2, spec-1-4) remains committed and present in the repo across multiple later commits — these are durable, version-controlled project history, not ephemeral scratch files.
- **[real, pre-existing, already tracked]** `epic-1-context.md`'s "product philosophy"/"lifestyle imagery" homepage sections still aren't built. Reviewer itself flagged this as out of scope for this narrowly-scoped font migration; already logged in `deferred-work.md` from Story 1.1's original review — no new entry added.
