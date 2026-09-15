---
title: 'Site-Wide Navigation'
type: 'feature'
created: '2026-09-14'
status: 'done'
route: 'dispatch'
review_loop_iteration: 1
context: []
baseline_commit: '3d38a7326ab6302483cbfc6b573206b254ffe87e'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Only Home exists, and it has no persistent navigation — visitors can't reach Shop, Collections, or About, and no shared layout wraps site pages yet, so every future page would need to build its own nav.

**Approach:** Build `nav-header` — SHOP/COLLECTIONS/ABOUT links plus search and bag icons — as a Server Component, with the scroll-triggered sticky/hairline behavior isolated into a single small Client Component. Wire it into a new `app/(site)/layout.tsx` so every route under the group inherits it.

## Boundaries & Constraints

**Always:** `nav-header` renders SHOP, COLLECTIONS, ABOUT as `label-mono` text links (Sailcloth surface, Wet Ink text) plus a search icon and a bag icon, present on every route under `app/(site)/`, as uniform text links at every breakpoint (no separate mobile icon-forward treatment). SHOP/COLLECTIONS/ABOUT link to `/shop`, `/collections`, `/about` respectively — same precedent as Story 1.1's "Shop Sea Isle" linking to `/collections/sea-isle` before that page existed. Nav renders on a constant Sailcloth surface matching the ambient page background (so it visually disappears pre-scroll) with no additional tint or shadow beyond that; once the visitor scrolls past it on mobile, it becomes `position: sticky` with a `Line` hairline; desktop nav never goes sticky and never shows the hairline. Only the scroll-tracking state lives in a Client Component (`components/nav-scroll-shell.tsx`); `nav-header.tsx` itself stays a Server Component and is passed as `children` into that shell — it must not carry `'use client'`. All tap targets ≥44×44px in both dimensions (add horizontal padding/min-width to text links as needed — text width alone does not satisfy this); icons carry `aria-label`s, never color/icon-only identification.

**Never:** Do not build the Shop, Collections, About, or Search pages themselves — those are later stories; the links may 404 until they ship, matching 1.1's precedent. Do not give the bag icon an `href` or a count badge — the IA has no standalone bag/cart surface; "bag" is always scoped to one product's Add to Bag → Checkout Handoff (Epic 4), so render it as a visual-only icon, not a dead link. Do not add a hamburger/drawer menu — three top-level items fit inline at every width per `EXPERIENCE.md`. Do not enable `cacheComponents`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mobile, pre-scroll | ~390px, scrollY = 0 | Nav renders inline, no hairline, not sticky | N/A |
| Mobile, post-scroll | ~390px, scrolled past nav | Nav becomes `position: sticky; top: 0` with a `Line` hairline | N/A |
| Desktop | ≥768px | Nav renders as a static text-label row; never sticky, never a hairline | N/A |

</frozen-after-approval>

## Code Map

- `app/(site)/layout.tsx` -- new, Server Component: wraps `children` with `<NavHeader />`; Home's own `<main>` markup is untouched.
- `components/nav-header.tsx` -- new, Server Component: brand mark, SHOP/COLLECTIONS/ABOUT `next/link`s (`label-mono`, Wet Ink), inline-SVG search icon (`aria-label="Search"`, no href yet — Story 3.5) and bag icon (`aria-label="Bag"`, non-interactive), rendered as `children` of `<NavScrollShell>`.
- `components/nav-scroll-shell.tsx` -- new, `'use client'`: the only client boundary in this story — a `scroll` listener toggling sticky/hairline classes on mobile; renders `children` (the server-rendered nav content) unchanged.
- `app/globals.css` -- reference only, no edits expected; Sailcloth/Wet Ink/Line colors, `label-mono` type, and spacing tokens already exist from Story 1.1.

## Tasks & Acceptance

**Execution:**
- [x] `components/nav-scroll-shell.tsx` -- build the client scroll-state wrapper -- isolates `'use client'` to the smallest unit per epic constraint
- [x] `components/nav-header.tsx` -- build the Server Component nav markup (links + icons) -- reused by the new site layout
- [x] `app/(site)/layout.tsx` -- wrap `children` with `<NavHeader />` -- makes nav persistent across every site route

**Acceptance Criteria:**
- Given a visitor is on any page, when the page renders, then `nav-header` shows SHOP, COLLECTIONS, ABOUT, a search icon, and a bag icon.
- Given a visitor is on mobile, when they scroll past the nav, then it becomes sticky with a `Line` hairline; before that, no shadow and no color beyond the constant Sailcloth surface.
- Given a visitor is on desktop, then nav items render as text labels and the nav never goes sticky.
- Given a visitor taps SHOP, COLLECTIONS, or ABOUT, when the tap registers, then they navigate to `/shop`, `/collections`, or `/about` respectively.

