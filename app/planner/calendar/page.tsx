import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getCalendarEvents } from "@/lib/data/calendar";
import CalendarTool from "@/components/tools/CalendarTool";

export default async function CalendarPage() {
  const session = await getServerSession(authOptions);
  
  const initialEvents = session?.user?.tenantId 
    ? await getCalendarEvents(session.user.tenantId)
    : [];

  // Map to the format CalendarTool expects, e.g., if needed
  const mappedEvents = initialEvents.map((e: any) => ({
    id: e.id,
    title: e.title,
    start: e.startTime.toISOString(), // Ensure ISO string format for FullCalendar
    end: e.endTime?.toISOString(),
    allDay: e.allDay,
    backgroundColor: "white",
    borderColor: "#e5e5e5",
    textColor: "#1c1917",
    classNames: ["border", "shadow-sm", "rounded-md", "px-1", "py-0.5", "text-xs", "font-medium", "hover:shadow-md", "transition-shadow"],
    extendedProps: {
      description: e.description,
      location: e.location,
      category: e.category,
      googleEventId: e.googleEventId,
      syncStatus: e.syncStatus
    }
  }));

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-y-auto">
        <CalendarTool initialEvents={mappedEvents} />
      </div>
    </div>
  );
}