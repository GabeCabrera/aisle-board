import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  getCalendarEventById,
  updateCalendarEvent,
  deleteCalendarEvent,
  getGoogleCalendarConnection,
} from "@/lib/db/queries";
import { deleteGoogleEvent } from "@/lib/calendar/google-client";
import { z } from "zod";
import logger from "@/lib/logger";

export const dynamic = "force-dynamic";

const updateEventSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  startTime: z.string().optional(),
  endTime: z.string().optional().nullable(),
  allDay: z.boolean().optional(),
  location: z.string().optional().nullable(),
  category: z.enum(["vendor", "deadline", "appointment", "milestone", "personal", "other"]).optional(),
  color: z.string().optional().nullable(),
  vendorId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
});

interface RouteParams {
  params: Promise<{ eventId: string }>;
}

// GET /api/calendar/events/[eventId] - Get a single event
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;
    const event = await getCalendarEventById(eventId, session.user.tenantId);

    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    return NextResponse.json({ event });
  } catch (error) {
    logger.error("Get calendar event error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/calendar/events/[eventId] - Update an event
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    // Check event exists and belongs to tenant
    const existingEvent = await getCalendarEventById(eventId, session.user.tenantId);
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const result = updateEventSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: result.error.errors[0]?.message || "Validation failed" },
        { status: 400 }
      );
    }

    const data = result.data;

    // Build update object
    const updateData: Record<string, unknown> = {};
    
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.startTime !== undefined) updateData.startTime = new Date(data.startTime);
    if (data.endTime !== undefined) updateData.endTime = data.endTime ? new Date(data.endTime) : null;
    if (data.allDay !== undefined) updateData.allDay = data.allDay;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.color !== undefined) updateData.color = data.color;
    if (data.vendorId !== undefined) updateData.vendorId = data.vendorId;
    if (data.taskId !== undefined) updateData.taskId = data.taskId;

    // If connected to Google, mark as pending sync
    if (existingEvent.googleEventId) {
      updateData.syncStatus = "pending";
    }

    const event = await updateCalendarEvent(
      eventId,
      session.user.tenantId,
      updateData
    );

    return NextResponse.json({ event });
  } catch (error) {
    logger.error("Update calendar event error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/calendar/events/[eventId] - Delete an event
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { eventId } = await params;

    // Check event exists and belongs to tenant
    const existingEvent = await getCalendarEventById(eventId, session.user.tenantId);
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // If synced with Google, delete from Google Calendar too
    if (existingEvent.googleEventId) {
      const connection = await getGoogleCalendarConnection(session.user.tenantId);
      if (connection?.weddingCalendarId) {
        try {
          await deleteGoogleEvent(
            session.user.tenantId,
            connection.weddingCalendarId,
            existingEvent.googleEventId
          );
        } catch (googleError) {
          // Log but don't fail the deletion - the event may already be deleted from Google
          logger.error("Failed to delete Google event", googleError instanceof Error ? googleError : undefined);
        }
      }
    }

    await deleteCalendarEvent(eventId, session.user.tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error("Delete calendar event error", error instanceof Error ? error : undefined);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
