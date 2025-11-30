import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const tenantId = session.metadata?.tenantId;
    
    if (tenantId) {
      // Update tenant to complete plan
      await db
        .update(tenants)
        .set({
          plan: "complete",
          stripeCustomerId: session.customer as string,
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId));
      
      console.log(`Upgraded tenant ${tenantId} to complete plan`);
    }
  }

  return NextResponse.json({ received: true });
}