## Implementation Notes

- `nav-scroll-shell.tsx` owns the `<header>` element and measures its own `offsetHeight` on mount, then toggles `sticky`/hairline classes once `window.scrollY` exceeds that height; `md:static md:border-b-0` unconditionally cancels both at desktop widths regardless of JS state, so desktop can never go sticky even under edge-case scroll timing.
- Judgment call on "no fill": DESIGN.md describes `nav-header` as "Sailcloth surface ... no color fill, no shadow, a Line hairline at most on scroll." Read literally as "never any background," a sticky nav would go fully transparent and overlap darker sections below it (e.g. the Deep Harbor collection-story-block), putting Wet Ink text on a near-black background with poor contrast. Implemented `bg-sailcloth` as a constant, always-on surface (matching the ambient page background so it visually "disappears" pre-scroll) and read "no color fill" as "no extra/different tint or shadow beyond that," rather than true transparency. Flagging this for confirmation since the frozen spec text could support either reading.
- Search icon and bag icon are both rendered as non-interactive `<span role="img" aria-label="...">` wrappers (44x44px) around inline SVGs with `aria-hidden="true"` — neither has an `href` or `onClick` yet; Story 3.5 is expected to turn the search icon into a real control.
- Brand mark ("Weathered Thread", linking to `/`) was added per the Code Map's mention of a "brand mark" in `nav-header.tsx`; not explicitly covered by the Acceptance Criteria or I/O matrix, but included for a complete nav row.
- Matrix Test Audit (orchestrator, post-implementation): verified all three I/O rows against live computed styles via `chrome-devtools-mcp` (`resize_page` + `getComputedStyle`), not just markup. At <768px, post-scroll: `position: sticky`, `border-bottom-width: 1px`, pinned at `top: 0`. At 1280px, post-scroll (scrollY 1200): `position: static`, `border-bottom-width: 0px`, `top: -1200` — confirms the header scrolls away normally rather than staying pinned. Pre-scroll at both widths: `position: static`, no border. All three rows pass. Confirmed the `bg-sailcloth`-vs-"no fill" judgment call reads correctly in the browser — nav is indistinguishable from the page pre-scroll and stays legible over the Deep Harbor section once sticky.

## Spec Change Log

- **2026-09-15, review loop 1 (human-resolved intent_gap):** Two ambiguities in the frozen Intent were flagged during review and resolved by the human:
  1. "No color fill" pre-scroll was ambiguous between true transparency and a constant Sailcloth surface. Resolved: keep the shipped constant `bg-sailcloth` surface (already-implemented judgment call confirmed as final intent). Boundaries & Constraints and the AC line were reworded to state this explicitly and remove the ambiguity.
  2. `epic-1-context.md` called for "icon-forward" mobile nav controls, conflicting with the frozen spec's uniform text-links-at-every-breakpoint. Resolved: keep the shipped uniform text links (already-implemented) as final intent; `epic-1-context.md`/`epics.md` are being updated separately so they no longer contradict this spec.
  - KEEP: the existing `nav-header.tsx`/`nav-scroll-shell.tsx` visual/structural approach is confirmed correct and must not be re-derived from scratch — only the two verified `patch` bugs below (tap-target width, stale `navHeight`) need code changes.

## Review Triage Log

