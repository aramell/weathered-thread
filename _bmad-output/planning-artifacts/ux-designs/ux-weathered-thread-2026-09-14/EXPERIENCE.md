---
name: Weathered Thread
status: final
sources:
  - '{planning_artifacts}/ux-designs/ux-weathered-thread-2026-09-14/imports/website-build-handoff-prd.md'
updated: 2026-10-27
---

# Weathered Thread — Experience Spine

> Custom-built storefront (browsing, storytelling, garment+design picker) handing off to Etsy for payment only — there is no shared cart between the two, so "Add to Bag" is a link-out (via a `shop.weatheredthread.com` URL that forwards to the design's Etsy listing), not an embedded cart. An Etsy listing URL is per design, so the handoff cannot preselect garment style, color, or size; the Checkout Handoff restates the selection and the visitor confirms it on Etsy. Paired with `DESIGN.md`. Launch scope: adult apparel, one collection (Sea Isle), structured so future collections/kids/accessories can be added without a rebuild.

## Foundation

Responsive web, mobile-first (the primary purchase surface is a phone), desktop fully supported at wider breakpoints. No third-party UI system — this is a custom-built experience; `DESIGN.md` is the visual identity reference for it.

Two systems make up the full purchase path: this site (everything through "Add to Bag") and Etsy (payment only, reached by link-out; checkout runs on etsy.com). `DESIGN.md` tokens govern this site's surfaces completely; the Etsy listing and checkout pages are rendered by Etsy, outside this site's design control. Don't try to match them; treat the handoff moment (see the Checkout Handoff row in Information Architecture, and the `checkout-handoff` component) as the seam that needs the most design attention, since that's where the brand's control ends.

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Home | Site entry | Hero → Sea Isle feature → brand idea/story → Shop section (curated designs) → product philosophy → embroidery/detail section → lifestyle imagery → email signup → footer (order fixed per brand PRD) |
| Shop | Nav: SHOP, or Home's "See all designs" | Every design from every collection as `product-card` tiles (design photo, collection label, name, price), newest first. There is no browse-by-garment section: garment type is chosen on the Product surface, not before it. |
| Collections | Nav: COLLECTIONS | List of town collections — Sea Isle only at launch, structured for more |
| Collection Story (e.g. Sea Isle) | Collections tap, or Home feature | PLACE → STORY narrative block, then a motif gallery for that town |
| Product (garment × motif) | From a Shop or Home design tile, or from Collection Story (design chosen, garment next). A garment-first deep link, if one exists, lands here with no design chosen and shows every option. | The converged, sellable unit — one specific garment + one specific motif |
| About | Nav: ABOUT | Brand story, philosophy |
| Search results | Search icon | Text search across garments and motifs |
| Checkout Handoff | Product → "Add to Bag" | Brief interstitial confirming the selection, then forward (via the `shop.weatheredthread.com` host) to the design's Etsy listing to pay; style, color, and size are confirmed again on Etsy |

Design-first is the primary path; however the Product surface is reached, the garment+motif combination is identical. No mega-menu, no filtering beyond garment type and collection at launch (brand PRD explicitly excludes complex filtering).

→ Visual references, and which flow steps each illustrates, are listed at the end of Key Flows. Checkout Handoff and the Shop grid remain spine-only by choice — a visual reference wasn't judged necessary for a plain confirmation interstitial or a standard grid. Mocks illustrate; this table is the contract — spines win on conflict.

## Voice and Tone

Microcopy only; brand voice and aesthetic posture live in `DESIGN.md.Brand & Style`.

| Do | Don't |
|---|---|
| "Sea Isle. A story, stitched in." | "🌊 SHOP THE WAVE COLLECTION NOW!!" |
| "Add to Bag" | "Buy Now!!" / "Grab Yours Today" |
| "Continuing to checkout." (before the Etsy forward) | "Redirecting…" (generic, no sense of continuity) |
| "This design is currently out of stock in your size." | "Oops! Sold out 😢" |
| Full sentences, quiet confidence | Exclamation marks, urgency language, countdown/scarcity copy |
| "The beauty is in the details." | Apologizing for handmade variation as a flaw |
| "Because each piece is embroidered individually, slight variations in stitching and finish are natural." | "Please excuse any imperfections" |
| "Made to order. Please allow [X–X business days] for your piece to be embroidered and prepared for shipment." | "Processing times may vary" (vague, non-committal) |

## Component Patterns

Behavioral only; visual specs live in `DESIGN.md.Components`. "Design" is the shopper-facing label and "motif" the component and catalog name; they mean the same thing.

| Component | Use | Behavioral rules |
|---|---|---|
| `motif-tile` | Collection Story motif gallery, Product design grid (when expanded) | Tap selects; selected tile shows the Antique Brass border and refreshes the garment preview slide. Always shows the collection name above the design name. Only one design selected at a time. |
| `design-summary` | Product, whenever a design is already chosen | Replaces the design grid with one row: thumbnail, collection name, design name, and a Change button. Change expands the full design grid inline (never navigates away); tapping a tile swaps the design and collapses back to the summary; Close collapses without changing. Not shown when no design is chosen — the full grid shows instead. |
| `garment-option` | Product page Garment Type selector | One option per garment type (Tee, Long Sleeve Tee, Crewneck): hand-drawn caricature, text label, price. Tap selects. The caricature is tinted to the selected color (untinted until a color is chosen). Replaces blank-garment photos everywhere, including garment-type cards and colorway cards. |
| `garment-swatch` | Product page | Tap selects a color; tints the `garment-option` caricatures and refreshes the garment preview slide. Disabled (not hidden) swatches for colors with no confirmed inventory, per the PRD's inventory table. |
| `product-card` | Home and Shop design tiles, search results | Shows the design's Etsy photo, collection label, name, and price. Tap → Product surface for that design (garment next). |
| `collection-story-block` | Home, Collection Story | Scroll-triggered reveal only (no autoplay, no carousel) — static narrative block, motif gallery below it. |
| `nav-header` | All surfaces | Sticky on scroll on mobile; SHOP / COLLECTIONS / ABOUT plus search and bag icon always reachable. Bag icon shows no count badge pre-launch (single-item "bag" is really just "proceed to this design's Etsy listing" — see `checkout-handoff`). |
| `button-primary` | One per screen: Add to Bag (Product), Shop the Collection (Home/Collection Story), Continue to Checkout (`checkout-handoff`) | Always the single primary action on its screen — never two `button-primary`s competing. Disabled state (not hidden) when its precondition isn't met (e.g. Add to Bag before a motif is chosen). |
| `button-secondary` | View Details, Back to Collection, Change and Close (`design-summary`), See all designs (Home) | Never used for the primary conversion action; always paired with a `button-primary` elsewhere on the same screen, not standing alone as the only action. |
| `checkout-handoff` | Product → Add to Bag | Confirms garment + motif + color/size in plain language, one `button-primary` forward ("Continue to Checkout"), says the visitor confirms that selection again on Etsy (the listing link cannot preselect style, color, or size), then forwards via the `shop.` host to the design's Etsy listing. Not skippable-by-accident — this is a deliberate pause, not a loading spinner. |

## State Patterns

| State | Surface | Treatment |
|---|---|---|
| Cold load | Home, Collection Story | Static content, no skeleton needed at this content weight — image lazy-load with a Sailcloth/Paper Raised placeholder, no spinner. |
| Garment preview slide | Product hero gallery | The hero is a swipeable gallery: the design's Etsy photos first, then — once a garment and color are chosen — a design-on-garment preview as the last slide. Until real on-garment photography exists, that preview is a composited placeholder mockup, captioned as a placeholder. It is a flat patch photo digitally placed on a blank garment photo, per the current photo strategy. If composition happens client-side rather than being pre-rendered, show a brief Paper Raised placeholder — never a spinner over the garment itself, it should feel like a photo swap, not a render. |
| Design chosen, no garment yet | Product (design-first) | Hero is the design's own photo (never an empty box). `design-summary` shown; `garment-option` caricatures untinted; prompt "Choose a garment for this piece." shown once, above the `garment-option` selector (the Add to Bag disabled reason does not repeat it). Color and Size appear after a garment is chosen; Add to Bag disabled. |
| No design chosen yet | Product (garment-first deep link only) | Full design grid shown with every option, nothing collapsed. Prompt: "Choose a design for this piece." Add to Bag disabled until both garment and design are set. |
| Out of stock (garment color/size, or motif not yet assigned to this garment) | Product | Swatch/size shown but disabled with the out-of-stock microcopy above; never hidden entirely, since the PRD's own inventory is still provisional and items may come back. |
| Empty search | Search results | "No matches." No fallback suggestions (keeps launch scope simple, matches "no complex filtering"). |
| Checkout Handoff redirect failure | Checkout Handoff | Plain retry: "That didn't go through — try again," with the same Continue button. Never silently fail. |

## Interaction Primitives

- Tap/click to select (motif, swatch, garment). No hover-dependent affordances — this is mobile-first.
- Swipe for product image galleries on mobile (the Product hero gallery is user-driven, never autoplay); arrow controls on desktop. Every gallery also has a non-swipe alternative on mobile: visible previous/next controls, or position dots with ≥44px tap targets.
- Sticky "Add to Bag" bar appears on mobile once the primary button scrolls out of view on a Product page — one primary action always reachable, without duplicating the whole header.
- Scroll-triggered reveal for story sections (Home, Collection Story) — subtle, one-time, never re-triggers on scroll-back.
- **Banned** (per brand PRD's explicit launch exclusions): auto-rotating carousels and hero imagery (the user-driven Product gallery is the one allowed exception), popups (cart nudges, email capture interstitials, discount modals), badge/count UI beyond simple state, any animation that isn't a quiet fade/reveal.

## Accessibility Floor

Behavioral; visual contrast lives in `DESIGN.md`.

- Every motif tile, `garment-option`, and garment swatch has a text label (collection and design name, garment name, color name) — never color- or image-only identification. The caricature is decorative (hidden from assistive tech); tint is never the only signal of selection. Screen readers announce selection state changes ("Water Tower, selected") and gallery position ("Photo 1 of 5").
- Alt text on embroidery/product photography is descriptive of the motif and its story cue where relevant (e.g. "Water Tower motif embroidered on Blue Jean crewneck sweatshirt"), never filename-derived or decorative-only.
- Tap targets ≥ 44×44px across all interactive elements (motif tiles, swatches, nav icons) — mobile-first floor.
- Contrast: `{colors.wet-ink}` on `{colors.sailcloth}` and `{colors.sailcloth}` on `{colors.deep-harbor}` are the two load-bearing text/background pairs and must clear WCAG AA at body text size; verify before launch since exact contrast ratios weren't computed during Discovery.
- Focus order on Product follows visual order: gallery → design summary → garment type → color → size → Add to Bag → detail sections.

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
3. She taps **Water Tower** and lands on its Product surface.
4. Water Tower is already chosen (no design grid to wade through). She taps the **Crewneck** caricature, then the **Blue Jean** color swatch.
5. The gallery's last slide now shows Water Tower on a Blue Jean crewneck (composited placeholder image at this stage), with THE GARMENT / THE EMBROIDERY sections available below if she wants the story and fabric detail.
6. She selects size, taps **Add to Bag**.
7. Checkout Handoff interstitial confirms the selection in plain language.
8. **Climax:** she taps **Continue to Checkout** and lands on the design's Etsy listing, having just seen her selection restated, and confirms style, color, and size there — the handoff feels like a continuation as far as the brand can carry it, not a jolt.

Failure path: if the Blue Jean/Large combination is out of stock, step 4's swatch is shown disabled with the out-of-stock microcopy; she's not blocked from browsing, just from adding that exact combination.

### Flow 2 — Shop-first (Tom, browsing on desktop, no specific design in mind)

1. Tom clicks **SHOP** in the nav, lands on the grid of every design, newest first.
2. He scans the tiles (each shows the collection and design name) and clicks **Iconic Boat**.
3. Product surface loads with the design chosen: the hero is the boat's own photo, the Design row reads "Sea Isle · Iconic Boat" with a Change button, and the prompt says "Choose a garment for this piece."
4. He taps the **Long Sleeve Tee** caricature, then the **Pepper** swatch; the caricatures tint to Pepper and the last gallery slide now shows the design on a Pepper long sleeve.
5. He picks a size; Add to Bag becomes active.
6. **Climax:** he adds to bag, confirms at the Checkout Handoff, and is routed to Etsy — arriving at checkout already certain of his selection, never asked to choose a design he'd already chosen.

Change-of-mind path: at step 3 he taps **Change**, the design grid opens inline with every tile labelled by collection, and picking another design collapses it back to the summary.

Empty state: if a garment type has no designs assigned yet (a real near-term possibility per the PRD's open item on garment-to-design assignment), the Product surface should say so plainly rather than show an empty picker — exact copy is an open item, not decided during Discovery.

Home, Collections (list), About, and Search are pass-through/utility surfaces at launch — each is a single stop on the way to Shop or a Collection Story rather than the destination of its own journey, and both flows above already exercise Home's downstream paths. Collections-the-list matters more once a second town ships; no dedicated flow for it yet.

Visual references: [`mockups/key-product.html`](mockups/key-product.html) illustrates Flow 1 steps 3–5 and Flow 2 steps 3–5 (the Product surface both flows land on, including the inline Change state); [`mockups/key-collection-story.html`](mockups/key-collection-story.html) illustrates Flow 1 steps 1–3; [`mockups/key-home.html`](mockups/key-home.html) illustrates the shared entry point both flows depart from. Checkout Handoff has no dedicated mock — spine-only, see Information Architecture note above.
