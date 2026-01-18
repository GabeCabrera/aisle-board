import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getPromoCodeByCode } from "@/lib/db/queries";
import logger from "@/lib/logger";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

// Get price IDs from environment variables
const PRICES: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY,
  yearly: process.env.STRIPE_PRICE_YEARLY,
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  premium_yearly: process.env.STRIPE_PRICE_PREMIUM_YEARLY,
};

// Valid billing cycle options
const VALID_BILLING_CYCLES = ["monthly", "yearly", "premium_monthly", "premium_yearly"];

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email || !session.user.tenantId) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { billingCycle, promoCode } = await request.json();

    if (!billingCycle || !VALID_BILLING_CYCLES.includes(billingCycle)) {
      return NextResponse.json(
        { error: "Invalid billing cycle" },
        { status: 400 }
      );
    }

    const priceId = PRICES[billingCycle];
    
    if (!priceId) {
      return NextResponse.json(
        { error: "Subscription pricing not configured" },
        { status: 500 }
      );
    }

    // Get the base URL for redirects
    const baseUrl = process.env.NEXTAUTH_URL || 
      request.headers.get("origin") || 
      "http://localhost:3000";

    // Get or create Stripe customer
    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, session.user.tenantId));

    let customerId = tenant?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email,
        metadata: {
          tenantId: session.user.tenantId,
          userId: session.user.id,
        },
      });
      customerId = customer.id;

      // Save customer ID to tenant
      await db
        .update(tenants)
        .set({ stripeCustomerId: customerId })
        .where(eq(tenants.id, session.user.tenantId));
    }

    // Check for promo code and create Stripe coupon if applicable
    let stripeCouponId: string | undefined;
    let promoCodeId: string | undefined;

    if (promoCode) {
      try {
        const code = await getPromoCodeByCode(promoCode);
        
        if (code && code.isActive) {
          const notExpired = !code.expiresAt || new Date(code.expiresAt) >= new Date();
          const hasUses = !code.maxUses || code.currentUses < code.maxUses;
          
          if (notExpired && hasUses) {
            // FREE codes should be handled separately
            if (code.type === "free") {
              return NextResponse.json(
                { error: "This code grants free access. Please apply it on the plan selection page." },
                { status: 400 }
              );
            }
            
            // Create a Stripe coupon for percentage/fixed discounts
            if (code.type === "percentage") {
              const coupon = await stripe.coupons.create({
                percent_off: code.value,
                duration: "once",
                name: `${code.value}% off first payment`,
              });
              stripeCouponId = coupon.id;
            } else if (code.type === "fixed") {
              const coupon = await stripe.coupons.create({
                amount_off: code.value,
                currency: "usd",
                duration: "once",
                name: `$${(code.value / 100).toFixed(2)} off first payment`,
              });
              stripeCouponId = coupon.id;
            }

            // Store promo code ID - usage will be incremented by webhook on successful payment
            promoCodeId = code.id;
          }
        }
      } catch (e) {
        logger.error("Error processing promo code", e instanceof Error ? e : undefined);
        // Continue without discount
      }
    }

    // Check if user has already had a trial (to prevent abuse)
    const hasHadTrial = tenant?.subscriptionStatus !== null;
    
    // Build checkout session options
    const checkoutOptions: Stripe.Checkout.SessionCreateParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/choose-plan`,
      subscription_data: {
        // 14-day free trial for new subscribers
        ...(!hasHadTrial && { trial_period_days: 14 }),
        metadata: {
          tenantId: session.user.tenantId,
          userId: session.user.id,
          billingCycle,
          promoCode: promoCode || "",
          promoCodeId: promoCodeId || "",
        },
      },
      metadata: {
        tenantId: session.user.tenantId,
        userId: session.user.id,
        billingCycle,
      },
    };

    // Add discount if we have one
    if (stripeCouponId) {
      checkoutOptions.discounts = [{ coupon: stripeCouponId }];
    }

    // Allow promo code entry at checkout if none provided
    if (!promoCode) {
      checkoutOptions.allow_promotion_codes = true;
    }

    const checkoutSession = await stripe.checkout.sessions.create(checkoutOptions);

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    logger.error("Stripe subscription checkout error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
