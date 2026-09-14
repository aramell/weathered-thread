---
name: 'Version & Claim Verification Review'
purpose: independent-fact-check
target: ARCHITECTURE-SPINE.md
reviewed: '2026-09-14'
---

# Fact-Check Review — Architecture Spine (Weathered Thread)

Scope: verify committed technical claims in `ARCHITECTURE-SPINE.md` were reality-checked (repo source of truth for versions; web research for external-platform claims) rather than asserted from training data.

## 1. Stack table versions

**Verdict: CONFIRMED — matches repo exactly.**

Checked `/Users/andrewramell/code/weathered-thread/package.json` directly (source of truth per brownfield-ratified stack):

| Spine claim | package.json | Match |
| --- | --- | --- |
| Next.js 16.3.5 | `"next": "16.3.5"`, `eslint-config-next: "16.3.5"` | Exact |
| React 19.2.8 | `"react": "19.2.8"`, `"react-dom": "19.2.8"` | Exact |
| TypeScript 5.x | `"typescript": "^5"` | Consistent (spine correctly generalizes pinned `^5` to "5.x") |
| Tailwind CSS 4.x | `"tailwindcss": "^4"`, `"@tailwindcss/postcss": "^4"` | Consistent |
| ESLint 9.x | `"eslint": "^9"` | Consistent |

No issues. This section reflects the actual repo state, not a guessed/hallucinated version set. Note the spine table doesn't distinguish `next`/`react` (exact-pinned) from the `^`-ranged dev dependencies — a minor precision note, not an error: TypeScript/Tailwind/ESLint could float to a newer minor/patch than what's in the lockfile today, so "5.x"/"4.x"/"9.x" is the right level of claim, just worth knowing it's a range, not a pin.

## 2. AD-1 — "Squarespace has no public headless/embeddable cart or checkout API"

**Verdict: CONFIRMED, and accurately scoped.** Not overstated.

