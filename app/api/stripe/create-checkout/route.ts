import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPromoCodeByCode, incrementPromoCodeUses } from "@/lib/db/queries";

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

    // Check for promo code discount
    let finalPrice = ORIGINAL_PRICE;
    let discountDescription = "";
    let promoCodeId = "";
    
    if (promoCode) {
      try {
        const code = await getPromoCodeByCode(promoCode);
        
        if (code && code.isActive) {
          // Check expiration
          const notExpired = !code.expiresAt || new Date(code.expiresAt) >= new Date();
          // Check max uses
          const hasUses = !code.maxUses || code.currentUses < code.maxUses;
          
          if (notExpired && hasUses) {
            // FREE codes should have been handled before checkout
            // But just in case, skip them here
            if (code.type === "free") {
              return NextResponse.json(
                { error: "This code grants free access. Please apply it on the plan selection page." },
                { status: 400 }
              );
            }
            
            if (code.type === "percentage") {
              const discountAmount = Math.round(ORIGINAL_PRICE * (code.value / 100));
              finalPrice = ORIGINAL_PRICE - discountAmount;
              discountDescription = ` (${code.value}% off)`;
            } else if (code.type === "fixed") {
              finalPrice = ORIGINAL_PRICE - code.value;
              discountDescription = ` ($${(code.value / 100).toFixed(2)} off)`;
            }
            finalPrice = Math.max(0, finalPrice);
            promoCodeId = code.id;
            
            // Increment usage counter
            await incrementPromoCodeUses(code.id);
          }
        }
      } catch (e) {
        console.error("Error checking promo code:", e);
        // Continue without discount
      }
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
        promoCodeId: promoCodeId,
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
