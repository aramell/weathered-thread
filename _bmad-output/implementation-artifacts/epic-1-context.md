# Epic 1 Context: Site Foundation, Brand System & Storytelling

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

This epic establishes the visitor-facing foundation of the site: the brand identity (colors, type, spacing, shape) applied consistently, a persistent navigation shell, and the three "storytelling" surfaces a visitor sees before ever touching the garment×motif picker — the homepage, the Sea Isle Collection Story, and About — plus the homepage's email capture. It matters because the brand's core idea (PLACE → STORY → MOTIF → OBJECT) has to be felt on first load, not just be navigable; later epics (catalog data, picker, checkout handoff) build on the shell and tokens this epic delivers.

## Stories

- Story 1.1: Homepage renders with brand identity, fixed section order
- Story 1.2: Site-wide navigation (`nav-header`)
- Story 1.3: Sea Isle Collection Story page (story block + motif gallery, browse-only)
- Story 1.4: About page
- Story 1.5: Homepage email signup via Resend

## Requirements & Constraints

- Homepage section order is fixed: Hero → Sea Isle feature → brand idea/story → shop/product grid → embroidery/detail section → email signup → footer. Do not reorder.
- Nav is present on every page: SHOP, COLLECTIONS, ABOUT, search icon, bag icon. Tapping SHOP/COLLECTIONS/ABOUT routes to their respective surfaces (Shop and Search results themselves are out of scope for this epic — Epic 3).
- Sea Isle Collection Story renders the `collection-story-block` first, then a motif gallery of all 13 authored motifs (Seagull, Wave, "Smile You're in Sea Isle", Water Tower, Life Ring, Turtle, Bike, Boat, Exit 17, Nautical Map – Fish Alley, Beach Chair, Pickleball, Lobster Loft), each with its real name label. Tapping a motif to start the picker is Epic 3's concern — this epic is browse/read only.
- About page uses the same brand tokens as the rest of the site and contains no product grid, picker, or purchase path.
- Mobile-first: every surface in this epic must work correctly at ~390px width first, with no horizontal scroll, before desktop layout is considered.
- All interactive elements (nav items/icons, buttons) need tap targets ≥ 44×44px.
- Motif tiles and any color/label UI need real text labels, never color/image-only identification; screen readers must announce selection-state changes where selection exists.
- Text/background contrast for Wet Ink-on-Sailcloth and Sailcloth-on-Deep-Harbor must clear WCAG AA at body text size.
- No accounts, login, personalization, or session state anywhere.
- No carousels, popups, discount modals, countdown timers, or scarcity UI — the collection story block uses a one-time scroll-triggered reveal, never autoplay.
- Cold load shows no spinner: images lazy-load behind a Sailcloth/Paper Raised placeholder.
- Email signup: the Resend API key must never reach the client bundle; validation errors and success must be shown in plain, non-hyped language (e.g. not "Buy Now!!"/exclamation-heavy copy).

## Technical Decisions

- The repo is already a `create-next-app` Next.js 16.3.5 App Router scaffold — this epic builds on it, it does not scaffold a new app.
- Server-Components-first: every route renders as a Server Component by default. `'use client'` is reserved for actual interactivity (e.g. the nav's scroll-triggered sticky/hairline state, the collection story's scroll-reveal trigger) — there is no global client store and no picker state to manage in this epic (that's Epic 3's `ProductPickerShell`).
- Routes live under `app/(site)/`: Home, Shop, Collections, About, Search. The Sea Isle Collection Story is under `collections/[slug]/`. This epic implements Home, the Collection Story, and About; Shop/Search pages themselves are Epic 3.
- Email signup goes through exactly one Server Action, `subscribeEmail`, defined in `app/(site)/actions.ts`. It is the only email-capture entry point on the site (others may reuse it later); all validation lives inside it. It calls Resend via the Vercel Marketplace integration. The Resend key is read only from `RESEND_API_KEY`, server-side only, never referenced from a Client Component.
- `Next.js` `cacheComponents` flag stays off — this epic's content is static/build-time, no per-request dynamic data, default static rendering is sufficient.
- Motif and collection content (names, story copy) for Sea Isle is repo-authored data (produced by Epic 2's `content/catalog/{sku}/authored.ts` + collection grouping) — this epic reads/renders it but does not build the sync pipeline.
- Brand tokens to implement as real values (not placeholders): colors — Sailcloth `#EFEAE0`, Wet Ink `#2B2A26`, Deep Harbor `#2F4858`, Marsh Sage `#7C8567`, Antique Brass `#A8823C`, Paper Raised `#F7F4EC`, Line `#D9D2C2`. Typography — Fraunces for display/headline/body (with a distinct mobile display size), IBM Plex Mono for label/price/caption, as real webfonts (not system-font fallback). Spacing scale 1–7 (4px–48px) plus `gutter-mobile` (20px), `gutter-desktop` (64px), `story-gap` (96px). Radii: `sm` 2px, `DEFAULT` 4px, `md` 6px, `full` 9999px (reserved for circular swatches, not used in this epic).
- Components this epic needs: `nav-header` (Sailcloth surface, Wet Ink text, label-mono labels; sticky + Line hairline on scroll on mobile only, text labels on desktop, icon-forward on mobile; no color fill/shadow), `collection-story-block` (Deep Harbor full-bleed surface, Sailcloth text, `display-lg` heading, scroll-triggered reveal), `button-primary` (Deep Harbor fill / Sailcloth label-mono text / `rounded.sm`; exactly one per screen; disabled not hidden when precondition unmet), `button-secondary` (transparent, Wet Ink border/text; never the primary action, always paired with a `button-primary` on the same screen), `product-card` (Paper Raised surface, body-type title, price-mono price, `rounded.DEFAULT`) for the homepage's shop/product grid section.

## UX & Interaction Patterns

- Deep Harbor is reserved for full-section, strong-contrast moments (Sea Isle feature block, footer) — it should never read as saturated "navy," and is not used as general decoration elsewhere.
- Scroll-triggered reveal for story sections (homepage's Sea Isle feature, the Collection Story block) is subtle, one-time, and never re-triggers on scroll-back; no autoplay/carousel anywhere.
- Nav: on mobile, becomes sticky once scrolled past and shows icon-forward controls; on desktop, items render as inline text labels and the nav does not need to go sticky. No hamburger drawer — three top-level items fit as-is.
- Voice/microcopy is quiet and plain: e.g. "Sea Isle. A story, stitched in.", not exclamation-driven or scarcity-flavored language; this applies to email signup confirmation/error copy too.
- Breakpoint for mobile/desktop is an assumption of ~768px (not finalized in planning) — a build-time decision may override it.

## Cross-Story Dependencies

- Story 1.2 (`nav-header`) is used by every other story in this epic (and by all later epics) — build it as the shared shell first.
- Story 1.3 depends on Sea Isle's 13 motifs already being authored content (name + story copy); it only renders/reads them, it does not create the authoring pipeline (Epic 2) or make motifs tappable into a picker (Epic 3).
- Story 1.1's "shop/product grid" homepage section reuses the `product-card` component that Epic 3's Shop surface will also use — keep the component shared rather than duplicated.
- Story 1.5's `subscribeEmail` Server Action is the one email-capture implementation the brand's AD-6 rule expects; any future signup entry point should call the same action rather than adding a second implementation.
