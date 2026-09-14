---
name: Weathered Thread
status: final
sources:
  - '{planning_artifacts}/ux-designs/ux-weathered-thread-2026-09-14/imports/website-build-handoff-prd.md'
updated: 2026-09-14
---

# Weathered Thread — Experience Spine

> Custom-built storefront (browsing, storytelling, garment+design picker) handing off to Squarespace for payment only — no shared cart/checkout API exists between the two, so "Add to Bag" is a link-out to the matching Squarespace product page, not an embedded cart. Paired with `DESIGN.md`. Launch scope: adult apparel, one collection (Sea Isle), structured so future collections/kids/accessories can be added without a rebuild.

## Foundation

Responsive web, mobile-first (the primary purchase surface is a phone), desktop fully supported at wider breakpoints. No third-party UI system — this is a custom-built experience; `DESIGN.md` is the visual identity reference for it.

Two systems make up the full purchase path: this site (everything through "Add to Bag") and Squarespace (payment only, reached by link-out). `DESIGN.md` tokens govern this site's surfaces completely; they're an *aspirational reference* for how the linked Squarespace product pages should be configured to feel continuous, not a guarantee — Squarespace's own theme engine renders that half of the journey and won't hit every token exactly. Don't over-invest in matching it pixel-for-pixel; get palette and type close, and treat the handoff moment (see the Checkout Handoff row in Information Architecture, and the `checkout-handoff` component) as the seam that needs the most design attention, since that's where the brand's control ends.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Home | Site entry | Hero → Sea Isle feature → brand idea/story → shop grid → embroidery/detail section → email signup → footer (order fixed per brand PRD) |
| Shop | Nav: SHOP | Garment-type grid — Sweatshirts / Tees / (Hats, if sellable at launch) |
| Garment Type List | Shop tap | Grid of blanks in that garment type, by color |
| Collections | Nav: COLLECTIONS | List of town collections — Sea Isle only at launch, structured for more |
| Collection Story (e.g. Sea Isle) | Collections tap, or Home feature | PLACE → STORY narrative block, then a motif gallery for that town |
| Product (garment × motif) | From Garment Type List (garment chosen, motif next) **or** from Collection Story (motif chosen, garment next) | The converged, sellable unit — one specific garment + one specific motif |
| About | Nav: ABOUT | Brand story, philosophy |
| Search results | Search icon | Text search across garments and motifs |
| Checkout Handoff | Product → "Add to Bag" | Brief interstitial confirming the selection, then redirect to the matching Squarespace product page to pay |

Both entry paths (Shop-first and Collection-first) converge on the same Product surface — the garment+motif combination is identical either way, only the order of the two choices differs. No mega-menu, no filtering beyond garment type and collection at launch (brand PRD explicitly excludes complex filtering).

→ Composition reference: [`mockups/key-home.html`](mockups/key-home.html) (Home), [`mockups/key-collection-story.html`](mockups/key-collection-story.html) (Collection Story), [`mockups/key-product.html`](mockups/key-product.html) (Product). Checkout Handoff and the Shop/Garment Type List surfaces remain spine-only by choice — a visual reference wasn't judged necessary for a plain confirmation interstitial or a standard grid. Mocks illustrate; this table is the contract — spines win on conflict.

## Voice and Tone

Microcopy only; brand voice and aesthetic posture live in `DESIGN.md.Brand & Style`.

| Do | Don't |
|---|---|
| "Sea Isle. A story, stitched in." | "🌊 SHOP THE WAVE COLLECTION NOW!!" |
| "Add to Bag" | "Buy Now!!" / "Grab Yours Today" |
| "Continuing to checkout." (before the Squarespace redirect) | "Redirecting…" (generic, no sense of continuity) |
| "This design is currently out of stock in your size." | "Oops! Sold out 😢" |
| Full sentences, quiet confidence | Exclamation marks, urgency language, countdown/scarcity copy |

## Component Patterns

Behavioral only; visual specs live in `DESIGN.md.Components`.

