import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/data/notifications";

/**
 * GET /api/notifications
 * Get notifications for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const result = await getNotifications(session.user.tenantId, {
      cursor,
      limit: Math.min(limit, 50), // Cap at 50
      unreadOnly,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/notifications
 * Mark notifications as read
 * Body: { notificationId?: string, all?: boolean }
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, all } = body;

    if (all) {
      await markAllNotificationsRead(session.user.tenantId);
      return NextResponse.json({ success: true, marked: "all" });
    }

    if (notificationId) {
      await markNotificationRead(notificationId);
      return NextResponse.json({ success: true, marked: notificationId });
    }

    return NextResponse.json(
      { error: "Must provide notificationId or all: true" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
