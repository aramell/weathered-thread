---
title: 'About Page'
type: 'feature'
created: '2026-09-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '948b3e2c6bea0c3b5c2376b4820d5e23d0af4f5e'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `nav-header.tsx` already links to `/about` (Story 1.2), but no route exists there — visitors can't read the brand philosophy, the How It's Made process, or learn that Sea Isle is the first chapter of a broader place-based brand.

**Approach:** Build `app/(site)/about/page.tsx` as a static Server Component with plain content sections (mirroring Home's brand-idea/embroidery-detail block pattern), using existing brand tokens. Since this page carries substantial narrative copy, also wire Libre Franklin as a real `font-body` token — DESIGN.md's `body`/`body-sm` tokens are canonically Libre Franklin, not Fraunces — scoped to this page's new copy only.

## Boundaries & Constraints

**Always:** Route at `app/(site)/about/page.tsx`, static Server Component, `generateMetadata` (title/description), a visible `<h1>` (no other component on this page supplies one). Content: philosophy/tagline section, How It's Made section (exact required sentences below), and a Sea-Isle-as-first-chapter statement — Fraunces for headings, IBM Plex Mono for eyebrow labels, the new `font-body` (Libre Franklin) for paragraph copy. Mobile-first ~390px, no horizontal scroll, `gutter-mobile`/`gutter-desktop` padding, WCAG AA contrast, quiet-confidence voice (no exclamation marks/urgency/scarcity, never hedge handmade variation as a flaw).

**Never:** No product grid, picker, Add-to-Bag, or purchase path anywhere on this page. No `content/`/CMS pipeline (Epic 2). Do not modify `collection-story-block.tsx`, `nav-header.tsx`, or `app/(site)/page.tsx`. Do not change the rendered font on any existing page — Libre Franklin wiring must be additive only.

**Decided:** Processing-time day range is not confirmed pre-launch. Ship a natural-reading placeholder ("7–10 business days") in the visible copy so the page reads as finished, marked with a code comment (e.g. `{/* TODO: unconfirmed placeholder — replace with real processing-time range before launch */}`) flagging it as unconfirmed and needing replacement before launch.

</frozen-after-approval>

## Code Map

- `app/(site)/about/page.tsx` -- new, Server Component: static About route, `generateMetadata`, visible `<h1>`, philosophy/How-It's-Made/Sea-Isle-first-chapter sections.
- `app/layout.tsx` -- add `Libre_Franklin` via `next/font/google` (`variable: "--font-libre-franklin"`, weight 400), append its class to the root `html` element alongside `fraunces`/`ibmPlexMono`.
- `app/globals.css` -- add `--font-body: var(--font-libre-franklin), ui-sans-serif, system-ui, sans-serif;` inside `@theme inline`, giving Tailwind a `font-body` utility on the same pattern as the existing `--font-display`/`--font-mono`.
- `components/nav-header.tsx` -- reference only; already links to `/about` (Story 1.2) — no changes.
- `app/(site)/page.tsx` -- reference only; its brand-idea/embroidery-detail sections are the layout precedent for About's plain content sections — do not modify.
- `.../ux-designs/ux-weathered-thread-2026-09-14/DESIGN.md:136` -- reference; confirms `body`/`body-sm` tokens are specified as Libre Franklin.

## Tasks & Acceptance

**Execution:**
- [x] `app/layout.tsx` -- wire `Libre_Franklin` via `next/font/google`, add its CSS variable to the root `html` className -- makes the corrected body-copy typeface available without changing any existing page's rendered font
- [x] `app/globals.css` -- add the `--font-body` theme token -- gives Tailwind a `font-body` utility matching `font-display`/`font-mono`
- [x] `app/(site)/about/page.tsx` -- build the static About route -- fulfills the `/about` link already live in `nav-header.tsx`

**Acceptance Criteria:**
- Given a visitor navigates to About, when the page loads, then it renders the brand idea, philosophy, and tagline using the same brand tokens as the rest of the site, and the page contains no product grid, picker, or purchase path.
- Given a visitor reads the About / How It's Made content, when the page renders, then it uses the handmade-variation language exactly: "The beauty is in the details." and "Because each piece is embroidered individually, slight variations in stitching and finish are natural. These little differences are part of the character of a handmade piece." — explains processing time confidently using the term "processing time" — and positions Sea Isle as the first chapter of a broader place-based brand.

## Implementation Notes

- `app/layout.tsx`: added `Libre_Franklin` (`next/font/google`, weight `400`, `variable: "--font-libre-franklin"`) alongside the existing `Fraunces`/`IBM_Plex_Mono` fonts, and appended `libreFranklin.variable` to the root `<html>` className. `<body>` still carries `font-display` (unchanged) — Libre Franklin is additive only.
- `app/globals.css`: added `--font-body: var(--font-libre-franklin), ui-sans-serif, system-ui, sans-serif;` inside `@theme inline`, next to `--font-display`/`--font-mono`, giving Tailwind a `font-body` utility.
- `app/(site)/about/page.tsx`: new static Server Component with `generateMetadata` (title/description) and a single visible `<h1>`. Three plain `Sailcloth`-surface sections (mirroring Home's brand-idea/embroidery-detail block pattern, not `collection-story-block`): philosophy/tagline, How It's Made, and Sea Isle-as-first-chapter. Eyebrow labels use `font-mono text-label-mono uppercase`, headings use `font-display`, paragraph copy uses the new `font-body text-body`. Both required How-It's-Made sentences ("The beauty is in the details." / "Because each piece is embroidered individually...") are present verbatim; "processing time" is used explicitly; the "7–10 business days" placeholder carries the required `{/* TODO: unconfirmed placeholder... */}` comment. No product grid, picker, or Add-to-Bag anywhere on the page.
- Did not touch `collection-story-block.tsx`, `nav-header.tsx`, or `app/(site)/page.tsx`.
- Verified: `npm run lint` (no errors) and `npm run build` (compiles, statically prerenders `/about`, no type errors). Inspected the built `.next/server/app/about.html`: exactly one `<h1>`, both required sentences present verbatim, "processing time" and "7–10 business days" present, "chapter" language present, `font-body` class present, no "Add to Bag"/cart markup. Also diffed the built `/` and `/collections/sea-isle` HTML: both still use `font-display` and contain no `font-body`, confirming the new typeface wiring did not change their rendered font.

## Spec Change Log

## Review Triage Log

- **[low → patch]** `app/(site)/about/page.tsx`'s `<main>` uses `flex flex-col gap-story-gap py-story-gap`, adding a full `py-story-gap` above the first section and below the last. Verified: both `app/(site)/page.tsx:14` and `app/(site)/collections/[slug]/page.tsx:79` use `<main className="flex flex-col gap-story-gap">` with no `py-story-gap` — About is the only page with this extra spacing. Real, minor, sitewide pattern divergence; trivial one-class fix.
- **[low → patch]** About's `<h1>` reads "Made to Remember. Stitched In." (capital "In"); the same tagline appears with lowercase "in" in Home's hero eyebrow (`app/(site)/page.tsx:18`) and the root `<title>` (`app/layout.tsx:17`). Verified: confirmed exact strings differ only in that letter's case. Real brand-copy inconsistency; trivial one-word fix.
- **[low → patch]** About's first two sections ("About", "Process") open with a `font-mono text-label-mono uppercase` eyebrow line before their heading; the third section ("Sea Isle Is the First Chapter") has none. Verified: confirmed by reading the file — no eyebrow `<p>` precedes the third `<h2>`. Real within-page rhythm inconsistency; trivial addition.
- **[low → patch]** EXPERIENCE.md documents About as a "pass-through/utility surface" meant to route visitors onward to a Collection Story, but no link to `/collections/sea-isle` (or anywhere) exists in the "Sea Isle is the first chapter" section. Verified: confirmed no `<Link>`/`<a>`/`ButtonPrimary` anywhere in the file. Real gap against the page's documented purpose; a plain navigational link is not a purchase path, so it doesn't conflict with the spec's "Never" list. Trivial addition.
- **[false]** (blind-hunter) About page has no footer, unlike Home. Disproved as caused-by-this-story: `app/(site)/collections/[slug]/page.tsx` (Story 1.3) also has no `<footer>` — the sitewide pattern today is footer-on-Home-only, not a persistent per-page element (`app/(site)/layout.tsx` injects only the nav). Pre-existing gap, not introduced by this story — logged to `deferred-work.md` instead.
- **[false]** (blind-hunter) About's `<h1>` "doesn't say anything new," reusing Home's tagline verbatim instead of original framing. Disproved: this spec's own AC1 requires the page to render "the brand idea, philosophy, and tagline" — using the tagline as the headline directly fulfills that requirement rather than violating it; a copywriting preference, not a defect.
- **[false]** (edge-case-hunter, claim) About's body copy uses the new `font-body` (Libre Franklin) while Home/Collection Story still render body copy in `font-display` (Fraunces), in tension with AC1's "same brand tokens as the rest of the site" wording. Disproved: this was a deliberate, planning-time decision recorded in this spec's own Design Notes — `font-body` is the canonical DESIGN.md token for body copy (`DESIGN.md:136`), About is built correctly against it, and the sitewide migration of the *other* pages off the incorrect Fraunces-for-body pattern is explicitly Story 1.1's reopening (`epic-1-context.md` Cross-Story Dependencies), not this story's defect.

## Design Notes

- Libre Franklin is wired now, scoped to About's new copy only, because DESIGN.md's `body`/`body-sm` tokens are canonically Libre Franklin (the 2026-09-15 correction) and About is substantial narrative content — shipping it with the known-wrong Fraunces-for-body pattern would add a fresh instance of the bug Story 1.3's correction round already flagged as deferred cleanup elsewhere. Sitewide migration (Home, Collection Story) stays out of scope — that's Story 1.1's reopening per `epic-1-context.md`'s Cross-Story Dependencies.
- Not reusing `collection-story-block.tsx`: it's purpose-built for the full-bleed Deep Harbor "PLACE → STORY" moment shared by Home and a Collection page. About isn't collection-scoped and doesn't need that full-bleed treatment — plain `Sailcloth`-surface sections (mirroring Home's brand-idea/embroidery-detail blocks) fit its "pass-through/utility surface" role (EXPERIENCE.md) better.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors
- `npm run build` -- expected: builds cleanly, statically generates `/about`

**Manual checks (if no CLI):**
- `npm run dev`, load `/about` at ~390px: no horizontal scroll, single `<h1>`, both exact How-It's-Made sentences present verbatim, "processing time" term present, Sea Isle "first chapter" language present, no product grid/picker/Add-to-Bag anywhere.
- Confirm `/` and `/collections/sea-isle` still render with unchanged (Fraunces) body text — Libre Franklin wiring must be additive, not a regression.