| Component | Use | Behavioral rules |
|---|---|---|
| `motif-tile` | Collection Story motif gallery, Product motif switcher | Tap selects; selected tile shows the Antique Brass border and updates the on-garment preview image elsewhere on screen. Only one motif selected at a time within a given garment context. |
| `garment-swatch` | Garment Type List, Product page | Tap selects a color; updates the preview image to that garment color. Disabled (not hidden) swatches for colors with no confirmed inventory, per the PRD's inventory table. |
| `product-card` | Shop grid, search results | Tap → Product surface for that garment (motif unset, prompts a choice) or that garment+motif pairing if reached from a design-specific context. |
| `collection-story-block` | Home, Collection Story | Scroll-triggered reveal only (no autoplay, no carousel) — static narrative block, motif gallery below it. |
| `nav-header` | All surfaces | Sticky on scroll on mobile; SHOP / COLLECTIONS / ABOUT plus search and bag icon always reachable. Bag icon shows no count badge pre-launch (single-item "bag" is really just "proceed to this product's Squarespace page" — see `checkout-handoff`). |
| `button-primary` | One per screen: Add to Bag (Product), Shop the Collection (Home/Collection Story), Continue to Checkout (`checkout-handoff`) | Always the single primary action on its screen — never two `button-primary`s competing. Disabled state (not hidden) when its precondition isn't met (e.g. Add to Bag before a motif is chosen). |
| `button-secondary` | View Details, Back to Collection | Never used for the primary conversion action; always paired with a `button-primary` elsewhere on the same screen, not standing alone as the only action. A failed-redirect retry reuses the same `button-primary` Continue action (see State Patterns) rather than `button-secondary` — it's still the primary action, just retried. |
| `checkout-handoff` | Product → Add to Bag | Confirms garment + motif + color/size in plain language, one `button-primary` forward ("Continue to Checkout"), then redirects to the matching Squarespace product page. Not skippable-by-accident — this is a deliberate pause, not a loading spinner. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold load | Home, Collection Story | Static content, no skeleton needed at this content weight — image lazy-load with a Sailcloth/Paper Raised placeholder, no spinner. |
| Motif preview generating | Product, Collection Story motif tap | Until real on-garment photography exists, the "on garment" image is a composited placeholder mockup (flat patch photo digitally placed on a blank garment photo per the current photo strategy). If composition happens client-side rather than being pre-rendered, show a brief Paper Raised placeholder — never a spinner over the garment itself, it should feel like a photo swap, not a render. |
| No motif selected yet | Product (reached from Shop/garment-first) | Prompt: "Choose a design for this piece." Add to Bag disabled until both garment and motif are set. |
| Out of stock (garment color/size, or motif not yet assigned to this garment) | Product | Swatch/size shown but disabled with the out-of-stock microcopy above; never hidden entirely, since the PRD's own inventory is still provisional and items may come back. |
| Empty search | Search results | "No matches." No fallback suggestions (keeps launch scope simple, matches "no complex filtering"). |
| Checkout Handoff redirect failure | Checkout Handoff | Plain retry: "That didn't go through — try again," with the same Continue button. Never silently fail. |

## Interaction Primitives

