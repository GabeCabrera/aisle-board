import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const { cancelAtPeriodEnd = true } = await request.json().catch(() => ({}));

    // Get tenant's subscription
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, session.user.tenantId));

    if (!tenant?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No active subscription found" },
        { status: 400 }
      );
    }

    // Cancel subscription at period end (user keeps access until billing period ends)
    // or immediately if cancelAtPeriodEnd is false
    const subscription = await stripe.subscriptions.update(
      tenant.stripeSubscriptionId,
      {
        cancel_at_period_end: cancelAtPeriodEnd,
      }
    );

    // Update local database to reflect cancellation
    await db
      .update(tenants)
      .set({
        subscriptionStatus: cancelAtPeriodEnd ? "active" : "canceled",
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, session.user.tenantId));

    logger.info("Subscription cancellation requested", {
      tenantId: session.user.tenantId,
      cancelAtPeriodEnd,
      periodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
    });

    return NextResponse.json({
      success: true,
      cancelAtPeriodEnd,
      accessUntil: new Date(subscription.current_period_end * 1000).toISOString(),
    });
  } catch (error) {
    logger.error("Subscription cancellation error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}

// Reactivate a subscription that was set to cancel at period end
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, session.user.tenantId));

    if (!tenant?.stripeSubscriptionId) {
      return NextResponse.json(
        { error: "No subscription found" },
        { status: 400 }
      );
    }

    // Reactivate subscription (remove cancel_at_period_end)
    await stripe.subscriptions.update(tenant.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    logger.info("Subscription reactivated", { tenantId: session.user.tenantId });

    return NextResponse.json({ success: true, message: "Subscription reactivated" });
  } catch (error) {
    logger.error("Subscription reactivation error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to reactivate subscription" },
      { status: 500 }
    );
  }
}
