---
title: 'Homepage Email Signup'
type: 'feature'
created: '2026-09-15'
status: 'done'
route: 'dispatch'
review_loop_iteration: 0
context: []
baseline_commit: '2a9b35c8be8cf7a82c0f3c6c4dadd3332b307da4'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The homepage's "Stay Stitched In" section (`app/(site)/page.tsx`) already has signup markup, but the button is inert (`type="button"`, no handler) — it doesn't call an action, validate, or reach Resend.

**Approach:** Add the `subscribeEmail` Server Action (`app/(site)/actions.ts`, per architecture AD-6) that validates the email and adds it to a Resend Audience. Extract the signup markup into a small Client Component (`components/email-signup-form.tsx`) using React 19's `useActionState` to show a plain-language success/error message inline, without turning the whole static homepage dynamic. Provision the Resend integration via Vercel Marketplace first (`vercel integration add resend/resend-email`) so the action runs against a real account, not a mock.

## Boundaries & Constraints

**Always:** Validation (presence + shape) happens only inside `subscribeEmail`, never client-side beyond the browser's native `type="email"`. `RESEND_API_KEY` is read only in `actions.ts` (server-only), never imported into a Client Component. Success and error messages are plain-language, no exclamation marks/urgency, and communicated through copy only — no new color (the 5-color system has no "error red"). Keep `app/(site)/page.tsx` a static Server Component; the only new Client Component is the form itself.

**Never:** No client-exposed API key. No second email-capture implementation elsewhere. No popup/interstitial signup UI (banned sitewide). Do not modify `nav-header.tsx`, `collection-story-block.tsx`, or any section of Home other than the signup block.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Valid new email | `visitor@example.com` | Added to Resend Audience; plain-language success message shown | N/A |
| Already-subscribed email | email already a contact in the Audience | Treated as success (Resend contact create is an upsert) — same success message, no duplicate error | N/A |
| Empty submission | `""` | Rejected inside `subscribeEmail` | Plain-language error, no crash |
| Malformed email | `"not-an-email"` | Rejected inside `subscribeEmail` | Plain-language error, no crash |
| Resend API failure | network/API error from Resend | Caught in `subscribeEmail` | Plain-language error, no unhandled exception, no key/stack leaked to the client |

</frozen-after-approval>

## Code Map

