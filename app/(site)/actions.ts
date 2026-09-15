"use server";

import { Resend } from "resend";

// AD-6: one Server Action, Resend server-side only. The Segment ID is not
// a secret (unlike RESEND_API_KEY), so it's a hardcoded constant here rather
// than a third env var/credential. Resend has migrated Audiences -> Segments
// (the SDK's `audienceId` contact field is deprecated in favor of
// `segments: [{ id }]`); this targets the "Weathered Thread — Email Updates"
// segment created via the Resend API during provisioning.
const SEGMENT_ID = "db574593-161e-48b3-a9ae-69a72347f29d";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type SubscribeEmailState = {
  status: "idle" | "success" | "error";
  message: string;
};

export const initialSubscribeEmailState: SubscribeEmailState = {
  status: "idle",
  message: "",
};

const SUCCESS_STATE: SubscribeEmailState = {
  status: "success",
  message: "You're on the list. New towns and motifs land in your inbox.",
};

/**
 * Server Action backing every email-capture entry point on the site (AD-6).
 * Validates the submitted email and, if well-formed, upserts it as a
 * contact in the Resend segment identified by SEGMENT_ID. Resend's
 * contact create is an upsert, so an already-subscribed email is treated
 * as success rather than a duplicate error.
 */
export async function subscribeEmail(
  _prevState: SubscribeEmailState,
  formData: FormData,
): Promise<SubscribeEmailState> {
  // Honeypot: a hidden field no real visitor can reach (see
  // email-signup-form.tsx). A bot that fills it in gets the normal success
  // message with no real Resend call and no tell that it was caught.
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return SUCCESS_STATE;
  }

  const rawEmail = formData.get("email");

  if (typeof rawEmail !== "string" || rawEmail.trim().length === 0) {
    return {
      status: "error",
      message: "Enter an email address to join.",
    };
  }

  const email = rawEmail.trim();

  if (!EMAIL_PATTERN.test(email)) {
    return {
      status: "error",
      message: "That email address doesn't look right. Give it another check.",
    };
  }

  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.error("subscribeEmail: RESEND_API_KEY is not set");
    return {
      status: "error",
      message: "Signup isn't available right now. Please try again later.",
    };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.contacts.create({
      email,
      segments: [{ id: SEGMENT_ID }],
    });

    if (error) {
      console.error("subscribeEmail: Resend API error", error);
      return {
        status: "error",
        message: "Signup isn't available right now. Please try again later.",
      };
    }

    return SUCCESS_STATE;
  } catch (err) {
    console.error("subscribeEmail: unexpected error", err);
    return {
      status: "error",
      message: "Signup isn't available right now. Please try again later.",
    };
  }
}
