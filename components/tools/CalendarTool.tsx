"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useBrowser } from "@/components/layout/browser-context";
import { 
  Loader2, 
  RefreshCw, 
  Calendar as CalendarIcon, 
  CheckCircle, 
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Smartphone,
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

export default function CalendarTool() {
  const browser = useBrowser();
  const calendarRef = useRef<FullCalendar>(null);
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
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
      setLoading(true);
      
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
        backgroundColor: getCategoryColor(e.category),
        borderColor: getCategoryColor(e.category),
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "vendor": return "#3B82F6"; // Blue
      case "deadline": return "#EF4444"; // Red
      case "appointment": return "#8B5CF6"; // Purple
      case "milestone": return "#F59E0B"; // Amber
      case "personal": return "#10B981"; // Emerald
      default: return "#6B7280"; // Gray
    }
  };

  // Custom Header Actions
  const handlePrev = () => {
    const api = calendarRef.current?.getApi();
    api?.prev();
  };

  const handleNext = () => {
    const api = calendarRef.current?.getApi();
    api?.next();
  };

  const handleToday = () => {
    const api = calendarRef.current?.getApi();
    api?.today();
  };

  const changeView = (newView: string) => {
    const api = calendarRef.current?.getApi();
    api?.changeView(newView);
    setView(newView);
  };

  if (loading && !events.length) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col animate-fade-up bg-white">
      {/* Header Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between p-4 border-b gap-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-medium text-stone-800">Wedding Calendar</h1>
            <p className="text-xs text-stone-500">
              {syncStatus.connected 
                ? `Synced with ${syncStatus.email}` 
                : "Manage your wedding schedule"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full px-4">
                <Plus className="h-3.5 w-3.5" />
                Add Event
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Calendar Event</DialogTitle>
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

          <Button
            variant="ghost"
            size="sm"
            onClick={handleImportTasks}
            disabled={isImporting}
            className="text-xs h-8 gap-1.5 text-stone-600 hover:text-stone-900"
            title="Import tasks with due dates"
          >
            <Download className={cn("h-3.5 w-3.5", isImporting && "animate-spin")} />
            {isImporting ? "Importing..." : "Import Tasks"}
          </Button>

          {syncStatus.connected ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncNow} 
              disabled={isSyncing}
              className="text-xs h-8 gap-1.5"
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
              {isSyncing ? "Syncing..." : "Sync Now"}
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleConnectGoogle}
              className="text-xs h-8 gap-1.5 border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:text-blue-800"
            >
              <Monitor className="h-3.5 w-3.5" />
              Connect Google
            </Button>
          )}
          
          <div className="h-4 w-px bg-stone-200 mx-1" />
          
          <div className="flex items-center bg-stone-100 rounded-lg p-0.5">
            <button 
              onClick={() => changeView("dayGridMonth")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                view === "dayGridMonth" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Month
            </button>
            <button 
              onClick={() => changeView("timeGridWeek")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                view === "timeGridWeek" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              Week
            </button>
            <button 
              onClick={() => changeView("listWeek")}
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                view === "listWeek" ? "bg-white text-stone-800 shadow-sm" : "text-stone-500 hover:text-stone-700"
              )}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {/* Calendar Styles Override */}
        <style jsx global>{`
          .fc {
            --fc-border-color: #e7e5e4;
            --fc-button-text-color: #57534e;
            --fc-button-bg-color: white;
            --fc-button-border-color: #d6d3d1;
            --fc-button-hover-bg-color: #f5f5f4;
            --fc-button-hover-border-color: #a8a29e;
            --fc-button-active-bg-color: #e7e5e4;
            --fc-button-active-border-color: #78716c;
            --fc-event-bg-color: #3b82f6;
            --fc-event-border-color: #3b82f6;
            --fc-today-bg-color: #fff1f2;
            --fc-neutral-bg-color: #fafaf9;
            --fc-list-event-hover-bg-color: #f5f5f4;
            font-family: inherit;
          }
          .fc .fc-toolbar-title {
            font-size: 1.25rem;
            font-family: serif;
            font-weight: 500;
            color: #292524;
          }
          .fc .fc-col-header-cell-cushion {
            padding: 8px 0;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #78716c;
          }
          .fc-theme-standard td, .fc-theme-standard th {
            border-color: #f5f5f4;
          }
        `}</style>
        
        <div className="flex-1 p-4 bg-white overflow-y-auto">
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
            eventClassNames="cursor-pointer shadow-sm border-0 rounded px-1 text-xs font-medium"
            eventContent={(eventInfo) => (
              <div className="flex items-center gap-1 overflow-hidden">
                <span className="truncate">{eventInfo.event.title}</span>
                {eventInfo.event.extendedProps.googleEventId && (
                  <Monitor className="h-2 w-2 flex-shrink-0 opacity-50" />
                )}
              </div>
            )}
            noEventsContent={() => (
              <div className="flex flex-col items-center justify-center p-8 text-stone-400">
                <CalendarIcon className="h-12 w-12 mb-2 opacity-20" />
                <p>No events scheduled</p>
                <Button 
                  variant="link" 
                  onClick={() => setIsAddEventOpen(true)}
                  className="mt-2 text-rose-500"
                >
                  Add an event
                </Button>
              </div>
            )}
          />
        </div>
      </div>
    </div>
  );
}
