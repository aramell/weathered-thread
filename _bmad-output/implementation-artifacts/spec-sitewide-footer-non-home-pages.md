---
title: 'Site-wide footer on non-Home pages'
type: 'refactor'
created: '2026-09-16'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `app/(site)/layout.tsx` only injects the persistent nav, so Home is the only route with a footer (copyright/shipping info) — About and every Collection Story page end with no footer at all (logged in `_bmad-output/implementation-artifacts/deferred-work.md`, source `spec-1-4-about-page.md`).

**Approach:** Extract Home's existing inline `<footer>` markup (`app/(site)/page.tsx`) into a shared `Footer` component and mount it in `app/(site)/layout.tsx` after `{children}`, matching the existing persistent-nav pattern (`NavHeader` in the same layout). Remove the now-duplicate inline footer from Home's page markup. No copy or visual changes — same content, same classes, now rendered once for every route under `(site)`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Home route (`/`) | Visit homepage | Footer renders once, directly after the email-signup section, identical markup/styling to today | N/A |
| About route (`/about`) | Visit About | Footer renders at the end of the page (previously absent) | N/A |
| Collection route (`/collections/[slug]`) | Visit e.g. `/collections/sea-isle` | Footer renders at the end of the page (previously absent) | N/A |

</frozen-after-approval>

## Code Map

- `app/(site)/page.tsx:77-81` -- source of the current inline `<footer>` markup (`© Weathered Thread` / `Shipping · Returns`, `flex items-center justify-between px-gutter-mobile py-6 font-mono text-caption-mono uppercase text-marsh-sage md:px-gutter-desktop`) to lift verbatim into the new component, then delete from this file.
- `app/(site)/layout.tsx` -- persistent-nav pattern to mirror: `NavHeader`/`NavScrollShell` render ahead of `{children}`; add `Footer` after `{children}` the same way.
- `components/nav-header.tsx` -- style reference for a new plain Server Component (no `'use client'`, minimal top-of-file comment, no props needed for `Footer`).
- `app/(site)/about/page.tsx`, `app/(site)/collections/[slug]/page.tsx` -- currently render no footer; nothing to change here, they inherit it from the layout.
- `app/layout.tsx:38` -- root `<body>` is `flex flex-col`; footer stays in normal flow (not viewport-pinned), same visual behavior Home has today.

## Implementation Notes

- Created `components/footer.tsx` (plain Server Component, no props) with the exact markup/classes lifted from Home's inline footer.
- Mounted `<Footer />` in `app/(site)/layout.tsx` after `{children}`, mirroring the `NavHeader` pattern already in that file.
- Removed the inline `<footer>` block from `app/(site)/page.tsx`.
- Verified: `npm run lint` clean, `npm run build` succeeds, and `curl` against a local dev server confirmed the footer HTML is present and identical on `/`, `/about`, and `/collections/sea-isle`, with exactly one `<footer>` on Home (no duplicate).
- No surprises; matched the planned approach exactly.
- This resolves the gap logged in `_bmad-output/implementation-artifacts/deferred-work.md` (source `spec-1-4-about-page.md`: "No page besides Home renders a `<footer>`..."). Left the deferred-work.md entry itself untouched (append-only convention) — noting resolution here instead.

## Review Triage Log

- Comment in `components/footer.tsx` described "Shipping · Returns" as a "shipping link" when it is plain text with no `href` — **low, patch**: corrected the comment.
- `## Verification`'s manual-checks bullets were phrased as a pending TODO even though `## Implementation Notes` already reported those exact checks as performed and passed — **low, patch**: reworded below to reflect they were run.
- `spec` frontmatter `status: 'in-progress'` looked inconsistent with the completed-work notes — **false**: this is expected mid-workflow state; the Finalize Spec step (next) sets `status: 'done'` after review triage completes.
- Missing copyright year in "© Weathered Thread" — **low, defer**: pre-existing (unchanged from Home's original footer), not caused by this change; logged to `deferred-work.md`.
- `text-marsh-sage` (#7C8567) on `--color-sailcloth` (#EFEAE0) computes to ~3.24:1, below WCAG AA's 4.5:1 for normal text — **medium, defer**: pre-existing color-token choice (unchanged from Home's original footer), not caused by this change, but now shipped sitewide instead of Home-only; logged to `deferred-work.md`.
- "Shipping · Returns" has no destination — no shipping/returns page exists anywhere in `app/` (confirmed against `website-build-handoff-prd.md:81`, which lists it as planned, not built) — **low, defer**: pre-existing on Home, unchanged text/markup, not caused by this change; logged to `deferred-work.md`.
- Footer's two `<span>`s have no semantic wrapper (no `<nav>`/`aria-label`), unlike `NavHeader`'s labeled `<nav>` — **rejected (low)**: markup is an unchanged, verbatim copy of Home's original footer; there is no interactive content to label yet, and adding structure now for hypothetical future links would be premature, not a simple correction.

## Verification

**Manual checks performed:**
- Ran the dev server and visited `/`, `/about`, and `/collections/sea-isle`: footer rendered once per page, at the very end, with unchanged copy/styling on Home and newly present (identical styling) on About and the Collection page. Confirmed via `curl` — exactly one `<footer>` on Home, present on all three routes.
- `npm run lint` and `npm run build` both passed.
