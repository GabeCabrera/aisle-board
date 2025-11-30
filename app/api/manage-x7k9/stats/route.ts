import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants, users, planners, pages, rsvpForms, rsvpResponses } from "@/lib/db/schema";
import { count, eq, gte, sql, desc, and } from "drizzle-orm";

const ADMIN_EMAILS = ["gabecabr@gmail.com"];
const COMPLETE_PLAN_PRICE = 29; // $29 one-time
const TAX_RATE = 0.0; // Adjust based on your tax situation (0% for now, could be ~30% for self-employment)

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Date calculations
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    const thisYearStart = new Date(now.getFullYear(), 0, 1);

    // ============================================================================
    // USER METRICS
    // ============================================================================
    
    const [totalUsersResult] = await db.select({ count: count() }).from(users);
    const totalUsers = totalUsersResult?.count || 0;

    const [totalTenantsResult] = await db.select({ count: count() }).from(tenants);
    const totalTenants = totalTenantsResult?.count || 0;

    const [newUsersThisWeekResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thisWeekStart));
    const newUsersThisWeek = newUsersThisWeekResult?.count || 0;

    const [newUsersThisMonthResult] = await db
      .select({ count: count() })
      .from(users)
      .where(gte(users.createdAt, thisMonthStart));
    const newUsersThisMonth = newUsersThisMonthResult?.count || 0;

    const [newUsersLastMonthResult] = await db
      .select({ count: count() })
      .from(users)
      .where(and(
        gte(users.createdAt, lastMonthStart),
        sql`${users.createdAt} < ${thisMonthStart}`
      ));
    const newUsersLastMonth = newUsersLastMonthResult?.count || 0;

    // ============================================================================
    // PLAN DISTRIBUTION
    // ============================================================================

    const [freeTenantsResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(eq(tenants.plan, "free"));
    const freeTenants = freeTenantsResult?.count || 0;

    const [completeTenantsResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(eq(tenants.plan, "complete"));
    const completeTenants = completeTenantsResult?.count || 0;

    // ============================================================================
    // REVENUE METRICS
    // ============================================================================

    // Total revenue (complete plan purchases)
    const totalRevenue = completeTenants * COMPLETE_PLAN_PRICE;

    // This month's revenue
    const [completePurchasesThisMonthResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(
        eq(tenants.plan, "complete"),
        gte(tenants.updatedAt, thisMonthStart)
      ));
    const revenueThisMonth = (completePurchasesThisMonthResult?.count || 0) * COMPLETE_PLAN_PRICE;

    // Last month's revenue
    const [completePurchasesLastMonthResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(
        eq(tenants.plan, "complete"),
        gte(tenants.updatedAt, lastMonthStart),
        sql`${tenants.updatedAt} < ${thisMonthStart}`
      ));
    const revenueLastMonth = (completePurchasesLastMonthResult?.count || 0) * COMPLETE_PLAN_PRICE;

    // This year revenue
    const [completePurchasesThisYearResult] = await db
      .select({ count: count() })
      .from(tenants)
      .where(and(
        eq(tenants.plan, "complete"),
        gte(tenants.updatedAt, thisYearStart)
      ));
    const revenueThisYear = (completePurchasesThisYearResult?.count || 0) * COMPLETE_PLAN_PRICE;

    // Conversion rate
    const conversionRate = totalTenants > 0 
      ? ((completeTenants / totalTenants) * 100).toFixed(1) 
      : "0";

    // ============================================================================
    // TAX ESTIMATES
    // ============================================================================

    const estimatedTaxThisYear = revenueThisYear * TAX_RATE;
    const netRevenueThisYear = revenueThisYear - estimatedTaxThisYear;

    // ============================================================================
    // ENGAGEMENT METRICS
    // ============================================================================

    const [totalPagesResult] = await db.select({ count: count() }).from(pages);
    const totalPages = totalPagesResult?.count || 0;

    const [totalRsvpFormsResult] = await db.select({ count: count() }).from(rsvpForms);
    const totalRsvpForms = totalRsvpFormsResult?.count || 0;

    const [totalRsvpResponsesResult] = await db.select({ count: count() }).from(rsvpResponses);
    const totalRsvpResponses = totalRsvpResponsesResult?.count || 0;

    // Average pages per planner
    const [totalPlannersResult] = await db.select({ count: count() }).from(planners);
    const totalPlanners = totalPlannersResult?.count || 0;
    const avgPagesPerPlanner = totalPlanners > 0 
      ? (totalPages / totalPlanners).toFixed(1) 
      : "0";

    // ============================================================================
    // RECENT ACTIVITY
    // ============================================================================

    const recentSignups = await db
      .select({
        id: tenants.id,
        displayName: tenants.displayName,
        plan: tenants.plan,
        createdAt: tenants.createdAt,
      })
      .from(tenants)
      .orderBy(desc(tenants.createdAt))
      .limit(10);

    const recentUpgrades = await db
      .select({
        id: tenants.id,
        displayName: tenants.displayName,
        updatedAt: tenants.updatedAt,
      })
      .from(tenants)
      .where(eq(tenants.plan, "complete"))
      .orderBy(desc(tenants.updatedAt))
      .limit(10);

    // ============================================================================
    // MONTHLY TRENDS (last 6 months)
    // ============================================================================

    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const [signupsResult] = await db
        .select({ count: count() })
        .from(tenants)
        .where(and(
          gte(tenants.createdAt, monthStart),
          sql`${tenants.createdAt} <= ${monthEnd}`
        ));

      const [upgradesResult] = await db
        .select({ count: count() })
        .from(tenants)
        .where(and(
          eq(tenants.plan, "complete"),
          gte(tenants.updatedAt, monthStart),
          sql`${tenants.updatedAt} <= ${monthEnd}`
        ));

      monthlyData.push({
        month: monthStart.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        signups: signupsResult?.count || 0,
        upgrades: upgradesResult?.count || 0,
        revenue: (upgradesResult?.count || 0) * COMPLETE_PLAN_PRICE,
      });
    }

    // ============================================================================
    // RESPONSE
    // ============================================================================

    return NextResponse.json({
      users: {
        total: totalUsers,
        totalTenants,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        newLastMonth: newUsersLastMonth,
        monthOverMonthGrowth: newUsersLastMonth > 0 
          ? (((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100).toFixed(1)
          : newUsersThisMonth > 0 ? "100" : "0",
      },
      plans: {
        free: freeTenants,
        complete: completeTenants,
        conversionRate,
      },
      revenue: {
        total: totalRevenue,
        thisMonth: revenueThisMonth,
        lastMonth: revenueLastMonth,
        thisYear: revenueThisYear,
        monthOverMonthGrowth: revenueLastMonth > 0
          ? (((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100).toFixed(1)
          : revenueThisMonth > 0 ? "100" : "0",
        pricePerUnit: COMPLETE_PLAN_PRICE,
      },
      taxes: {
        rate: TAX_RATE,
        estimatedThisYear: estimatedTaxThisYear,
        netRevenueThisYear,
      },
      engagement: {
        totalPages,
        totalPlanners,
        avgPagesPerPlanner,
        totalRsvpForms,
        totalRsvpResponses,
      },
      activity: {
        recentSignups,
        recentUpgrades,
      },
      trends: {
        monthly: monthlyData,
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
