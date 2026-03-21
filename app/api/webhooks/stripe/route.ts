import Stripe from "stripe";
import { stripe } from "@/lib/payments/stripe";
import { db } from "@/lib/db/drizzle";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const payload = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return new Response("Webhook signature verification failed", {
      status: 400,
    });
  }

  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = subscription.customer as string;
      const status = subscription.status;

      // Find user by stripe_customer_id
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stripeCustomerId, customerId))
        .limit(1);

      if (!user) {
        console.error(
          "No user found for Stripe customer:",
          customerId
        );
        break;
      }

      const plan =
        status === "active" || status === "trialing" ? "pro" : "free";

      await db
        .update(users)
        .set({
          plan,
          stripeSubscriptionId: subscription.id,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id));

      break;
    }
    default:
      console.log(`Unhandled Stripe event type: ${event.type}`);
  }

  return new Response("OK", { status: 200 });
}
