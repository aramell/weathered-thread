---
name: Weathered Thread
description: Coastal heritage embroidery brand — quiet, tactile, place-led storytelling for a custom storefront that hands off to Squarespace only to pay.
status: final
updated: 2026-09-14
colors:
  sailcloth: '#EFEAE0'
  wet-ink: '#2B2A26'
  deep-harbor: '#2F4858'
  marsh-sage: '#7C8567'
  antique-brass: '#A8823C'
  paper-raised: '#F7F4EC'
  line: '#D9D2C2'
typography:
  display-lg:
    fontFamily: Fraunces
    fontSize: 40px
    fontWeight: '450'
    lineHeight: '1.1'
    letterSpacing: -0.01em
  display-lg-mobile:
    fontFamily: Fraunces
    fontSize: 30px
    fontWeight: '450'
    lineHeight: '1.15'
  headline:
    fontFamily: Fraunces
    fontSize: 22px
    fontWeight: '500'
    lineHeight: '1.25'
  body:
    fontFamily: Libre Franklin
    fontSize: 17px
    fontWeight: '400'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Libre Franklin
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.55'
  label-mono:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.3'
    letterSpacing: 0.06em
  price-mono:
    fontFamily: IBM Plex Mono
    fontSize: 16px
    fontWeight: '500'
    lineHeight: '1.3'
  caption-mono:
    fontFamily: IBM Plex Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: '1.4'
rounded:
  sm: 2px
  DEFAULT: 4px
  md: 6px
  full: 9999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
  gutter-mobile: 20px
  gutter-desktop: 64px
  story-gap: 96px
components:
  button-primary:
    background: '{colors.deep-harbor}'
    text: '{colors.sailcloth}'
    font: '{typography.label-mono}'
    radius: '{rounded.sm}'
  button-secondary:
    background: transparent
    border: '{colors.wet-ink}'
    text: '{colors.wet-ink}'
    font: '{typography.label-mono}'
    radius: '{rounded.sm}'
  motif-tile:
    surface: '{colors.paper-raised}'
    border-selected: '{colors.antique-brass}'
    label: '{typography.caption-mono}'
    radius: '{rounded.DEFAULT}'
  garment-swatch:
    shape: '{rounded.full}'
    border: '{colors.line}'
    border-selected: '{colors.wet-ink}'
  product-card:
    surface: '{colors.paper-raised}'
    title: '{typography.body}'
    price: '{typography.price-mono}'
    radius: '{rounded.DEFAULT}'
  checkout-handoff:
    surface: '{colors.sailcloth}'
    heading: '{typography.headline}'
    body: '{typography.body-sm}'
    action: '{components.button-primary}'
  collection-story-block:
    surface: '{colors.deep-harbor}'
    text: '{colors.sailcloth}'
    heading: '{typography.display-lg}'
  nav-header:
    surface: '{colors.sailcloth}'
    text: '{colors.wet-ink}'
    label: '{typography.label-mono}'
---

## Brand & Style

Weathered Thread sells a sense of place, stitched in — "Made to Remember. Stitched in." The strategic idea driving every screen: *the embroidery is the medium, the feeling is the product.* The site should feel like a small, well-kept coastal shop that's been there a while, not a print-on-demand storefront — understated, tactile, quietly premium, timeless. It earns warmth through restraint, not decoration.

Brand architecture reads PLACE → STORY → MOTIF → OBJECT, and that order should be felt, not just navigable: a collection is a town before it's a grid of products, a motif carries a story before it's an "add to bag" button, and the garment itself — its weight, its weave, its wash — is part of the pitch, not a SKU footnote.

