import { Resend } from "resend";
import { squareClient } from "@/lib/square-client";
import { handleSquareWebhook, type SquareOrder } from "@/lib/square-webhook";

/**
 * Square's payment notifications (Developer Console > Webhooks, event `payment.updated`). All
 * logic lives in `lib/square-webhook.ts`; this wires it to Square's order API and to Resend.
 */
export function POST(request: Request) {
  return handleSquareWebhook(request, {
    env: process.env,
    fetchOrder: async (orderId) => {
      const { order } = await squareClient().request<{ order: SquareOrder }>(
        "GET",
        `/v2/orders/${encodeURIComponent(orderId)}`,
      );
      return order;
    },
    send: async (email, idempotencyKey) => {
      const apiKey = process.env.RESEND_API_KEY;
      if (!apiKey) throw new Error("RESEND_API_KEY is not set");
      const { error } = await new Resend(apiKey).emails.send(email, { idempotencyKey });
      if (error) throw new Error(`Resend: ${error.name}`);
    },
  });
}
