import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import logger from "@/lib/logger";

export const dynamic = 'force-dynamic';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

// GET - verify checkout session (used by subscription-success page)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "No session ID provided" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the session belongs to this tenant
    if (checkoutSession.metadata?.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Session does not belong to this tenant" },
        { status: 403 }
      );
    }

    // Handle subscription mode (current model)
    if (checkoutSession.mode === "subscription") {
      // For subscriptions, the webhook handles DB updates
      // We just verify the session is complete
      if (checkoutSession.status === "complete") {
        return NextResponse.json({
          success: true,
          mode: "subscription",
          status: checkoutSession.status,
        });
      }
      return NextResponse.json({
        success: false,
        mode: "subscription",
        status: checkoutSession.status,
      });
    }

    // Handle payment mode (legacy one-time purchases)
    if (checkoutSession.mode === "payment" && checkoutSession.payment_status === "paid") {
      // Update tenant for legacy access (in case webhook hasn't processed yet)
      await db
        .update(tenants)
        .set({
          hasLegacyAccess: true,
          stripeCustomerId: checkoutSession.customer as string || null,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, session.user.tenantId));

      return NextResponse.json({ success: true, mode: "payment", plan: "legacy" });
    }

    return NextResponse.json({ success: false, status: checkoutSession.payment_status || checkoutSession.status });
  } catch (error) {
    logger.error("Payment verification error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}

// POST - legacy endpoint for backwards compatibility
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: "No session ID provided" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    // Verify the session belongs to this tenant (if metadata exists)
    if (checkoutSession.metadata?.tenantId && checkoutSession.metadata.tenantId !== session.user.tenantId) {
      return NextResponse.json(
        { error: "Session does not belong to this tenant" },
        { status: 403 }
      );
    }

    // Handle subscription mode
    if (checkoutSession.mode === "subscription" && checkoutSession.status === "complete") {
      // For subscriptions, webhook handles DB updates - just confirm success
      return NextResponse.json({ success: true, mode: "subscription" });
    }

    // Handle legacy payment mode
    if (checkoutSession.mode === "payment" && checkoutSession.payment_status === "paid") {
      await db
        .update(tenants)
        .set({
          hasLegacyAccess: true,
          stripeCustomerId: checkoutSession.customer as string || null,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, session.user.tenantId));

      return NextResponse.json({ success: true, mode: "payment" });
    }

    return NextResponse.json({ success: false, status: checkoutSession.payment_status || checkoutSession.status });
  } catch (error) {
    logger.error("Payment verification error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to verify payment" },
      { status: 500 }
    );
  }
}