Hold the line against category default. This is explicitly **not** the souvenir-shop / kitschy-beach / red-white-navy nautical cliché, and not corporate-crisp or trend-heavy either. When in doubt, choose the quieter option (see Do's and Don'ts, and the PRD's own "Final Brand Check").

## Colors

Five brand colors, two supporting tones, transcribed exactly from `imports/website-build-handoff-prd.md` §2 (that document is canonical for these hex values; this section carries the rationale). Every one has a job; none of them free-floats as decoration.

- **Sailcloth (`{colors.sailcloth}`)** — the canvas. Primary page background everywhere. Warm off-white on purpose: a pure-white ground would read clinical and undercut "lived-in." Never substitute `#FFFFFF`.
- **Wet Ink (`{colors.wet-ink}`)** — the voice. Primary body text, headings, dark UI text. A soft near-black, never true `#000000` — hard black is the one thing that makes this palette feel corporate instead of tactile.
- **Deep Harbor (`{colors.deep-harbor}`)** — the depth. Reserved for dark hero/feature sections (the Sea Isle story block), the footer, and other strong-contrast moments. This is a deliberately muted slate-blue, not "navy" — if it starts reading as nautical navy, it's being used wrong (too saturated, too much of it, or paired with red/white).
- **Marsh Sage (`{colors.marsh-sage}`)** — the quiet accent. Secondary links, small details, occasional background fills. It should never be the loudest color on a screen; if a layout leans on sage to carry hierarchy, pull it back.
- **Antique Brass (`{colors.antique-brass}`)** — the one flourish. Small, premium touches only: a rule, a selected-state border on a motif tile, a tiny highlight. Never a background fill of any size, never the default button color. Its value comes from scarcity.
- **Paper Raised (`{colors.paper-raised}`)** — supporting tone for cards and raised surfaces (product cards, motif tiles) sitting a half-step above Sailcloth. Not a headline brand color — a construction tone.
- **Line (`{colors.line}`)** — supporting tone for hairline borders and dividers. Lowest-contrast separator that still reads.

## Typography

Three typefaces, each with one job. **Fraunces** (serif) carries display and headline moments only — hero, collection-story headlines, section headers ("THE GARMENT," "THE EMBROIDERY") — where its personality earns its place. **Libre Franklin** (sans) carries body copy — emotional description, story paragraphs, product narrative — a plainer, more legible workhorse at paragraph length. **IBM Plex Mono** carries everything functional and precise — labels, navigation, prices, SKU/care detail, captions — the brand's nod to a garment tag or a hand-stamped receipt.

- `{typography.display-lg}` — hero and collection-story headlines ("SEA ISLE"). Drop to `{typography.display-lg-mobile}` under the mobile breakpoint.
- `{typography.headline}` — section headers within a page ("THE GARMENT," "THE EMBROIDERY").
- `{typography.body}` / `{typography.body-sm}` — the emotional description copy, story paragraphs, product narrative.
- `{typography.label-mono}` — nav items, button labels, form labels, tags. Letter-spaced, small, uppercase in use even though the token itself doesn't force case.
- `{typography.price-mono}` — price display specifically, everywhere it appears.
- `{typography.caption-mono}` — motif tile captions, meta text, size/fit fine print.

## Layout & Spacing

Spacing scale from `{spacing.1}` (4px) through `{spacing.7}` (48px) covers component-level rhythm, plus two purpose-named tokens for the editorial moments: `{spacing.story-gap}` (96px) between major homepage/collection-story sections — the pause between one place and the next — and mobile/desktop gutters (`{spacing.gutter-mobile}` 20px, `{spacing.gutter-desktop}` 64px).

Mobile is the design center, not an afterthought (per brand rule: "optimize mobile as carefully as desktop"). Single-column by default on mobile; the motif gallery and product grids may move to 2–3 columns above the desktop breakpoint, never cramming to fit more per row than the imagery can carry at readable size. Story sections (collection feature, brand idea) stay full-bleed edge-to-edge on mobile with internal `gutter-mobile` padding; product grids respect the gutter on all sides.

## Elevation & Depth

Kept deliberately thin — this is a quiet, near-flat system, not a shadow-driven one. Depth comes from tone (`{colors.paper-raised}` cards sitting a half-step above `{colors.sailcloth}`) rather than drop shadows. Where a shadow is unavoidable (e.g., a sticky mobile "Add to Bag" bar lifting off content beneath it), keep it soft, low-opacity, and tinted toward `{colors.wet-ink}` rather than pure black — never a hard, saturated shadow.

## Shapes

Small, restrained radii (`{rounded.sm}` 2px, `{rounded.DEFAULT}` 4px, `{rounded.md}` 6px) — enough to soften a card edge, not enough to read as "app-y" or pill-shaped. `{rounded.full}` is reserved for the one circular shape in the system: garment color swatches, echoing a button or a stitched dot rather than a digital toggle. Product/motif imagery is never cropped to a shape more aggressive than `{rounded.DEFAULT}` — the photography (and eventually the patches themselves) should read as objects, not UI chrome.

## Components

Visual reference: [`mockups/key-product.html`](mockups/key-product.html) (button-primary, garment-swatch, motif-tile selected state, product page in full), [`mockups/key-collection-story.html`](mockups/key-collection-story.html) (collection-story-block, motif-tile gallery), [`mockups/key-home.html`](mockups/key-home.html) (nav-header, product-card, collection-story-block on Home). Mocks illustrate; this table and `EXPERIENCE.md.Component Patterns` are the contract — spines win on conflict.

- **`button-primary`** — Deep Harbor fill, Sailcloth label text in `{typography.label-mono}`, `{rounded.sm}` corners. Used once per screen for the one primary action (Add to Bag, Shop the Collection). Never Antique Brass as a fill.
- **`button-secondary`** — transparent with a Wet Ink border and text. Used for secondary actions (View Details, Back to Collection).
- **`motif-tile`** — the embroidery-design picker unit. Paper Raised surface, `{typography.caption-mono}` caption naming the motif (e.g. "Water Tower"), `{rounded.DEFAULT}` corners. Selected state: a thin Antique Brass border — the system's one flourish, spent on the moment a customer commits to a design.
- **`garment-swatch`** — small circular color swatch (`{rounded.full}`) for garment color selection (Pepper / Blue Jean / Ivory / Bay). Line-colored border at rest, Wet Ink border when selected.
- **`product-card`** — used in grid contexts (Shop, search results). Paper Raised surface, `{typography.body}` title, `{typography.price-mono}` price, `{rounded.DEFAULT}` corners.
- **`collection-story-block`** — the PLACE → STORY moment (Sea Isle feature). Deep Harbor surface, Sailcloth text, `{typography.display-lg}` heading. This is the one place Deep Harbor covers a large area by design.
- **`nav-header`** — Sailcloth surface, Wet Ink text, `{typography.label-mono}` for SHOP / COLLECTIONS / ABOUT plus search and bag icons. Stays quiet — no color fill, no shadow, a `{colors.line}` hairline at most on scroll.

## Do's and Don'ts

| Do | Don't |
|---|---|
| Use the five brand colors and two supporting tones exactly as specified | Substitute standard nautical navy/red/white, or reach for a sixth color |
| Let Sailcloth (warm off-white) carry the page | Use pure white `#FFFFFF` as the canvas |
| Use Wet Ink for text | Use true black `#000000` anywhere |
| Spend Antique Brass on one small, earned moment per screen | Use Antique Brass as a background fill or default button color |
| Let Deep Harbor cover a full section (hero, story block, footer) | Let Deep Harbor read as "navy" — watch saturation and pairing |
| Treat garment quality as part of the story (fabric, weight, fit language) | Describe pieces as merely "embroidered shirts" |
| Keep motion and layout quiet, print-like | Add gradients, hero animations, popups, or effects "because Squarespace offers them" |
| Show real, tactile photography — actual garments, actual stitching, natural light | Use generic stock imagery to fill a section |