- Squarespace's published Developer Platform (`developers.squarespace.com/commerce-apis/overview`) lists Commerce APIs for: Analytics, Contacts, Discounts, Inventory, Orders, Products, Profiles, Transactions, Webhook Subscriptions. **No Cart API and no Checkout API appear anywhere in that catalog.**
- Community/forum evidence (Squarespace's own forum thread "How to access squarespace commerce/shopping-cart api") corroborates this is a known, long-standing gap that developers ask about and don't get — not something that quietly shipped and was missed.
- Squarespace's own commerce positioning (per third-party commerce-migration writeups) explicitly keeps checkout inside its own managed templates rather than exposing it for embedding — this is a deliberate platform boundary, not an oversight likely to change without notice.
- Nuance the one-liner doesn't carry (worth noting in the spine or an adjacent comment, not a blocker): the *Orders API* does support writing/importing orders and the *Products/Discounts APIs* support creation — so Squarespace does have write-capable commerce APIs in a broad sense. AD-1's claim is specifically about *cart and checkout*, and on that narrower, correct reading it holds. As phrased, AD-1 is precise, not overstated.

## 3. AD-2 — "Squarespace's Products API + Inventory API support read access via API key"

**Verdict: CONFIRMED, with one material nuance the spine doesn't surface.**

- Both APIs exist and are documented: Products API (`developers.squarespace.com/commerce-apis/products-overview` family) and Inventory API (`developers.squarespace.com/commerce-apis/inventory-overview`).
- Squarespace's official API-keys help article (`support.squarespace.com/hc/en-us/articles/236297987`) confirms **API-key authentication is supported** for these Commerce APIs (OAuth is the alternative, not the only option) — so "API-key auth" in AD-2 is accurate, not a guess.
- Read access is confirmed: Inventory API exposes `GET`-style "List inventory" / "Get inventory" endpoints; Products API supports read (list/retrieve) alongside its write endpoints.
- **Nuance not captured by the spine's one-liner:** per Squarespace's own plan-comparison table, the **Inventory API (and Orders/Transactions APIs) are only available on Core, Plus, Advanced, and Commerce Advanced plans** — they are *not* listed as available on Commerce Basic. If Weathered Thread's Squarespace store is on a Commerce Basic plan, AD-2's sync mechanism could be blocked at the plan level, independent of the architecture being otherwise correct. This is a real, load-bearing risk the spine doesn't mention and should probably get a one-line callout or a Deferred/assumption entry ("assumes Squarespace plan ≥ Core/Commerce Advanced").
- Secondary nuance: the Products API is read-write (can create/edit/remove products), not read-only at the API level — AD-2's "read access" is a correct description of how *this architecture uses it* (sync script only reads), not a claim about the API's full capability. Worth being clear this is a usage constraint the spine imposes, not an API limitation.

## 4. Vercel Hobby plan — revenue-generating projects disallowed

**Verdict: CONFIRMED**, directly against Vercel's own docs, not just secondary blogs.

- `vercel.com/docs/plans/hobby` (via Vercel Community citation) states Hobby is restricted to **non-commercial personal use only**; all commercial usage requires Pro or Enterprise.
- Vercel's Fair Use Guidelines define "commercial usage" broadly: any deployment used for the financial gain of anyone involved in producing it — a paid employee/consultant writing the code counts, and the project doesn't need to be currently profitable (e.g., a landing page advertising a future paid product is commercial on day one). Donations are explicitly carved out as allowed on Hobby.
- Weathered Thread is a storefront that hands off to a live payment flow — squarely commercial under this definition, so the spine's implicit reasoning for landing on Pro (not Hobby) is sound and matches the platform's actual rule, not an assumed one.

## 5. Vercel Pro pricing — $20/seat/month

**Verdict: CONFIRMED**, current as of 2026 per multiple independent pricing writeups (Vendr, Flexprice, costbench, Makerkit), all converging on the same figure with no conflicting numbers found.

- Pro is $20 per deploying seat/month, and each seat includes $20 of usage credit applied against billable resources (compute, bandwidth beyond included allowances, etc.) — i.e., the $20 isn't purely a license fee, it's seat + prepaid usage. The spine's Stack table just says "Vercel, Pro plan" without a price, so this doesn't contradict anything written — flagging only as supporting confirmation that "Pro plan" is the correct, current plan name/tier to reference (no renaming or restructuring of Vercel's plan tiers since training-data-era knowledge).

## 6. Resend as a current Vercel Marketplace integration

**Verdict: CONFIRMED, and current — this is a genuinely new fact as of 2026, not something inferable from older training data.**

- Vercel's own changelog ("Resend joins the Vercel Marketplace") and Resend's docs (`resend.com/docs/guides/vercel-marketplace-integration`) confirm Resend joined the Vercel Marketplace on **July 1, 2026** — after a typical pre-2026 model's knowledge cutoff, so this claim could not have been safely asserted from training data alone and required the web check the spine's provenance implies.
- Confirmed capabilities match AD-6's usage: transactional email via API, provisioned directly from the Vercel Marketplace/CLI, billed through Vercel. This supports AD-6's specific claims (server-side call, API key never reaches the client, Vercel env vars) — those implementation details are standard practice and consistent with how Marketplace integrations work, though the spine doesn't cite a source for the "key never reaches client" mechanic (that's a correct general server-action/route-handler pattern, not Resend-specific, so it doesn't need one).

## Overall Assessment

All six checked claims hold up under independent verification — nothing in the spine appears to be an unverified assertion from training data, and nothing is factually wrong. Two items deserve a follow-up note in the spine itself, not because they're wrong but because the one-line claims flatten real nuance:

1. **AD-2 plan-tier risk (moderate):** Inventory/Orders/Transactions APIs require Squarespace Core/Plus/Advanced/Commerce Advanced — not confirmed available on Commerce Basic. Worth an explicit assumption or a Deferred-section note confirming Weathered Thread's actual Squarespace plan supports the Inventory API before AD-2 is built against.
2. **AD-1 phrasing precision (low):** accurate as written, but since Squarespace does have write-capable commerce APIs (Orders, Products), a reader skimming AD-1 could wrongly assume "no API at all" rather than "no cart/checkout API specifically." Current wording ("no shared cart... no such API exists") is already scoped correctly, so this is a readability note, not a correctness issue.

No claim requires retraction or correction.
