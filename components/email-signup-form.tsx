"use client";

import { useActionState, useEffect, useRef } from "react";

import {
  initialSubscribeEmailState,
  subscribeEmail,
} from "@/app/(site)/actions";

/**
 * email-signup-form — the site's second client boundary (after
 * nav-scroll-shell.tsx). Isolates the "Stay Stitched In" section's
 * interactivity to just the form: the surrounding section heading/copy in
 * app/(site)/page.tsx stays a static Server Component. Submits via
 * useActionState to subscribeEmail (AD-6) and shows its plain-language
 * result inline, with no page navigation.
 */
export default function EmailSignupForm() {
  const [state, formAction, pending] = useActionState(
    subscribeEmail,
    initialSubscribeEmailState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      formRef.current?.reset();
    }
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor="email-signup" className="sr-only">
          Email address
        </label>
        <input
          id="email-signup"
          name="email"
          type="email"
          placeholder="you@email.com"
          disabled={pending}
          className="min-h-11 flex-1 rounded-sm border border-line bg-paper-raised px-3 font-body text-body-sm text-wet-ink disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-sm bg-deep-harbor px-4 font-mono text-label-mono uppercase text-sailcloth disabled:opacity-60"
        >
          {pending ? "Joining" : "Join"}
        </button>
      </div>
      {/* Honeypot: visually hidden from sighted users, unreachable by
          keyboard/tab, and skipped by screen readers. A real visitor never
          fills this in; a bot's autofill often does. subscribeEmail treats
          any non-empty value here as spam and fakes success silently. */}
      <div aria-hidden="true" className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden">
        <label htmlFor="company">Company</label>
        <input
          id="company"
          name="company"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
      <p aria-live="polite" className="font-body text-body-sm text-marsh-sage">
        {state.message}
      </p>
    </form>
  );
}
