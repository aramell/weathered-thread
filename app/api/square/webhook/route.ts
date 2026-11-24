import { Resend } from "resend";
import { squareClient } from "@/lib/square-client";
import { createEmailSender, createOrderFetcher, handleSquareWebhook } from "@/lib/square-webhook";

/**
 * Square's payment notifications (Developer Console > Webhooks, event `payment.updated`). All
 * logic lives in `lib/square-webhook.ts`; this wires it to Square's order API and to Resend.
 */
export function POST(request: Request) {
  return handleSquareWebhook(request, {
    env: process.env,
    fetchOrder: (orderId) => createOrderFetcher(squareClient())(orderId),
    send: (email, idempotencyKey) => {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY is not set");
      return createEmailSender(new Resend(apiKey))(email, idempotencyKey);
    },
  });
}
