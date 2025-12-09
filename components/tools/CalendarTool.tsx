"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  Plus,
  Monitor,
  Download
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Types
interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps?: {
    description?: string;
    location?: string;
    category?: string;
    googleEventId?: string;
    syncStatus?: string;
  };
}

interface GoogleSyncStatus {
  connected: boolean;
  email?: string;
  lastSyncedAt?: string;
  calendarName?: string;
}

interface CalendarToolProps {
  initialEvents: CalendarEvent[];
}

export default function CalendarTool({ initialEvents }: CalendarToolProps) {
  const router = useRouter();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents);
  const [loading, setLoading] = useState(initialEvents.length === 0); // Only show loading if no initial events
  const [syncStatus, setSyncStatus] = useState<GoogleSyncStatus>({ connected: false });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [view, setView] = useState("dayGridMonth");
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: "",
    date: new Date().toISOString().split('T')[0],
    time: "12:00",
    description: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch Data
  const fetchData = useCallback(async () => {
    try {
      // Only set loading if no initial events, otherwise it's a background refresh
      if (events.length === 0) setLoading(true); 
      
      // Fetch events
      const eventsRes = await fetch("/api/calendar/events");
      if (!eventsRes.ok) throw new Error("Failed to load events");
      const eventsData = await eventsRes.json();
      
      // Map API events to FullCalendar format
      const mappedEvents = eventsData.events.map((e: any) => ({
        id: e.id,
        title: e.title,
        start: e.startTime,
        end: e.endTime,
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
      
      setEvents(mappedEvents);
      
      // Fetch Google status
      const statusRes = await fetch("/api/calendar/google/status");
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setSyncStatus(statusData);
      }
      
    } catch (error) {
      console.error("Calendar load error:", error);
      toast.error("Failed to load calendar data");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [events.length]); // Depend on events.length to control loading state

  useEffect(() => {
    if (initialEvents.length > 0) {
      setLoading(false); // Already have data
    } else {
      fetchData(); // Fetch if no initial events
    }
  }, [initialEvents, fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/calendar/google/connect";
  };

  const handleSyncNow = async () => {
    if (!syncStatus.connected) return;
    
    try {
      setIsSyncing(true);
      const res = await fetch("/api/calendar/google/sync", { method: "POST" });
      if (!res.ok) throw new Error("Sync failed");
      
      const result = await res.json();
      toast.success(result.message || "Sync completed");
      await fetchData();
    } catch (error) {
      toast.error("Failed to sync with Google Calendar");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleImportTasks = async () => {
    try {
      setIsImporting(true);
      const res = await fetch("/api/calendar/sync-internal", { 
        method: "POST",
        body: JSON.stringify({ type: "tasks" }),
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("Import failed");
      
      const result = await res.json();
      toast.success(result.message || "Tasks imported");
      await fetchData();
    } catch (error) {
      toast.error("Failed to import tasks");
    } finally {
      setIsImporting(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.title || !newEvent.date) {
      toast.error("Please fill in title and date");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEvent.title,
          startTime: `${newEvent.date}T${newEvent.time}`,
          description: newEvent.description,
          category: "other" // Default category
        })
      });

      if (!res.ok) throw new Error("Failed to create event");

      toast.success("Event created successfully");
      setIsAddEventOpen(false);
      setNewEvent({
        title: "",
        date: new Date().toISOString().split('T')[0],
        time: "12:00",
        description: ""
      });
      await fetchData();
    } catch (error) {
      toast.error("Failed to create event");
    } finally {
      setIsSubmitting(false);
    }
  };

  const changeView = (newView: string) => {
    const api = calendarRef.current?.getApi();
    api?.changeView(newView);
    setView(newView);
  };

  if (loading && events.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" data-testid="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1400px] mx-auto py-8 px-6 space-y-8 animate-fade-up">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <h1 className="font-serif text-5xl md:text-6xl text-foreground tracking-tight">
            Calendar
          </h1>
          <p className="text-xl text-muted-foreground mt-2 font-light">
            {syncStatus.connected 
                ? `Synced with ${syncStatus.email}` 
                : "Manage your wedding schedule and deadlines."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-muted rounded-full p-1">
            <button 
              onClick={() => changeView("dayGridMonth")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                view === "dayGridMonth" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Month
            </button>
            <button 
              onClick={() => changeView("timeGridWeek")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                view === "timeGridWeek" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Week
            </button>
            <button 
              onClick={() => changeView("listWeek")}
              className={cn(
                "px-4 py-1.5 text-sm font-medium rounded-full transition-all",
                view === "listWeek" ? "bg-white text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
              List
            </button>
          </div>

          <div className="h-8 w-px bg-border mx-2 hidden md:block" />

          {syncStatus.connected ? (
            <Button 
              variant="outline" 
              onClick={handleSyncNow} 
              disabled={isSyncing}
              className="gap-2"
            >
              <RefreshCw className={cn("h-4 w-4", isSyncing && "animate-spin")} />
              {isSyncing ? "Syncing..." : "Sync"}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              onClick={handleConnectGoogle}
              className="gap-2"
            >
              <Monitor className="h-4 w-4" />
              Connect Google
            </Button>
          )}

          <Button
            variant="outline"
            onClick={handleImportTasks}
            disabled={isImporting}
            className="gap-2"
            title="Import tasks with due dates"
          >
            <Download className={cn("h-4 w-4", isImporting && "animate-spin")} />
            Import Tasks
          </Button>

          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-lifted hover:-translate-y-0.5">
                <Plus className="h-4 w-4" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">Add Event</DialogTitle>
                <DialogDescription>Add a new event to your wedding timeline.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddEvent} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Event Title</Label>
                  <Input 
                    id="title" 
                    value={newEvent.title} 
                    onChange={(e) => setNewEvent({...newEvent, title: e.target.value})}
                    placeholder="e.g. Venue Walkthrough"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date"
                      value={newEvent.date} 
                      onChange={(e) => setNewEvent({...newEvent, date: e.target.value})}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time</Label>
                    <Input 
                      id="time" 
                      type="time"
                      value={newEvent.time} 
                      onChange={(e) => setNewEvent({...newEvent, time: e.target.value})}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input 
                    id="description" 
                    value={newEvent.description} 
                    onChange={(e) => setNewEvent({...newEvent, description: e.target.value})}
                    placeholder="Add notes..."
                  />
                </div>
                <DialogFooter className="mt-6">
                  <Button type="button" variant="outline" onClick={() => setIsAddEventOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Event"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Main Content */}
      <Card className="flex-1 relative overflow-hidden flex flex-col min-h-[600px] border border-border shadow-soft rounded-3xl">
        {/* Calendar Styles Override */}
        <style jsx global>{`
          .fc {
            --fc-border-color: #f5f5f4; /* warm-100 */
            --fc-button-text-color: #44403c; /* warm-700 */
            --fc-button-bg-color: transparent;
            --fc-button-border-color: transparent;
            --fc-button-hover-bg-color: #f5f5f4;
            --fc-button-hover-border-color: transparent;
            --fc-button-active-bg-color: #e7e5e4;
            --fc-button-active-border-color: transparent;
            --fc-event-bg-color: white;
            --fc-event-border-color: #e5e5e5;
            --fc-today-bg-color: #fafaf9;
            --fc-neutral-bg-color: #fafaf9;
            --fc-list-event-hover-bg-color: #f5f5f4;
            font-family: inherit;
            height: 100%;
            width: 100%;
          }
          .fc .fc-toolbar-title {
            font-size: 1.5rem;
            font-family: "Bodoni Moda", serif;
            font-weight: 500;
            color: #1c1917; /* warm-900 */
          }
          .fc .fc-col-header-cell-cushion {
            padding: 12px 0;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #78716c; /* warm-500 */
          }
          .fc .fc-daygrid-day-number {
            font-size: 0.875rem;
            font-weight: 500;
            color: #44403c; /* warm-700 */
            padding: 8px;
          }
          .fc .fc-button {
            border-radius: 9999px;
            text-transform: capitalize;
            font-weight: 500;
            font-size: 0.875rem;
          }
          .fc-theme-standard td, .fc-theme-standard th {
            border-color: #f5f5f4;
          }
        `}</style>
        
        <CardContent className="flex-1 p-6 bg-white h-full flex flex-col">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: '' // We handled views in custom header
            }}
            events={events}
            height="100%"
            editable={true} // Allow drag & drop
            selectable={true}
            selectMirror={true}
            dayMaxEvents={true}
            eventContent={(eventInfo) => (
              <div className="flex items-center gap-2 overflow-hidden px-1 w-full">
                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                   eventInfo.event.extendedProps.category === 'vendor' ? 'bg-blue-500' :
                   eventInfo.event.extendedProps.category === 'deadline' ? 'bg-red-500' :
                   eventInfo.event.extendedProps.category === 'milestone' ? 'bg-amber-500' :
                   'bg-stone-500'
                }`} />
                <span className="truncate text-stone-700">{eventInfo.event.title}</span>
                {eventInfo.event.extendedProps.googleEventId && (
                  <Monitor className="h-2 w-2 flex-shrink-0 opacity-40 ml-auto" />
                )}
              </div>
            )}
            noEventsContent={() => (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mb-2 opacity-20" />
                <p>No events scheduled</p>
                <Button 
                  variant="link" 
                  onClick={() => setIsAddEventOpen(true)}
                  className="mt-2 text-primary"
                >
                  Add an event
                </Button>
              </div>
            )}
          />
        </CardContent>
      </Card>
    </div>
  );
}