- **`bg-sailcloth` is applied unconditionally, contradicting the frozen "no color fill or shadow" pre-scroll requirement** (`components/nav-scroll-shell.tsx:37`; frozen Boundaries line 22: "static (no fill, no shadow) until the visitor scrolls past it"; AC line 52: "before that, no color fill or shadow") — `high` / **intent_gap**. Verified live: `getComputedStyle(header).backgroundColor` is `rgb(239, 234, 224)` (Sailcloth) at `scrollY: 0`, i.e. before any scroll. This is the exact ambiguity the implementer already flagged in Implementation Notes ("Flagging this for confirmation since the frozen spec text could support either reading") and shipped without resolving. Root cause is inside the frozen Boundaries & Constraints text itself — needs human disambiguation between "no fill" read literally (transparent) vs. the implemented always-on Sailcloth surface.
- **Frozen spec commits nav-header to uniform text links on every route, but the epic-level constraint calls for icon-forward controls on mobile** (`components/nav-header.tsx`; frozen Boundaries line 22 vs. `epic-1-context.md:41,47`: "text labels on desktop, icon-forward on mobile") — `high` / **intent_gap**. Verified: epic-1-context.md states the icon-forward-on-mobile requirement twice; spec-1-2's own frozen Boundaries instead commits to SHOP/COLLECTIONS/ABOUT as text links "present on every route," with no mobile-specific icon treatment, and nothing flags this as a deliberate narrowing (unlike the bg-sailcloth call above). Needs human resolution: follow the epic's icon-forward-mobile pattern, or confirm the frozen spec's simplification is the intended final scope.
- **Two of three primary nav links fail the frozen spec's own "all tap targets ≥44×44px" requirement** (`components/nav-header.tsx:29-36`; frozen Boundaries line 22) — `medium` / `patch`. Verified live at 1600px width: "Shop" renders 31.7px wide, "About" 39.6px wide (only "Collections" at 87px clears it) — all three are 44px tall (`min-h-11`) but have no horizontal padding/min-width, so width is left to intrinsic text size. This directly contradicts the story's own recorded Matrix Test Audit claim that "all tap targets ≥44px" passed — that check appears to have only confirmed height. Smallest fix: add horizontal padding or `min-w-11` to the nav `Link` className.
- **`navHeight` is measured once via `offsetHeight` at mount, never recalculated on resize, orientation change, or webfont-load reflow** (`components/nav-scroll-shell.tsx:22-28`) — `medium` / `patch`. Verified by reading the code: the `useEffect` has an empty dependency array and no resize/ResizeObserver listener, so the sticky/hairline scroll threshold can go stale after any of those events. Smallest fix: recompute `navHeight` inside `handleScroll` (or via a resize listener) instead of capturing it once.
- **Nav sticky/hairline toggle has no automated verification** — `defer` (verification-gap layer, pre-verified). No test framework exists in the repo (confirmed: no jest/vitest/playwright, no test script); the only check is a one-time manual chrome-devtools-mcp pass recorded in prose. A regression to the sticky/hairline logic would ship undetected. Deferred as a project-wide test-infrastructure decision, not a fix scoped to this story.
- **Brand color-contrast (Wet-Ink-on-Sailcloth, Sailcloth-on-Deep-Harbor) has no automated WCAG AA check** — `defer` (verification-gap layer, pre-verified). `epic-1-context.md:32` states this as a hard requirement; nothing in the repo (no axe/pa11y, no lint rule) would catch a future token change that breaks it. Same root cause as above — no a11y-check infrastructure exists yet.
- **`components/collection-story-block.tsx` has no `prefers-reduced-motion` check for its fade reveal** — not this story's problem (introduced by Story 1.1, `cab085d`; surfaced only because this review's diff range inadvertently included Story 1.1's cumulative changes). Deferred against spec-1-1.
- **`app/globals.css`'s `--text-display-lg-mobile` token omits a letter-spacing value present on its desktop counterpart** — not this story's problem (Story 1.1's `globals.css`, same diff-range artifact as above). Deferred against spec-1-1.
- **Email signup form / `app/globals.css` dark-mode removal findings** — `false`, already fixed/adjudicated in spec-1-1's own review pass (commit `2d78946`); resurfaced here only because of the diff-range artifact above, not re-filed.
- **No `aria-current="page"` active-route indication on nav links** — `low`, rejected. Not required by spec or epic context; a full fix needs client-side pathname awareness, which conflicts with the frozen "`nav-header.tsx` must not carry `'use client'`" constraint — more than a direct correction, and unlikely to block real users in everyday use.
- **Search/Bag icons use `<span role="img" aria-label="...">` wrappers, which Story 3.5 will need to rework when Search becomes interactive** — `low`, rejected. A legitimate accepted a11y pattern for today's non-interactive icons; the concern is speculative future-rework cost, not a current defect.
- **Bare `z-10` on the sticky header with no documented z-index scale** — `low`/`false`, rejected. No other z-indexed element exists yet to collide with; nothing currently demonstrates a problem.
- **Matrix Test Audit didn't test exactly at the 768px breakpoint boundary** — `maybe-false`, rejected. If true, would only be a `low`-severity pixel-boundary edge case; no demonstrated failure.

## Design Notes

The client-boundary split follows `collection-story-block`'s precedent (Story 1.1) of isolating interactivity into its own component rather than marking a page or layout `'use client'` — here it goes one step further: even `nav-header.tsx` stays server-rendered, passed as `children` into the thin client shell that only tracks scroll position.

The bag icon has no IA-defined destination before Epic 4 (it's always scoped to a specific product's Add to Bag, never a standalone cart) — it renders visual-only rather than as a dead link.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors
- `npm run build` -- expected: builds cleanly, no type errors

**Manual checks (if no CLI):**
- `npm run dev`, load `/` at ~390px: nav starts non-sticky with no hairline, becomes sticky with a hairline after scrolling past it, search/bag icons visible, all tap targets ≥44px.
- At ≥1024px: nav never goes sticky, items render as text labels.
