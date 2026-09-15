# Sprint Change Proposal — Weathered Thread

**Date:** 2026-09-15
**Prepared for:** Andrewramell
**Trigger:** New "Weathered Thread — Next Iteration Notes" working document, delivered after Epic 1 stories 1.1–1.3 were built and reviewed.

## 1. Issue Summary

A new brand/website working document ("WEATHERED THREAD — CURRENT WEBSITE WORKING DOCUMENT") was shared mid-sprint, after Epic 1's stories 1.1 (Homepage), 1.2 (Navigation), and 1.3 (Sea Isle Collection Story) were already implemented and reviewed against the original planning artifacts (`website-build-handoff-prd.md`, `DESIGN.md`, `EXPERIENCE.md`, `epics.md`).

Comparing the new document against those artifacts surfaced three real conflicts with already-planned-or-shipped work (typography, motif reference names, homepage section structure), plus two genuinely new content requirements (handmade/variation messaging, processing-time messaging) that don't exist anywhere in current planning. A fourth area (product-page content requirements) turned out to already match what's planned, requiring no change.

**Issue type:** New requirement / brand refinement emerged from the stakeholder (not a technical limitation or failed approach).

## 2. Impact Analysis

### Epic Impact

- **Epic 1 (Site Foundation, Brand System & Storytelling):** Cannot be considered complete as originally built. Story 1.1 (typography, homepage section order) and Story 1.3 (motif names) need their specs amended and their shipped code reworked. Story 1.4 (About, not yet built) gains new AC before it starts.
- **Epic 2 (Catalog Data Pipeline):** No impact — motif renaming is repo-authored content (Story 2.2), mechanically unaffected by which names are used.
- **Epic 3 (Garment × Motif Discovery & Picker):** No AC changes accepted this round (Story 3.4's proposed handmade/processing-time addition was skipped by the user — see Section 4). Story 3.2/3.3/3.4 will consume whatever final motif list Epic 2 authors from Story 1.3's corrected names.
- **Epic 4 (Checkout Handoff):** No impact.
- No epic is invalidated; no new epic required; no resequencing needed.

### Story Impact

| Story | Status | Impact |
|---|---|---|
| 1.1 Homepage Renders With Brand Identity | in-review (shipped) | Rework: typography (Libre Franklin for body copy), homepage section order (+2 sections) |
| 1.2 Site-Wide Navigation | in-review (shipped) | No impact |
| 1.3 Sea Isle Collection Story Page | done (shipped) | Rework: all 13 motif names change |
| 1.4 About Page | not started | New AC added before build: handmade/variation + processing-time messaging, Sea Isle positioned as first chapter |
| 2.1 / 2.2 | not started | No impact |
| 3.1–3.5 | not started | No AC changes accepted this round |
| 4.1 / 4.2 | not started | No impact |

### Artifact Conflicts

- **PRD (`website-build-handoff-prd.md`):** Its §8 ("Fraunces + IBM Plex Mono") and §4 (7-section homepage order) are now superseded by the new document for these two points. Treating this as a historical, frozen import rather than editing it — `epics.md`/`DESIGN.md`/`EXPERIENCE.md` remain the living source of truth downstream stories build from.
- **Architecture (`ARCHITECTURE-SPINE.md`):** No conflicts. Nothing in this change touches data model, sync, client/server boundaries, or any Architectural Decision.
- **UX specs (`DESIGN.md`, `EXPERIENCE.md`):** Real conflicts — typography tokens, Information Architecture Home row, Voice and Tone table. Addressed in Section 4 below.
- **Other artifacts:** No deployment, CI/CD, or testing-strategy impact.

### Technical Impact

- `app/layout.tsx` / `app/globals.css`: need a Libre Franklin font import + `--font-body` token, and body-copy classes across `app/(site)/page.tsx` need to switch from `font-display` to the new body token where they're rendering body copy (not headlines).
- `app/(site)/collections/[slug]/page.tsx`: the hardcoded Sea Isle `motifs` array needs its 13 entries replaced.
- `app/(site)/page.tsx`: two new homepage sections need to be added in the approved positions.
- `_bmad-output/implementation-artifacts/epic-1-context.md` (cached epic context): stale once `epics.md`/`DESIGN.md`/`EXPERIENCE.md` change — needs regeneration before the reopened stories are rebuilt (this happens automatically on the next `bmad-build` run for this epic).

## 3. Recommended Approach

**Selected: Direct Adjustment (Option 1).**

- Modify existing story specs/AC in place; no rollback of completed work needed beyond the two files this specifically touches.
- Rollback (Option 2) was considered and rejected: story 1.2 (nav) and the overall architecture are entirely unaffected, so reverting and rebuilding from scratch would discard working, unrelated code for no benefit — targeted edits are cheaper.
- MVP Review (Option 3) was considered and rejected: none of the approved changes reduce or expand the PRD's core MVP goals (browsing, storytelling, handoff-to-Squarespace) — this is refinement of already-in-scope surfaces, not a scope change.

**Effort:** Medium — touches 3 planning docs, 1 cached context file, and requires reopening 2 already-shipped stories for code rework.
**Risk:** Low-Medium — well-bounded (no architecture/data-model changes), but story 1.3 is already merged/`done`, so its rework needs to go through `bmad-build`'s normal review loop again rather than a silent edit.
**Timeline impact:** Adds roughly one story-equivalent of rework before Epic 1 can be considered complete; does not block starting Epic 2 in parallel if desired (its stories are unaffected).

## 4. Detailed Change Proposals

All items below were reviewed and approved individually with the user (Incremental mode). One proposal was skipped.

### DESIGN.md

**Typography — add Libre Franklin as the body typeface.**

```diff
 typography:
   body:
-    fontFamily: Fraunces
+    fontFamily: Libre Franklin
   body-sm:
-    fontFamily: Fraunces
+    fontFamily: Libre Franklin
```

Prose (`## Typography`), OLD:
> Two typefaces, each with one job. **Fraunces** (serif) carries everything expressive — display, headlines, and body copy... **IBM Plex Mono** carries everything functional and precise...

NEW:
> Three typefaces, each with one job. **Fraunces** (serif) carries display and headline moments only — hero, collection-story headlines, section headers ("THE GARMENT," "THE EMBROIDERY") — where its personality earns its place. **Libre Franklin** (sans) carries body copy — emotional description, story paragraphs, product narrative — a plainer, more legible workhorse at paragraph length. **IBM Plex Mono** carries everything functional and precise — labels, navigation, prices, SKU/care detail, captions — the brand's nod to a garment tag or a hand-stamped receipt.

*Status: Approved.*

### EXPERIENCE.md

**1. Information Architecture — Home row.**

OLD: `Hero → Sea Isle feature → brand idea/story → shop grid → embroidery/detail section → email signup → footer (order fixed per brand PRD)`

NEW: `Hero → Sea Isle feature → brand idea/story → shop grid → product philosophy → embroidery/detail section → lifestyle imagery → email signup → footer (order fixed per brand PRD)`

*Status: Approved.*

**2. Voice and Tone table — new rows.**

| Do | Don't |
|---|---|
| "The beauty is in the details." | Apologizing for handmade variation as a flaw |
| "Because each piece is embroidered individually, slight variations in stitching and finish are natural." | "Please excuse any imperfections" |
| "Made to order. Please allow [X–X business days] for your piece to be embroidered and prepared for shipment." | "Processing times may vary" (vague, non-committal) |

*Status: Approved.*

### epics.md

**1. UX-DR10 (typography requirement).**

OLD: `UX-DR10: Implement typography tokens as real webfonts — Fraunces (display/headline/body) + IBM Plex Mono (label/price/caption)...`

NEW: `UX-DR10: Implement typography tokens as real webfonts — Fraunces (display/headline) + Libre Franklin (body) + IBM Plex Mono (label/price/caption)...`

*Status: Approved.*

**2. FR15 + Story 1.1 AC (homepage section order).**

OLD: `Homepage renders, in fixed order: Hero → Sea Isle feature → brand idea/story → shop/product grid → embroidery/detail section → email signup → footer.`

NEW: `Homepage renders, in fixed order: Hero → Sea Isle feature → brand idea/story → shop/product grid → product philosophy → embroidery/detail section → lifestyle imagery → email signup → footer.`

- **Product philosophy** (new section): carries "Made to look better lived in" — distinct from the existing brand idea/story section's "The embroidery is the medium. The feeling is the product." line.
- **Lifestyle imagery** (new section): atmospheric real-world photography (wood/porch/boardwalk/beach), placed late in the order per the new doc.

Same change applies to `epic-1-context.md`'s "Homepage section order is fixed" line (regenerated automatically next time the cached context is rebuilt).

*Status: Approved.*

**3. Story 1.3 AC (motif names).**

OLD: `...all 13 motif-tiles show with their real names (Seagull, Wave, Smile You're in Sea Isle, Water Tower, Life Ring, Turtle, Bike, Boat, Exit 17, Nautical Map – Fish Alley, Beach Chair, Pickleball, Lobster Loft)`

NEW: `...all 13 motif-tiles show with their real names (Sea Isle City Waves, Pickleball, Beach Chair, Seagull, Bicycle, Turtle, Life Preserver / N.J., Exit 17 / Sea Isle City, Sea Isle shoreline / sailboat, SIC Water Tower, Sea Isle Boat, Lobster Loft, Smile You're in Sea Isle)`

Drops "Nautical Map – Fish Alley" (currently live on the shipped page); adds two distinct boat/shoreline motifs where the shipped code has only one "Boat".

*Status: Approved.*

**4. Story 1.4 AC (About/How It's Made — handmade + processing-time messaging).**

New AC appended:
> **Given** a visitor reads the About / How It's Made content
> **When** the page renders
> **Then** it explains the individual embroidery process using the handmade-variation language exactly as specified: "The beauty is in the details." and "Because each piece is embroidered individually, slight variations in stitching and finish are natural. These little differences are part of the character of a handmade piece."
> **And** it explains processing time confidently and matter-of-factly, using the customer-facing term "processing time" (e.g. "Made to order. Please allow [X–X business days] for your piece to be embroidered and prepared for shipment.")
> **And** it positions Sea Isle as the first chapter of a broader place-based brand

**Open item:** `[X–X business days]` is a literal placeholder — the actual range needs confirming with a realistic turnaround before this story ships. Flagged as a pre-launch blocker, not guessed.

*Status: Approved.*

**5. Story 3.4 AC (Product page handmade + processing-time notes).**

*Status: Skipped by user — no change made. Product page (Epic 3) content sequence already matched the new document's §5/§6 requirements with no changes needed regardless.*

## 5. Implementation Handoff

**Scope classification: Moderate** — spans 3 planning docs plus reopening 2 already-shipped/reviewed stories for code rework; not a single-turn edit, but no fundamental replan or architecture involvement either.

**Handoff plan:**

1. **Planning docs** (`epics.md`, `DESIGN.md`, `EXPERIENCE.md`) — apply the approved diffs above directly (PO-level work).
2. **`epic-1-context.md`** — will auto-regenerate the next time `bmad-build` runs against an Epic 1 story, since it's now older than the just-edited planning artifacts.
3. **Story 1.1** — reopen via `bmad-build` (spec `spec-1-1-homepage-renders-with-brand-identity.md`, currently `in-review`). Its frozen Intent block needs renegotiating for the typography + section-order changes, then implementation rework (font wiring, two new sections) and re-review.
4. **Story 1.3** — reopen via `bmad-build` (spec `spec-1-3-sea-isle-collection-story-page.md`, currently `done`). Renegotiate its frozen Intent for the motif-name list, then rework the hardcoded `motifs` array and re-review.
5. **Story 1.4** — build fresh via `bmad-build` once ready; its spec will incorporate the new AC directly since no prior implementation exists to rework.

**Success criteria:** Stories 1.1 and 1.3 pass `bmad-build`'s review loop again post-rework; Story 1.4 is built against the updated AC from the start; the site's fonts, homepage sections, and Sea Isle motif gallery all match this document once complete.
