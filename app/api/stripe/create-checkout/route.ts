import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16" as Stripe.LatestApiVersion,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { email } = await request.json();

    // Get the base URL for redirects
    const baseUrl = process.env.NEXTAUTH_URL || 
      request.headers.get("origin") || 
      "http://localhost:3000";

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
              name: "Aisle Complete",
              description: "Lifetime access to the complete wedding planner",
            },
            unit_amount: 2900, // $29.00 in cents
          },
          quantity: 1,
        },
      ],
      success_url: `${baseUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/choose-plan`,
      metadata: {
        userId: session.user.id,
        tenantId: session.user.tenantId,
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
