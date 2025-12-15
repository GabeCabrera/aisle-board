import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/admin";
import { db } from "@/lib/db";
import { analyticsEvents, users } from "@/lib/db/schema";
import { count, eq, gte, sql, desc, and, countDistinct } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!(await isAdmin(session))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "7d"; // 7d, 30d, 90d

    // Calculate date ranges
    const now = new Date();
    const periodDays = period === "30d" ? 30 : period === "90d" ? 90 : 7;
    const startDate = new Date(now.getTime() - periodDays * 24 * 60 * 60 * 1000);

    // Exclude test accounts
    const testAccountUsers = await db
      .select({ tenantId: users.tenantId })
      .from(users)
      .where(eq(users.isTestAccount, true));
    const testTenantIds = testAccountUsers.map((u) => u.tenantId);

    // ============================================================================
    // REAL-TIME METRICS (last 5 minutes)
    // ============================================================================
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const [activeSessionsResult] = await db
      .select({ count: countDistinct(analyticsEvents.sessionId) })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.timestamp, fiveMinutesAgo));
    const activeSessions = activeSessionsResult?.count || 0;

    // Current page breakdown (last 5 minutes)
    const currentPages = await db
      .select({
        pagePath: analyticsEvents.pagePath,
        count: count(),
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, fiveMinutesAgo),
          eq(analyticsEvents.eventType, "page_view")
        )
      )
      .groupBy(analyticsEvents.pagePath)
      .orderBy(desc(count()))
      .limit(10);

    // ============================================================================
    // TRAFFIC METRICS
    // ============================================================================

    // Total page views in period
    const [totalPageViewsResult] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          eq(analyticsEvents.eventType, "page_view")
        )
      );
    const totalPageViews = totalPageViewsResult?.count || 0;

    // Unique sessions in period
    const [uniqueSessionsResult] = await db
      .select({ count: countDistinct(analyticsEvents.sessionId) })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.timestamp, startDate));
    const uniqueSessions = uniqueSessionsResult?.count || 0;

    // Top pages
    const topPages = await db
      .select({
        pagePath: analyticsEvents.pagePath,
        views: count(),
        uniqueSessions: countDistinct(analyticsEvents.sessionId),
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          eq(analyticsEvents.eventType, "page_view")
        )
      )
      .groupBy(analyticsEvents.pagePath)
      .orderBy(desc(count()))
      .limit(20);

    // Device breakdown
    const deviceBreakdown = await db
      .select({
        deviceType: analyticsEvents.deviceType,
        count: countDistinct(analyticsEvents.sessionId),
      })
      .from(analyticsEvents)
      .where(gte(analyticsEvents.timestamp, startDate))
      .groupBy(analyticsEvents.deviceType);

    // Traffic sources (referrers)
    const trafficSources = await db
      .select({
        referrer: analyticsEvents.referrer,
        sessions: countDistinct(analyticsEvents.sessionId),
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          sql`${analyticsEvents.referrer} IS NOT NULL AND ${analyticsEvents.referrer} != ''`
        )
      )
      .groupBy(analyticsEvents.referrer)
      .orderBy(desc(countDistinct(analyticsEvents.sessionId)))
      .limit(10);

    // UTM campaigns
    const utmCampaigns = await db
      .select({
        source: analyticsEvents.utmSource,
        medium: analyticsEvents.utmMedium,
        campaign: analyticsEvents.utmCampaign,
        sessions: countDistinct(analyticsEvents.sessionId),
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          sql`${analyticsEvents.utmSource} IS NOT NULL`
        )
      )
      .groupBy(
        analyticsEvents.utmSource,
        analyticsEvents.utmMedium,
        analyticsEvents.utmCampaign
      )
      .orderBy(desc(countDistinct(analyticsEvents.sessionId)))
      .limit(10);

    // ============================================================================
    // BEHAVIOR METRICS
    // ============================================================================

    // Feature usage
    const featureUsage = await db
      .select({
        eventName: analyticsEvents.eventName,
        count: count(),
        uniqueUsers: countDistinct(analyticsEvents.sessionId),
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          eq(analyticsEvents.eventType, "feature_use")
        )
      )
      .groupBy(analyticsEvents.eventName)
      .orderBy(desc(count()))
      .limit(20);

    // Click events
    const clickEvents = await db
      .select({
        eventName: analyticsEvents.eventName,
        count: count(),
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          eq(analyticsEvents.eventType, "click")
        )
      )
      .groupBy(analyticsEvents.eventName)
      .orderBy(desc(count()))
      .limit(20);

    // AI usage
    const [aiMessagesResult] = await db
      .select({ count: count() })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          eq(analyticsEvents.eventType, "ai_message")
        )
      );
    const totalAIMessages = aiMessagesResult?.count || 0;

    const aiMessageBreakdown = await db
      .select({
        eventName: analyticsEvents.eventName,
        count: count(),
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          eq(analyticsEvents.eventType, "ai_message")
        )
      )
      .groupBy(analyticsEvents.eventName)
      .orderBy(desc(count()));

    // Errors
    const errors = await db
      .select({
        eventName: analyticsEvents.eventName,
        count: count(),
        lastOccurred: sql<Date>`MAX(${analyticsEvents.timestamp})`,
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          eq(analyticsEvents.eventType, "error")
        )
      )
      .groupBy(analyticsEvents.eventName)
      .orderBy(desc(count()))
      .limit(10);

    // ============================================================================
    // DAILY TRENDS
    // ============================================================================

    const dailyTrends = await db
      .select({
        date: sql<string>`DATE(${analyticsEvents.timestamp})`,
        pageViews: count(),
        uniqueSessions: countDistinct(analyticsEvents.sessionId),
      })
      .from(analyticsEvents)
      .where(
        and(
          gte(analyticsEvents.timestamp, startDate),
          eq(analyticsEvents.eventType, "page_view")
        )
      )
      .groupBy(sql`DATE(${analyticsEvents.timestamp})`)
      .orderBy(sql`DATE(${analyticsEvents.timestamp})`);

    // ============================================================================
    // RECENT EVENTS (for live feed)
    // ============================================================================

    const recentEvents = await db
      .select({
        id: analyticsEvents.id,
        eventType: analyticsEvents.eventType,
        eventName: analyticsEvents.eventName,
        pagePath: analyticsEvents.pagePath,
        deviceType: analyticsEvents.deviceType,
        timestamp: analyticsEvents.timestamp,
      })
      .from(analyticsEvents)
      .orderBy(desc(analyticsEvents.timestamp))
      .limit(50);

    // ============================================================================
    // RESPONSE
    // ============================================================================

    return NextResponse.json({
      realtime: {
        activeSessions,
        currentPages,
      },
      traffic: {
        totalPageViews,
        uniqueSessions,
        topPages,
        deviceBreakdown,
        trafficSources,
        utmCampaigns,
      },
      behavior: {
        featureUsage,
        clickEvents,
        aiUsage: {
          total: totalAIMessages,
          breakdown: aiMessageBreakdown,
        },
        errors,
      },
      trends: {
        daily: dailyTrends,
      },
      recentEvents,
      period,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Admin analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
