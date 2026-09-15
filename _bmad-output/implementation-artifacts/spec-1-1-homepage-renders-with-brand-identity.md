---
title: 'Homepage Renders With Brand Identity'
type: 'feature'
created: '2026-09-14'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '3d38a7326ab6302483cbfc6b573206b254ffe87e'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The site is still the unmodified `create-next-app` scaffold — no brand tokens, no homepage content. A visitor landing on it today sees Next.js boilerplate, not Weathered Thread.

**Approach:** Wire the five brand colors + two supporting tones, Fraunces/IBM Plex Mono typography, and the spacing/radius scale into Tailwind's theme, then build the homepage as Server Components rendering the seven fixed sections (Hero, Sea Isle feature, brand idea, shop grid, embroidery detail, email signup, footer) with the copy and layout from `mockups/key-home.html`. Catalog data and functional email submission are later stories; this story renders static, correctly-branded content in the mandated order.

## Boundaries & Constraints

**Always:** Brand colors/fonts/spacing come from Tailwind theme tokens (`app/globals.css` `@theme`) — no hardcoded hex or raw px in section components. Every route/section is a Server Component; no `'use client'` except the scroll-reveal trigger. Section order is exactly: Hero → Sea Isle feature (`collection-story-block`) → brand idea → shop grid → embroidery detail → email signup → footer. Mobile renders single-column with `gutter-mobile` padding, no horizontal scroll, at ~390px.

