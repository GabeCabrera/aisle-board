import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { pages, planners, rsvpForms } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { getTenantAccess, PLAN_LIMITS, type PlanType } from "@/lib/subscription";

/**
 * GET /api/subscription/status
 * Returns the current user's subscription status and usage
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Get plan access info
    const access = await getTenantAccess(tenantId);

    if (!access) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get the planner for this tenant
    const [planner] = await db
      .select()
      .from(planners)
      .where(eq(planners.tenantId, tenantId));

    let guestCount = 0;
    let vendorCount = 0;

    if (planner) {
      // Get guests and vendors from pages table (stored as JSONB in `fields`)
      const [guestsPage] = await db
        .select()
        .from(pages)
        .where(and(eq(pages.plannerId, planner.id), eq(pages.templateId, "guests")));

      const [vendorsPage] = await db
        .select()
        .from(pages)
        .where(and(eq(pages.plannerId, planner.id), eq(pages.templateId, "vendors")));

      // Parse guest and vendor counts from JSONB fields
      const guestData = (guestsPage?.fields as { guests?: unknown[] }) || {};
      guestCount = Array.isArray(guestData.guests) ? guestData.guests.length : 0;

      const vendorData = (vendorsPage?.fields as { vendors?: unknown[] }) || {};
      vendorCount = Array.isArray(vendorData.vendors) ? vendorData.vendors.length : 0;
    }

    // Get RSVP form count
    const [rsvpFormCount] = await db
      .select({ count: count() })
      .from(rsvpForms)
      .where(eq(rsvpForms.tenantId, tenantId));

    // Determine plan tier for limits
    const getPlanTier = (plan: PlanType): "free" | "stem" | "stemPlus" => {
      if (plan === "premium_monthly" || plan === "premium_yearly") return "stemPlus";
      if (plan === "monthly" || plan === "yearly") return "stem";
      return "free";
    };

    const tier = getPlanTier(access.plan);
    const limits = PLAN_LIMITS[tier];

    return NextResponse.json({
      plan: access.plan,
      hasFullAccess: access.hasFullAccess,
      isLegacy: access.isLegacy,
      subscriptionStatus: access.subscriptionStatus,
      subscriptionEndsAt: access.subscriptionEndsAt,
      limits: {
        guests: limits.guests,
        vendors: limits.vendors,
        rsvpForms: limits.rsvpForms,
      },
      usage: {
        guests: guestCount,
        vendors: vendorCount,
        rsvpForms: rsvpFormCount?.count ?? 0,
      },
    });
  } catch (error) {
    console.error("Subscription status error:", error);
    return NextResponse.json(
      { error: "Failed to fetch subscription status" },
      { status: 500 }
    );
  }
}
