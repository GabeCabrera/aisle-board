import { db } from "@/lib/db";
import { calendarEvents } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getCalendarEvents(tenantId: string) {
  const events = await db.query.calendarEvents.findMany({
    where: eq(calendarEvents.tenantId, tenantId),
    orderBy: [desc(calendarEvents.startTime)],
  });
  return events;
}