**Never:** Do not build `nav-header` (Story 1.2), the real Sea Isle Collection Story page or About page (Stories 1.3/1.4), or working `subscribeEmail` submission (Story 1.5) — render the signup form markup only, no action wired yet. Never fetch or reference `content/catalog/` (Epic 2 doesn't exist yet) — the shop-grid section uses the four static placeholder items from the mockup. Never enable `cacheComponents`. Never use `#FFFFFF` or `#000000` in place of Sailcloth/Wet Ink.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Mobile viewport | ~390px width | Single column, `gutter-mobile` padding, no horizontal scroll, 2-col max anywhere grids appear | N/A |
| Desktop viewport | ≥768px width | Sections may use `gutter-desktop`; shop grid may use up to 3 columns | N/A |
| Image placeholders | No real product photography exists yet | Swatch/preview slots render as flat Paper Raised/Sailcloth color blocks, no `<img>`, no spinner | N/A |

</frozen-after-approval>

## Code Map

- `app/globals.css` -- replace default `@theme` block with brand tokens: 7 colors, `display-lg`/`display-lg-mobile`/`headline`/`body`/`body-sm`/`label-mono`/`price-mono`/`caption-mono` type tokens, spacing 1-7 + gutter-mobile/gutter-desktop/story-gap, radii sm/DEFAULT/md/full.
- `app/layout.tsx` -- swap `Geist`/`Geist_Mono` for `Fraunces` (variable, `next/font/google`) and `IBM_Plex_Mono` (weights 400/500); update `metadata.title`/`description` to brand copy; keep `RootLayout` shape otherwise.
- `app/page.tsx` -- delete; homepage moves to the route group.
- `app/(site)/page.tsx` -- new Home page assembling the 7 sections in fixed order, using copy verbatim from `_bmad-output/planning-artifacts/ux-designs/ux-weathered-thread-2026-09-14/mockups/key-home.html`.
- `components/collection-story-block.tsx` -- new, `'use client'`: Deep Harbor full-bleed surface, Sailcloth text, `display-lg` heading, `IntersectionObserver`-driven one-time fade reveal (no re-trigger on scroll-back). Reused by Story 1.3.
- `components/product-card.tsx` -- new, Server Component: Paper Raised surface, `body` title, `price-mono` price, `rounded.DEFAULT`, color-block image placeholder. Reused by Epic 3's Shop grid.
- `components/button-primary.tsx` -- new, Server Component: Deep Harbor fill, Sailcloth `label-mono` text, `rounded.sm`, ≥44px tap height. Used once on Home for "Shop Sea Isle" (links to `/collections/sea-isle`, built in Story 1.3).

## Tasks & Acceptance

**Execution:**
- [x] `app/globals.css` -- add brand theme tokens -- required by every other task
- [x] `app/layout.tsx` -- swap fonts + metadata -- brand typography must load site-wide
- [x] `components/button-primary.tsx` -- build shared primary button -- reused Home + later epics
- [x] `components/product-card.tsx` -- build shared card -- reused Home + Epic 3 Shop grid
- [x] `components/collection-story-block.tsx` -- build scroll-reveal block -- reused Home + Story 1.3
- [x] `app/(site)/page.tsx` -- assemble Home from the 7 sections -- delete `app/page.tsx` in the same change

**Acceptance Criteria:**
- Given a visitor loads `/`, then sections render in order: Hero, Sea Isle feature, brand idea, shop grid, embroidery detail, email signup, footer.
- Given the page renders, then only Sailcloth/Wet Ink/Deep Harbor/Marsh Sage/Antique Brass/Paper Raised/Line appear as colors, Fraunces carries headings/body, IBM Plex Mono carries labels/price.
- Given the Sea Isle feature section, then it is full-bleed Deep Harbor with Sailcloth text and reveals on scroll, never on load or autoplay.
- Given a ~390px viewport, then layout is single-column with `gutter-mobile` padding and no horizontal scroll; the shop grid shows 2 columns.
- Given the email signup section, then the form markup (email input + submit button) renders but submitting does nothing yet (no action wired).

## Implementation Notes

- Implemented via subagent: brand theme tokens in `app/globals.css`, Fraunces/IBM Plex Mono in `app/layout.tsx`, homepage moved to `app/(site)/page.tsx`, shared `button-primary`/`product-card`/`collection-story-block` components. `npm run lint` and `npm run build` both clean.
- Visually verified in a real browser (chrome-devtools MCP) at 390px and 1280px: correct section order, single-column/2-col grid at mobile, 3-col grid + `gutter-desktop` at desktop, no horizontal scroll, brand colors/fonts render correctly, no nav present (expected — Story 1.2).
## Spec Change Log

## Review Triage Log

- **Email signup form causes full-page reload on submit** (`app/(site)/page.tsx:73-89`) — `medium` / `patch`. Filed pre-verified by verification-gap layer; independently re-confirmed live (dev server, browser JS inspection): the `<form>` has no `action`/`onSubmit`, so clicking "Join" does a native GET to `/`, contradicting AC "submitting does nothing yet (no action wired)". Fixed: dropped the `<form>` wrapper (rendered input/button as sibling elements) so there is no implicit submit action, per the smallest-fix note the verification-gap layer filed.
- **Sea Isle feature section reveals on load instead of on scroll** (`components/collection-story-block.tsx:22-46`) — `medium` / `patch`. Edge-case-hunter finding, verified live: at a 1600×711 viewport the section is 63% visible at `scrollY: 0` on initial paint, so the `IntersectionObserver`'s first (at-mount) callback already reports `isIntersecting: true` and fires the reveal with zero scroll — confirmed via JS inspection (`opacity-100`, `scrollY: 0` immediately after load). This contradicts AC "reveals on scroll, never on load or autoplay" (line 59). Fixed: the observer now ignores an `isIntersecting` report that arrives before any `scroll` event has fired on `window`, so the very first at-mount callback can no longer trigger the reveal.
- **`app/globals.css` drops the scaffold's `prefers-color-scheme` dark-mode variables** — `false`. No planning doc (DESIGN.md, EXPERIENCE.md, spec-1-1, epic-1-context.md) requires adaptive dark mode; the frozen Intent explicitly calls for wiring the five fixed brand colors into Tailwind's theme. Removing the `create-next-app` scaffold's dark-mode boilerplate is exactly what that intent calls for, not a regression.
- **`components/nav-scroll-shell.tsx` measures `navHeight` once at mount, no re-measure on resize/font-load** — not this story's problem (introduced by Story 1.2, `6e93e8b`, not Story 1.1). Deferred.
- **`app/(site)/collections/[slug]/page.tsx` `generateMetadata` reads `collection.story[0]` with no empty-array guard** — not this story's problem (introduced by Story 1.3, `88f345c`). Deferred.
- **Typography mismatch: shipped code still Fraunces/IBM Plex Mono vs. uncommitted planning-doc rework toward Libre Franklin** — not this story's problem (caused by the in-flight `sprint-change-proposal-2026-09-15.md` correct-course work, not by this story's code). Deferred.
- **Homepage section-order rework (product philosophy, lifestyle imagery) not yet in code** — not this story's problem (same in-flight correct-course work; spec-1-1's frozen intent predates it). Deferred.
- **spec-1-1's frozen Intent is stale relative to the sprint-change proposal but carries no flag marking it pending renegotiation** — not this story's problem (the correct-course workflow, not this build, owns updating/flagging frozen specs). Deferred.
- **Motif-name rework (13 new names) not yet reflected in `app/(site)/collections/[slug]/page.tsx` or `spec-1-3`** — not this story's problem (Story 1.3/1.4 territory). Deferred.
- **`epic-1-context.md` still quotes the old 13 motif names** — not this story's problem (cached context file tracks epics.md, which is mid-edit). Deferred.
- **New motif-name list in `epics.md` has inconsistent naming/capitalization convention** — not this story's problem (copy in a planning doc under active edit, not this story's code). Deferred.
- **New homepage sections (product philosophy, lifestyle imagery) are named in epics.md/EXPERIENCE.md but not scoped with the actual copy requirement** — not this story's problem (in-flight correct-course planning gap). Deferred.
- **"Lifestyle imagery" section leaves open a11y/loading-placeholder questions the rest of the epic answers explicitly** — not this story's problem (unresolved planning detail for a not-yet-built section). Deferred.
- **`[X–X business days]` placeholder appears in EXPERIENCE.md's Voice & Tone "Do" column with no bracket caveat** — `low` — rejected. Cosmetic; confined to an internal planning doc, unlikely to reach a real user, and epics.md's Story 1.4 AC already flags the same placeholder as an open item.
- **Sprint-change-proposal's claim that product-page content "already matched" the plan is uncited** — not this story's problem (a different in-flight planning document, not this story's code or spec). Deferred.
- **Sprint-change-proposal never links its own source document ("Next Iteration Notes")** — not this story's problem (same planning document). Deferred.
- **Documentation rigor (dated "Results" block) present in spec-1-3 but absent from spec-1-1/spec-1-2** — `low` — rejected. Process/documentation-consistency observation, not a product defect; unlikely to be encountered by an end user, and the underlying verification was in fact performed (just not written up in that format).
- **New About-page AC (handmade-variation, processing-time, "Sea Isle as first chapter" copy) gives no placement guidance relative to existing About content** — not this story's problem (a different, not-yet-built story's AC gap in epics.md). Deferred.

## Design Notes

Email signup's submit button reuses `button-primary`'s visual treatment as a plain inline `<button>`, not the shared component — "Shop Sea Isle" is Home's one canonical `button-primary` instance, keeping to the one-primary-per-screen rule while matching the mockup's identical styling for both buttons.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors
- `npm run build` -- expected: builds cleanly, no type errors

**Manual checks (if no CLI):**
- `npm run dev`, load `/` at 390px and ≥1024px widths; confirm section order, colors/fonts, and no horizontal scroll at mobile width.
