import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

import { getCalendarEvents } from "@/lib/data/calendar"; // Import the new function
import { z } from "zod";

export const dynamic = "force-dynamic";

const createEventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  allDay: z.boolean().default(false),
  location: z.string().optional(),
  category: z.enum(["vendor", "deadline", "appointment", "milestone", "personal", "other"]).default("other"),
  color: z.string().optional(),
  vendorId: z.string().optional(),
  taskId: z.string().optional(),
});

// GET /api/calendar/events - List all events for the tenant
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const events = await getCalendarEvents(session.user.tenantId); // Use the new function

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Get calendar events error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}


