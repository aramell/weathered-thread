# Epic 1 Context: Site Foundation, Brand System & Storytelling

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A visitor can land on the site with the full brand identity applied — colors, typography, spacing — and immediately understand what Weathered Thread is. They can navigate to Shop, Collections, or About from anywhere via a consistent nav header, browse the homepage in its fixed section order, read the Sea Isle Collection Story (place/story narrative + motif gallery) before picking anything, read the brand's philosophy on About, and sign up for email updates. This epic establishes the design system and storytelling surfaces every later epic's UI builds on top of.

## Stories

- Story 1.1: Homepage Renders With Brand Identity
- Story 1.2: Site-Wide Navigation
- Story 1.3: Sea Isle Collection Story Page
- Story 1.4: About Page
- Story 1.5: Homepage Email Signup

## Requirements & Constraints

- Homepage renders in this fixed order: Hero → Sea Isle feature → brand idea/story → shop/product grid → product philosophy → embroidery/detail section → lifestyle imagery → email signup → footer. Product philosophy ("Made to look better lived in") is distinct from the brand idea/story section ("The embroidery is the medium. The feeling is the product."); lifestyle imagery is atmospheric real-world photography (wood/porch/boardwalk/beach) placed late. Both are newly added sections as of a 2026-09-15 brand refinement — supersedes any older 7-section version.
- Only the five brand colors (Sailcloth, Wet Ink, Deep Harbor, Marsh Sage, Antique Brass) plus supporting tones Paper Raised/Line are used anywhere — never a sixth color, never pure white/black. Deep Harbor covers full-bleed dark sections (hero/story block, footer) but must never read as generic nautical navy.
- Three typefaces, one job each: Fraunces for display/headline moments only (hero, collection-story headlines, section headers) — never body copy; Libre Franklin for body copy/story paragraphs/narrative (a 2026-09-15 correction — body previously, incorrectly, used Fraunces); IBM Plex Mono for everything functional (nav, labels, prices, captions).
- Cards/raised surfaces use `rounded.DEFAULT`; buttons use `rounded.sm`; nothing exceeds `rounded.md` except the `rounded.full` swatches (Epic 3).
- Mobile-first at ~390px+: single-column, `gutter-mobile` padding, no horizontal scroll; desktop uses wider `gutter-desktop` and may run story sections image+text side by side. Tap targets ≥ 44×44px. Images lazy-load behind a Paper Raised/Sailcloth placeholder, no spinner on cold load. Wet Ink-on-Sailcloth and Sailcloth-on-Deep-Harbor text must clear WCAG AA. No carousels, popups, discount modals, countdowns, or scarcity UI.
- Nav shows SHOP/COLLECTIONS/ABOUT as text labels at every breakpoint plus search/bag icons — no separate icon-forward mobile treatment (confirmed during Story 1.2's review). Sticky on mobile once scrolled past; constant Sailcloth surface, no tint/shadow, only a Line hairline once scrolled.
- Sea Isle has exactly 13 authored motifs; the Collection Story gallery must show all 13 with these exact names (a 2026-09-15 correction — do not use an older name list): Sea Isle City Waves, Pickleball, Beach Chair, Seagull, Bicycle, Turtle, Life Preserver / N.J., Exit 17 / Sea Isle City, Sea Isle shoreline / sailboat, SIC Water Tower, Sea Isle Boat, Lobster Loft, Smile You're in Sea Isle. Note two distinct boat/shoreline motifs, not one generic "Boat." This page covers browsing/reading only — tapping a motif to start the picker is Epic 3's.
- About renders brand idea/philosophy/tagline with the same brand tokens, with no product grid, picker, or purchase path. Its How It's Made content must use this handmade-variation language exactly: "The beauty is in the details." and "Because each piece is embroidered individually, slight variations in stitching and finish are natural. These little differences are part of the character of a handmade piece." It must also state processing time confidently using the term "processing time" (e.g. "Made to order. Please allow [X–X business days] for your piece to be embroidered and prepared for shipment.") — the exact day range is an open pre-launch item, don't invent one — and position Sea Isle as the first chapter of a broader place-based brand.
- Email signup: valid submission calls the `subscribeEmail` Server Action (sends via Resend) and shows a plain-language success message; invalid/empty submission is validated inside `subscribeEmail` only and shows a plain-language error. `RESEND_API_KEY` never reaches the client bundle.
- Voice throughout: full sentences, quiet confidence — no exclamation marks, urgency, or scarcity language; never apologize for handmade variation as a flaw or hedge with "processing times may vary."

## Technical Decisions

- Server-Components-first App Router: every route in this epic renders as a Server Component by default; no client-side interactivity needed here (email signup posts to a Server Action).
- No global client store; no accounts, login, personalization, or session state anywhere on the site.
- Every email-capture entry point posts to exactly one Server Action, `subscribeEmail` (`app/(site)/actions.ts`) — never a route handler or second implementation.
- Catalog/narrative content (motif names, story copy) is repo-authored TypeScript/JSON under `content/`, not a database. Story 1.3's motif list is authored content, never synced from Squarespace.
- Design tokens (colors, typography, spacing, radii) should be real, reusable tokens per `DESIGN.md`, not one-off hardcoded values, since Epics 2–4 build on the same system.

## UX & Interaction Patterns

- `nav-header`: Sailcloth surface, Wet Ink text, `label-mono` labels; bag icon shows no count badge pre-launch.
- `collection-story-block`: Deep Harbor surface, Sailcloth text, `display-lg` heading; scroll-triggered reveal only, one-time, no autoplay/carousel. Shared between Home (Sea Isle feature) and the Collection Story page — keep the component consistent rather than diverging implementations.
- `button-primary` (Deep Harbor fill, Sailcloth label): exactly one per screen (e.g. "Shop the Collection").
- `button-secondary` (transparent, Wet Ink border/text): secondary actions only, always paired with a `button-primary`, never standing alone.
- `motif-tile` (Paper Raised surface, `caption-mono` name label): read-only browsing here — selection behavior belongs to Epic 3. Every tile carries a visible text name, never color/image-only identification.
- Focus/reading order follows visual order on every surface. Breakpoint: no exact px set during Discovery — treat ~768px as the mobile/desktop split absent a build-time override.

## Cross-Story Dependencies

- Story 1.2's nav-header must render on every page the other stories add.
- Story 1.3's 13 motif names are the actual authored set Epic 2 (Story 2.2) and Epic 3 (motif selection, Product surface) consume later — get the names right here.
- Story 1.4 has an open pre-launch item: the `[X–X business days]` processing-time range needs a real number confirmed before it's launch-ready.
- Story 1.1's shop/product grid section reuses the `product-card` component that Epic 3's Shop surface will also use — keep it shared, not duplicated.
