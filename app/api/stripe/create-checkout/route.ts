import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

const ORIGINAL_PRICE = 2900; // $29.00 in cents

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { email, promoCode } = await request.json();

    // Get the base URL for redirects
    const baseUrl = process.env.NEXTAUTH_URL || 
      request.headers.get("origin") || 
      "http://localhost:3000";

    // Check for discount
    let finalPrice = ORIGINAL_PRICE;
    let discountDescription = "";
    
    try {
      const discountRes = await fetch(`${baseUrl}/api/manage-x7k9/discount`);
      const discount = await discountRes.json();

      if (discount.enabled) {
        // Check promo code if required
        const codeMatches = !discount.code || discount.code.toLowerCase() === promoCode?.toLowerCase();
        const notExpired = !discount.expiresAt || new Date(discount.expiresAt) >= new Date();
        const hasUses = !discount.maxUses || discount.currentUses < discount.maxUses;

        if (codeMatches && notExpired && hasUses) {
          if (discount.type === "percentage") {
            const discountAmount = Math.round(ORIGINAL_PRICE * (discount.value / 100));
            finalPrice = ORIGINAL_PRICE - discountAmount;
            discountDescription = ` (${discount.value}% off)`;
          } else {
            finalPrice = ORIGINAL_PRICE - discount.value;
            discountDescription = ` ($${(discount.value / 100).toFixed(2)} off)`;
          }
          finalPrice = Math.max(0, finalPrice);

          // Increment usage counter
          await fetch(`${baseUrl}/api/manage-x7k9/discount`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...discount,
              currentUses: (discount.currentUses || 0) + 1,
            }),
          });
        }
      }
    } catch (e) {
      console.error("Error checking discount:", e);
      // Continue without discount
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: email || session.user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Aisle Complete" + discountDescription,
              description: "Lifetime access to the complete wedding planner",
            },
            unit_amount: finalPrice,
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/choose-plan`,
      metadata: {
        userId: session.user.id,
        tenantId: session.user.tenantId,
        originalPrice: ORIGINAL_PRICE.toString(),
        finalPrice: finalPrice.toString(),
        promoCode: promoCode || "",
      },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
