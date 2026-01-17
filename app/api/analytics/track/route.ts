import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { analyticsEvents } from "@/lib/db/schema";
import { z } from "zod";

// Rate limiting map (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 100; // events per minute
const RATE_WINDOW = 60 * 1000; // 1 minute

function checkRateLimit(sessionId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(sessionId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(sessionId, { count: 1, resetAt: now + RATE_WINDOW });
    return true;
  }

  if (entry.count >= RATE_LIMIT) {
    return false;
  }

  entry.count++;
  return true;
}

// Event schema validation
const eventSchema = z.object({
  eventType: z.enum(["page_view", "click", "feature_use", "form_submit", "error", "session_start", "session_end"]),
  eventName: z.string().min(1).max(100),
  eventData: z.record(z.unknown()).optional().default({}),
  pagePath: z.string().min(1).max(500),
  pageTitle: z.string().max(200).optional(),
  timestamp: z.number(),
  timeOnPage: z.number().optional(),
});

const requestSchema = z.object({
  events: z.array(eventSchema).min(1).max(50),
  sessionId: z.string().min(1).max(100),
  sessionStart: z.number().optional(),
  referrer: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  screenWidth: z.number().optional(),
  screenHeight: z.number().optional(),
  deviceType: z.enum(["mobile", "tablet", "desktop"]).optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request body
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      events,
      sessionId,
      sessionStart,
      referrer,
      userAgent,
      screenWidth,
      screenHeight,
      deviceType,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    } = parsed.data;

    // Rate limit check
    if (!checkRateLimit(sessionId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded" },
        { status: 429 }
      );
    }

    // Get session for authenticated users (optional)
    const session = await getServerSession(authOptions);
    const tenantId = session?.user?.tenantId || null;
    const userId = session?.user?.id || null;

    // Prepare events for insertion
    const eventsToInsert = events.map((event) => ({
      tenantId,
      userId,
      sessionId,
      eventType: event.eventType,
      eventName: event.eventName,
      eventData: event.eventData,
      pagePath: event.pagePath,
      pageTitle: event.pageTitle,
      referrer,
      userAgent,
      screenWidth,
      screenHeight,
      deviceType,
      timestamp: new Date(event.timestamp),
      sessionStart: sessionStart ? new Date(sessionStart) : null,
      timeOnPage: event.timeOnPage,
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
    }));

    // Insert events
    await db.insert(analyticsEvents).values(eventsToInsert);

    return NextResponse.json({
      success: true,
      count: events.length
    });
  } catch (error) {
    console.error("Analytics track error:", error);
    return NextResponse.json(
      { error: "Failed to track events" },
      { status: 500 }
    );
  }
}