- `app/(site)/page.tsx:67-90` -- current inert signup section; replace inner markup with `<EmailSignupForm />`, keep the surrounding `<section>` heading/copy as-is (static).
- `app/(site)/actions.ts` -- new file, `'use server'`; export `subscribeEmail(prevState, formData)` matching `useActionState`'s signature; validates, calls Resend, returns `{ status: 'success' | 'error', message: string }`.
- `components/email-signup-form.tsx` -- new, `'use client'`; mirrors `components/nav-scroll-shell.tsx` as this codebase's only other client boundary. `useActionState(subscribeEmail, initialState)`, `aria-live="polite"` message, submit button disabled while `pending`.
- `_bmad-output/planning-artifacts/architecture/architecture-weathered-thread-2026-09-14/ARCHITECTURE-SPINE.md:68-72,92,104` -- AD-6: one Server Action, Resend via Vercel Marketplace, `RESEND_API_KEY` server-only, exactly two credential env vars total (this doesn't add a third — the Resend Audience ID is not a secret, hardcode it as a constant in `actions.ts`, not an env var).
- `package.json` -- add `resend` dependency (official SDK).

## Tasks & Acceptance

**Execution:**
- [x] Provision Resend -- ran `vercel integration add resend/resend-email --no-claim -m domain=weatheredthread.com -m region=us-east-1` (the human accepted Resend's marketplace terms in browser first, per the CLI's `action_required` response), then it auto-pulled env -- real `RESEND_API_KEY` and `RESEND_EMAIL_DOMAIN` are now in the Vercel project and `.env.local`, no mock/placeholder
- [x] `package.json` -- add `resend` -- official client for the Contacts API, needed before `actions.ts` can import it
- [x] Create the Resend list and hardcode its ID as a named constant in `actions.ts` -- Resend has migrated Audiences to Segments (confirmed via the `resend` SDK's type defs and the `resend-cli` skill's command surface, which has no `audiences` group at all); created a real Segment (`db574593-161e-48b3-a9ae-69a72347f29d`, "Weathered Thread — Email Updates") via the SDK and hardcoded it as `SEGMENT_ID`
- [x] `app/(site)/actions.ts` -- add `subscribeEmail` Server Action -- single validated entry point per AD-6, using current `contacts.create({ email, segments: [{ id }] })`, not the deprecated `audienceId` shape
- [x] `components/email-signup-form.tsx` -- add the client form -- isolates interactivity to the smallest possible boundary
- [x] `app/(site)/page.tsx` -- swap inert markup for `<EmailSignupForm />` -- wires the existing section up

**Acceptance Criteria:**
- Given a visitor enters a valid email and submits, when the action completes, then `subscribeEmail` has added the contact to the Resend segment and the visitor sees a plain-language success message without a page navigation. -- Verified live against the real Resend API (see Implementation Notes); not verified through the actual browser form (Claude in Chrome extension unavailable in this session).
- Given a visitor submits an invalid or empty email, when they submit, then validation runs inside `subscribeEmail` only and they see a plain-language error message.
- Given the feature is deployed, then `RESEND_API_KEY` is present only in server-side code (verify: not in any Client Component import graph, not in the built client bundle).

## Implementation Notes

**Provisioning (completed by the human + orchestrator, not the implementation subagent):** the implementation subagent's own permission system correctly refused to run `vercel integration add` unsupervised. The orchestrator ran it directly with the human's explicit approval. First attempt hit `action_required: integration_terms_acceptance_required` (Resend's marketplace terms needed accepting at `https://vercel.com/aramells-projects/~/integrations/accept-terms/resend?source=cli`) -- the human completed that in-browser (took a few tries for it to register on Vercel's side). Second attempt needed required metadata (`domain`, `region` -- undocumented until `vercel integration add resend --help` was run after the first failure); used `domain=weatheredthread.com` (the site's real, already-documented domain) and the provider's stated default `region=us-east-1`. Final command: `vercel integration add resend/resend-email --no-claim -m domain=weatheredthread.com -m region=us-east-1` -- succeeded, connected to the `weathered-thread` project, and auto-ran `vercel env pull`.

**Audiences → Segments:** Resend has migrated Audiences to Segments. Confirmed two ways: (1) the installed `resend@6.28.1` SDK's type defs mark `LegacyCreateContactOptions.audienceId` as `@deprecated` in favor of `CreateContactOptions.segments: [{ id }]`; (2) the `resend-cli` skill's command surface has a `segments` group and no `audiences` group at all. Updated `actions.ts` to the current, non-deprecated shape rather than shipping code against a deprecated field. Created the real segment via the SDK (`resend.segments.create`) and hardcoded its id, `db574593-161e-48b3-a9ae-69a72347f29d`, as `SEGMENT_ID` -- not a secret, per AD-6's two-credential-env-var rule.

All code is complete and verified against the real, live account:
- `app/(site)/actions.ts` -- `subscribeEmail` Server Action: validates presence + shape with a regex, reads `RESEND_API_KEY` from `process.env` (server-only), calls `resend.contacts.create({ email, segments: [{ id: SEGMENT_ID }] })`, returns `{ status, message }`. Missing key, missing/malformed email, and any Resend error/thrown exception all resolve to a plain-language message with no crash and no key/stack leaked to the client (`console.error` server-side only, never in the returned state).
- `components/email-signup-form.tsx` -- new Client Component, `useActionState(subscribeEmail, initialSubscribeEmailState)`, `aria-live="polite"` message paragraph, submit button disabled and reads "Joining" while `pending`. No client-side validation beyond the input's native `type="email"` (no `required` attribute, matching the boundary constraint literally).
- `app/(site)/page.tsx` -- only the inert `<input>`/`<button>` markup in the signup `<section>` was replaced with `<EmailSignupForm />`; the section's heading/copy and every other section were left untouched.

**Verification performed:** `npm run lint` (clean); `npm run build` (clean, `/` still prerenders as `○` static); `grep -rl RESEND_API_KEY .next/static` after build (no match -- the only client-bundle reference to `subscribeEmail` is the framework's own encrypted Server Action ID, expected, not a secret leak). All five I/O matrix rows were run by calling `subscribeEmail` directly (Node, `RESEND_API_KEY` loaded from `.env.local`) against the live Resend API: empty email → error "Enter an email address to join."; missing `email` field → same error; malformed email → error "That email address doesn't look right..."; a valid new email → success, and `resend.contacts.list({ segmentId })` confirmed it landed in the real segment; the same email submitted again (already-subscribed case) → same success message, no duplicate error, confirming the upsert behavior the matrix specifies. The test contact was deleted via `resend.contacts.remove` afterward, leaving the segment clean.

**Side effect of provisioning:** `vercel integration add` also auto-installed Resend's agent skills into this repo (`.agents/skills/*`, `.claude/skills/{resend,resend-cli,react-email,email-best-practices,agent-email-inbox}`, `skills-lock.json`) -- vendor scaffolding from the CLI itself, not part of this story's Code Map; left as-is rather than reverted.

**Not done:** a real browser submission through the actual `EmailSignupForm` UI -- the Claude in Chrome extension was unavailable in this session (not connected), so only `npm run dev` + a live-server 200 check were possible, not a click-through; the "Resend API failure" matrix row wasn't exercised against a real failure (Resend was healthy throughout) -- only reviewed by reading the try/catch + `error` check in `actions.ts`.

**Review patches applied (see Review Triage Log):** `email-signup-form.tsx` now resets the form (`formRef.current?.reset()`) once `state.status === "success"`, and the email `<input>` gets `disabled={pending}` alongside the button. A new `.env.example` documents `RESEND_API_KEY`. A visually-hidden, keyboard-unreachable honeypot field (`name="company"`) was added to the form; `subscribeEmail` returns the normal success state with no Resend call when it's non-empty. Re-verified after patching: `npm run lint` (clean), `npm run build` (clean, `/` still `○` static), and the full I/O matrix plus the honeypot path re-run live against Resend -- empty/malformed still error correctly, a real email still lands in the segment and upserts cleanly on resubmit, and a honeypot-filled submission returns success while confirmed (via a 404 on cleanup) to never create a contact. Test data cleaned up afterward.

## Spec Change Log

## Review Triage Log

- **[false]** (blind-hunter) Success and error messages share identical `text-marsh-sage` styling and the same `aria-live="polite"` region, with no distinct error treatment. Disproved: this is the deliberate, frozen design — Boundaries & Constraints explicitly require "no new color (the 5-color system has no 'error red')" and that success/error be "communicated through copy only." `aria-live="polite"` on both is also the more broadly-recommended pattern for form status messages (assertive risks cutting off a screen reader mid-announcement), not a defect.
- **[false]** (blind-hunter) `package-lock.json` gains an "unrelated, unexplained" `"peer": true` on the `next` entry. Disproved: `@vercel/analytics` (pre-existing dependency, untouched by this diff) already declares `next` as an optional peerDependency (`package-lock.json:2305`); adding any new dependency makes npm recompute the lockfile's peer graph, correctly marking that already-satisfied peer edge. Standard npm behavior, not drift introduced by this change.
- **[false]** (blind-hunter) `SEGMENT_ID` is hardcoded in `actions.ts` instead of read from config/env, so pointing a different deploy at a different segment needs a code change. Disproved: this was a deliberate, spec-documented decision (Code Map), made to satisfy architecture AD-6's "exactly two [credential] env vars, never... duplicated under another name" rule — a segment id is not a credential. No staging/production segment split exists anywhere in this project's architecture today, so there is no live requirement this blocks.
- **[low, rejected]** (edge-case-hunter) `resend.contacts.create()` has no timeout/abort, so the form could stay on "Joining" indefinitely if the call hangs. Verified real but unlikely in everyday use (Resend is a stable, low-latency API; a genuine hang is rare, and a Vercel Function would eventually be killed by its own execution limit rather than hang forever) — and the SDK exposes no timeout option (`CreateContactRequestOptions` only takes `query`/`headers`, confirmed in `node_modules/resend/dist/index.d.mts`), so a complete fix means hand-rolling `AbortController` plumbing that doesn't exist anywhere else in this codebase. Fails the "everyday use + trivial fix" bar for a low finding.
- **[rejected: fix is spec edit]** (edge-case-hunter, claim) Frozen Intent says the action "adds it to a Resend Audience," but the shipped code targets a Resend Segment, not the Audience API. Real drift, but Resend deprecated Audiences in favor of Segments (confirmed via the SDK's own `@deprecated` annotation on `audienceId`) after this Intent was written and approved; the code correctly uses the current, non-deprecated shape. The only fix is updating the frozen Intent's wording, which triage does not do — already captured in Implementation Notes' "Audiences → Segments" section instead.
- **[medium → defer]** (verification-gap) No automated test exists anywhere for `subscribeEmail`'s validation/Resend-integration logic (the repo has zero test files, test config, or test script at all). Verified real (pre-verified by the reviewer's repo-wide search; independently consistent with every prior story's spec, which also used lint+build+manual checks only). Smallest honest fix is establishing this repo's first-ever test framework and mocking convention — not trivial, adds new public surface (dependency, config, script) — so it doesn't qualify as `patch`. This is a repo-wide gap that predates this story (Stories 1.1–1.4 shipped the same way), not a defect specific to this change's logic, which was independently verified live against the real Resend API. Deferred rather than blocking.
- **[low → patch]** (blind-hunter + edge-case-hunter, same root cause) After a successful signup, the email `<input>` still shows the submitted address — nothing resets the uncontrolled field. Verified: no `form.reset()`/ref-clear anywhere in `email-signup-form.tsx`. Real, minor "did it actually work?" doubt; trivial fix (reset the form on `state.status === "success"`).
- **[low → patch]** (blind-hunter) Only the submit button is disabled while `pending`; the email `<input>` stays editable/focusable during an in-flight request. Verified: no `disabled={pending}` on the input. Real minor inconsistency; trivial one-attribute fix.
- **[low → patch]** (blind-hunter) No `.env.example` documents the new `RESEND_API_KEY` requirement — the repo has never needed a runtime env var before this story, and none exists. Verified: confirmed no `.env.example` and no README mention anywhere in the repo. Real onboarding/local-dev gap introduced by this story; trivial addition.
- **[medium → patch]** (blind-hunter) `subscribeEmail` has no spam/abuse mitigation (no honeypot, rate limit, or CAPTCHA) on a newly-public write endpoint that costs money per contact. Verified real: nothing in the diff addresses this. A CAPTCHA/interstitial would itself violate the sitewide "no popups/interstitials" rule, but a hidden honeypot field is a trivial, dependency-free addition that adds real friction for basic bots without violating that constraint or introducing new infrastructure.

## Design Notes

A page-level redirect+`searchParams` pattern (no Client Component at all) was considered, since the epic context notes "no client-side interactivity needed" for this story — but reading `searchParams` in `app/(site)/page.tsx` would opt the entire homepage out of static prerendering (no PPR/Cache Components enabled in `next.config.ts`), regressing the static-Home precedent Stories 1.1–1.4 established. A small `useActionState` Client Component (Next's own documented pattern for this exact case) keeps Home static and matches the one-client-boundary precedent already set by `nav-scroll-shell.tsx`.

## Verification

**Commands:**
- `npm run lint` -- expected: no errors
- `npm run build` -- expected: builds cleanly; `/` still statically prerenders (check build output for `○` not `ƒ` against `/`)

**Manual checks (if no CLI):**
- `npm run dev`, submit a real test email at `/`: success message appears inline, no navigation; check the Resend dashboard/API that the contact was added to the Audience.
- Submit empty and malformed email: plain-language error appears, no console error/crash.
- `grep -r RESEND_API_KEY .next/static` (after build) or inspect the client bundle -- expected: no match.
