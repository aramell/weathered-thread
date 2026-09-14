---
title: 'Homepage Renders With Brand Identity'
type: 'feature'
created: '2026-09-14'
status: 'in-review'
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

## Design Notes

Email signup's submit button reuses `button-primary`'s visual treatment as a plain inline `<button>`, not the shared component — "Shop Sea Isle" is Home's one canonical `button-primary` instance, keeping to the one-primary-per-screen rule while matching the mockup's identical styling for both buttons.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors
- `npm run build` -- expected: builds cleanly, no type errors

**Manual checks (if no CLI):**
- `npm run dev`, load `/` at 390px and ≥1024px widths; confirm section order, colors/fonts, and no horizontal scroll at mobile width.