- Tap/click to select (motif, swatch, garment). No hover-dependent affordances — this is mobile-first.
- Swipe for product image galleries on mobile; arrow controls on desktop.
- Sticky "Add to Bag" bar appears on mobile once the primary button scrolls out of view on a Product page — one primary action always reachable, without duplicating the whole header.
- Scroll-triggered reveal for story sections (Home, Collection Story) — subtle, one-time, never re-triggers on scroll-back.
- **Banned** (per brand PRD's explicit launch exclusions): carousels/auto-rotating hero imagery, popups (cart nudges, email capture interstitials, discount modals), badge/count UI beyond simple state, any animation that isn't a quiet fade/reveal.

## Accessibility Floor

Behavioral; visual contrast lives in `DESIGN.md`.

- Every motif tile and garment swatch has a text label (motif name, color name) — never color- or image-only identification. Screen readers announce selection state changes ("Water Tower, selected").
- Alt text on embroidery/product photography is descriptive of the motif and its story cue where relevant (e.g. "Water Tower motif embroidered on Blue Jean crewneck sweatshirt"), never filename-derived or decorative-only.
- Tap targets ≥ 44×44px across all interactive elements (motif tiles, swatches, nav icons) — mobile-first floor.
- Contrast: `{colors.wet-ink}` on `{colors.sailcloth}` and `{colors.sailcloth}` on `{colors.deep-harbor}` are the two load-bearing text/background pairs and must clear WCAG AA at body text size; verify before launch since exact contrast ratios weren't computed during Discovery.
- Focus order on Product follows visual order: images → garment/motif selection → Add to Bag → detail sections.

## Responsive & Platform

- **Mobile (primary):** single column throughout; motif gallery and product grids at 2 columns max; sticky Add to Bag bar; nav collapses to icon set (no hamburger drawer needed at this nav depth — three top-level items fit).
- **Desktop:** motif gallery and product grids may widen to 3 columns; nav shows SHOP / COLLECTIONS / ABOUT as text labels inline rather than mobile's icon-forward treatment; story sections gain the wider `gutter-desktop` margin and can run image + text side-by-side rather than always stacked.
- Breakpoint specifics (exact px) weren't set during Discovery — `[ASSUMPTION]` treat ~768px as the mobile/desktop split until a build-time decision overrides it.

## Inspiration & Anti-patterns

- **Lifted — boutique editorial ecommerce (small, place-led shops):** product storytelling before product grid; a collection introduces itself as a place/story before it asks for a purchase decision. This is the PLACE → STORY → MOTIF → OBJECT architecture made literal in the IA.
- **Rejected — souvenir-shop / kitschy-beach ecommerce:** no wave-emoji copy, no all-caps "SHOP NOW" banners, no red/white/navy nautical-cliché palette — explicit in the brand PRD.
- **Rejected — urgency/scarcity ecommerce patterns:** no countdown timers, no "only 2 left!" badges, no discount popups — not in the brand's voice and explicitly excluded from launch scope.
- **Rejected — mega-menu / heavy filter ecommerce:** three nav items, one garment-type dimension, one collection dimension. Complexity is explicitly deferred, not solved cleverly.

## Key Flows

### Flow 1 — Collection-first (Jess, first visit, mobile, arrives from an Instagram link to Sea Isle)

1. Jess taps an Instagram link and lands directly on the **Sea Isle Collection Story** (not the homepage) — the PLACE → STORY moment plays first.
2. She scrolls the story block, sees the motif gallery below it.
3. She taps **Water Tower** — the motif tile shows selected state.
4. She's prompted to choose a garment: taps **Crewneck Sweatshirt**, then the **Blue Jean** color swatch.
5. Product surface now shows Water Tower on a Blue Jean crewneck (composited placeholder image at this stage), with THE GARMENT / THE EMBROIDERY sections available below if she wants the story and fabric detail.
6. She selects size, taps **Add to Bag**.
7. Checkout Handoff interstitial confirms the selection in plain language.
8. **Climax:** she taps **Continue to Checkout** and lands on the matching Squarespace product page, already knowing exactly what she's paying for — the handoff feels like a continuation, not a jolt to a different site.

Failure path: if the Blue Jean/Large combination is out of stock, step 4's swatch is shown disabled with the out-of-stock microcopy; she's not blocked from browsing, just from adding that exact combination.

### Flow 2 — Garment-first (Tom, browsing on desktop, no specific design in mind)

1. Tom clicks **SHOP** in the nav, lands on the **Garment Type List** for Sweatshirts.
2. Browses garment colors as `product-card` tiles; clicks the **Pepper** crewneck.
3. Product surface loads with no motif selected yet — prompt: "Choose a design for this piece," Add to Bag disabled.
4. He browses available motifs inline (scoped to Sea Isle, the only live collection) as `motif-tile`s, taps **Lobster Loft**.
5. Preview updates to show Lobster Loft on the Pepper crewneck; Add to Bag becomes active.
6. **Climax:** he adds to bag, confirms at the Checkout Handoff, and is routed to Squarespace — arriving at checkout already certain — the garment-first path never made him detour through a story he didn't ask for.

Empty state: if a garment type has no motifs assigned yet (a real near-term possibility per the PRD's open item on garment-to-design assignment), the Product surface should say so plainly rather than show an empty picker — exact copy is an open item, not decided during Discovery.

Home, Collections (list), About, and Search are pass-through/utility surfaces at launch — each is a single stop on the way to Shop or a Collection Story rather than the destination of its own journey, and both flows above already exercise Home's downstream paths. Collections-the-list matters more once a second town ships; no dedicated flow for it yet.

Visual references: [`mockups/key-product.html`](mockups/key-product.html) illustrates Flow 1 steps 3–5 and Flow 2 steps 2–5 (the converged Product surface both flows land on); [`mockups/key-collection-story.html`](mockups/key-collection-story.html) illustrates Flow 1 steps 1–3; [`mockups/key-home.html`](mockups/key-home.html) illustrates the shared entry point both flows depart from. Checkout Handoff has no dedicated mock — spine-only, see Information Architecture note above.
