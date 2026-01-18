import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface SubscriptionStatus {
  plan: string;
  status: "active" | "trialing" | "past_due" | "canceled" | "expired" | "none";
  trialEndsAt: string | null;
  daysRemaining: number | null;
  isTrialing: boolean;
  isActive: boolean;
  needsUpgrade: boolean;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [tenant] = await db
      .select()
      .from(tenants)
      .where(eq(tenants.id, session.user.tenantId));

    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const now = new Date();
    const subscriptionEndDate = tenant.subscriptionEndsAt;
    const subscriptionStatus = tenant.subscriptionStatus;
    
    let status: SubscriptionStatus["status"] = "none";
    let daysRemaining: number | null = null;
    let isTrialing = false;
    let isActive = false;
    let needsUpgrade = false;

    // Determine status based on subscription data
    if (subscriptionStatus === "trialing") {
      isTrialing = true;
      status = "trialing";
      
      if (subscriptionEndDate) {
        const endDate = new Date(subscriptionEndDate);
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // If trial has expired
        if (daysRemaining <= 0) {
          status = "expired";
          needsUpgrade = true;
          daysRemaining = 0;
        }
      }
    } else if (subscriptionStatus === "active") {
      isActive = true;
      status = "active";
      
      if (subscriptionEndDate) {
        const endDate = new Date(subscriptionEndDate);
        daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    } else if (subscriptionStatus === "past_due") {
      status = "past_due";
      needsUpgrade = true;
    } else if (subscriptionStatus === "canceled") {
      status = "canceled";
      // Check if they still have access until period end
      if (subscriptionEndDate && new Date(subscriptionEndDate) > now) {
        isActive = true;
        daysRemaining = Math.ceil((new Date(subscriptionEndDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        needsUpgrade = true;
      }
    } else {
      // No subscription - on free plan
      status = "none";
    }

    const response: SubscriptionStatus = {
      plan: tenant.plan,
      status,
      trialEndsAt: tenant.subscriptionEndsAt?.toISOString() || null,
      daysRemaining,
      isTrialing,
      isActive: isActive || isTrialing,
      needsUpgrade,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to get subscription status" },
      { status: 500 }
    );
  }
}
