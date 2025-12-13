import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";
import { getUsersByTenantId, incrementPromoCodeUses } from "@/lib/db/queries";
import { sendEmail } from "@/lib/email";
import { getPlanFromPriceId, type PlanType } from "@/lib/subscription";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    logger.error("Webhook signature verification failed", err instanceof Error ? err : undefined);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  logger.info("Received Stripe webhook", { eventType: event.type });

  // Handle different event types
  switch (event.type) {
    // =========================================================================
    // SUBSCRIPTION EVENTS
    // =========================================================================
    
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId;

      if (tenantId) {
        const status = subscription.status;
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000);
        const priceId = subscription.items.data[0]?.price?.id;

        // Derive plan from price_id (source of truth), not metadata
        let plan: PlanType = "free";
        if ((status === "active" || status === "trialing") && priceId) {
          plan = getPlanFromPriceId(priceId);
        }

        await db
          .update(tenants)
          .set({
            plan,
            stripeSubscriptionId: subscription.id,
            stripePriceId: priceId,
            subscriptionStatus: status,
            subscriptionEndsAt: currentPeriodEnd,
            updatedAt: new Date(),
          })
          .where(eq(tenants.id, tenantId));

        // On new subscription creation, increment promo code usage if applicable
        if (event.type === "customer.subscription.created") {
          const promoCodeId = subscription.metadata?.promoCodeId;
          if (promoCodeId) {
            try {
              await incrementPromoCodeUses(promoCodeId);
              logger.info("Promo code usage incremented", { tenantId, promoCodeId });
            } catch (promoError) {
              logger.error("Failed to increment promo code usage", promoError instanceof Error ? promoError : undefined);
            }
          }
        }

        logger.info("Subscription updated", { tenantId, plan, status, priceId });
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const tenantId = subscription.metadata?.tenantId;
      
      if (tenantId) {
        // Subscription was canceled - downgrade to free
        await db
          .update(tenants)
          .set({
            plan: "free",
            subscriptionStatus: "canceled",
            // Keep subscriptionEndsAt so they have access until end of period
            updatedAt: new Date(),
          })
          .where(eq(tenants.id, tenantId));

        logger.info("Subscription canceled", { tenantId });
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        // Get the subscription to find the tenant
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tenantId = subscription.metadata?.tenantId;

        if (tenantId) {
          // Derive plan from price_id (source of truth)
          const priceId = subscription.items.data[0]?.price?.id;
          const plan = priceId ? getPlanFromPriceId(priceId) : "free";

          await db
            .update(tenants)
            .set({
              plan,
              subscriptionStatus: "active",
              subscriptionEndsAt: new Date(subscription.current_period_end * 1000),
              updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));

          logger.info("Payment succeeded", { tenantId, plan, priceId });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId = invoice.subscription as string;

      if (subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const tenantId = subscription.metadata?.tenantId;

        if (tenantId) {
          // Mark as past due but don't immediately downgrade
          await db
            .update(tenants)
            .set({
              subscriptionStatus: "past_due",
              updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));

          logger.warn("Payment failed", { tenantId });

          // Send email notification about failed payment to all users in tenant
          const tenantUsers = await getUsersByTenantId(tenantId);
          for (const user of tenantUsers) {
            await sendEmail({
              to: user.email,
              template: "payment_failed",
              data: {
                name: user.name || user.email.split("@")[0],
              },
            });
          }
        }
      }
      break;
    }

    // =========================================================================
    // LEGACY: ONE-TIME PAYMENT (for existing checkout flow)
    // =========================================================================
    
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Only handle one-time payments (legacy Complete plan)
      if (session.mode === "payment") {
        const tenantId = session.metadata?.tenantId;
        
        if (tenantId) {
          // Grant legacy access
          await db
            .update(tenants)
            .set({
              hasLegacyAccess: true,
              stripeCustomerId: session.customer as string,
              updatedAt: new Date(),
            })
            .where(eq(tenants.id, tenantId));
          
          logger.info("Granted legacy access", { tenantId });
        }
      }
      // Subscription checkouts are handled by customer.subscription.created
      break;
    }

    default:
      logger.debug("Unhandled Stripe event", { eventType: event.type });
  }

  return NextResponse.json({ received: true });
}
