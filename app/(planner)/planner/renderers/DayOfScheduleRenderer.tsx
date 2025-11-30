"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { 
  Plus, Trash2, Clock, MapPin, Users, GripVertical,
  ChevronDown, ChevronUp, Sparkles, Camera, Music, Utensils,
  Heart, Copy, Download, Share2
} from "lucide-react";
import { toast } from "sonner";
import { type RendererWithAllPagesProps, type ScheduleEvent, type PartyMember } from "./types";

const EVENT_CATEGORIES = [
  { id: "prep", label: "Getting Ready", icon: Sparkles, color: "bg-pink-100 border-pink-300 text-pink-700" },
  { id: "ceremony", label: "Ceremony", icon: Heart, color: "bg-purple-100 border-purple-300 text-purple-700" },
  { id: "photos", label: "Photos", icon: Camera, color: "bg-blue-100 border-blue-300 text-blue-700" },
  { id: "reception", label: "Reception", icon: Music, color: "bg-amber-100 border-amber-300 text-amber-700" },
  { id: "other", label: "Other", icon: Clock, color: "bg-warm-100 border-warm-300 text-warm-700" },
];

const COMMON_EVENTS = [
  { time: "8:00 AM", event: "Hair & Makeup Begins", category: "prep" },
  { time: "10:00 AM", event: "Photographer Arrives", category: "prep" },
  { time: "11:00 AM", event: "Getting Ready Photos", category: "photos" },
  { time: "12:00 PM", event: "Light Lunch", category: "prep" },
  { time: "2:00 PM", event: "First Look", category: "photos" },
  { time: "2:30 PM", event: "Wedding Party Photos", category: "photos" },
  { time: "3:30 PM", event: "Guests Arrive", category: "ceremony" },
  { time: "4:00 PM", event: "Ceremony Begins", category: "ceremony" },
  { time: "4:30 PM", event: "Ceremony Ends", category: "ceremony" },
  { time: "4:45 PM", event: "Family Photos", category: "photos" },
  { time: "5:30 PM", event: "Cocktail Hour", category: "reception" },
  { time: "6:30 PM", event: "Grand Entrance", category: "reception" },
  { time: "6:45 PM", event: "First Dance", category: "reception" },
  { time: "7:00 PM", event: "Dinner Service", category: "reception" },
  { time: "7:45 PM", event: "Toasts & Speeches", category: "reception" },
  { time: "8:15 PM", event: "Cake Cutting", category: "reception" },
  { time: "8:30 PM", event: "Parent Dances", category: "reception" },
  { time: "8:45 PM", event: "Open Dancing", category: "reception" },
  { time: "10:30 PM", event: "Last Dance", category: "reception" },
  { time: "10:45 PM", event: "Send Off", category: "reception" },
];

export function DayOfScheduleRenderer({ page, fields, updateField, allPages }: RendererWithAllPagesProps) {
  // Ensure events is always an array
  const rawEvents = fields.events;
  const events: ScheduleEvent[] = Array.isArray(rawEvents) ? rawEvents : [];
  
  const [showTemplates, setShowTemplates] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Get wedding party for assignee suggestions
  const weddingPartyPage = allPages.find(p => p.templateId === "wedding-party");
  const partyFields = (weddingPartyPage?.fields || {}) as Record<string, unknown>;
  const rawBridesmaids = partyFields.bridesmaids;
  const rawGroomsmen = partyFields.groomsmen;
  const rawOtherParty = partyFields.others;
  const bridesmaids: PartyMember[] = Array.isArray(rawBridesmaids) ? rawBridesmaids : [];
  const groomsmen: PartyMember[] = Array.isArray(rawGroomsmen) ? rawGroomsmen : [];
  const otherParty: PartyMember[] = Array.isArray(rawOtherParty) ? rawOtherParty : [];

  // Get vendor contacts for assignee suggestions
  const vendorPage = allPages.find(p => p.templateId === "vendor-contacts");
  const vendorFields = (vendorPage?.fields || {}) as Record<string, unknown>;
  const rawVendors = vendorFields.vendors;
  const vendors: { company: string; category: string }[] = Array.isArray(rawVendors) ? rawVendors : [];

  // Build assignee suggestions
  const assigneeSuggestions = [
    { group: "Couple", names: ["Bride", "Groom", "Both"] },
    { group: "Wedding Party", names: [...bridesmaids.map(b => b.name), ...groomsmen.map(g => g.name), ...otherParty.map(o => o.name)].filter(Boolean) },
    { group: "Vendors", names: vendors.map(v => v.company || v.category).filter(Boolean) },
    { group: "Other", names: ["Coordinator", "DJ", "Photographer", "Videographer", "Caterer", "Florist"] },
  ];

  // Generate unique ID
  const generateId = () => `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addEvent = () => {
    const newEvent: ScheduleEvent = {
      id: generateId(),
      time: "",
      endTime: "",
      event: "",
      location: "",
      assignees: [],
      notes: "",
      category: "other",
    };
    updateField("events", [...events, newEvent]);
  };

  const addFromTemplate = (template: typeof COMMON_EVENTS[0]) => {
    const newEvent: ScheduleEvent = {
      id: generateId(),
      time: template.time,
      event: template.event,
      category: template.category as ScheduleEvent["category"],
      assignees: [],
      notes: "",
    };
    updateField("events", [...events, newEvent]);
    toast.success(`Added: ${template.event}`);
  };

  const addAllTemplates = () => {
    const newEvents = COMMON_EVENTS.map(template => ({
      id: generateId(),
      time: template.time,
      event: template.event,
      category: template.category as ScheduleEvent["category"],
      assignees: [],
      notes: "",
    }));
    updateField("events", [...events, ...newEvents]);
    toast.success(`Added ${newEvents.length} events`);
    setShowTemplates(false);
  };

  const updateEvent = (index: number, key: string, value: unknown) => {
    const updated = [...events];
    updated[index] = { ...updated[index], [key]: value };
    updateField("events", updated);
  };

  const removeEvent = (index: number) => {
    updateField("events", events.filter((_, i) => i !== index));
  };

  const toggleAssignee = (eventIndex: number, name: string) => {
    const event = events[eventIndex];
    const currentAssignees = event.assignees || [];
    const isAssigned = currentAssignees.includes(name);
    
    updateEvent(
      eventIndex,
      "assignees",
      isAssigned
        ? currentAssignees.filter(a => a !== name)
        : [...currentAssignees, name]
    );
  };

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.time || "";
    const timeB = b.time || "";
    return timeA.localeCompare(timeB);
  });

  // Group events by category for summary
  const eventsByCategory = events.reduce((acc, event) => {
    const cat = event.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(event);
    return acc;
  }, {} as Record<string, ScheduleEvent[]>);

  const getCategoryInfo = (categoryId: string) => {
    return EVENT_CATEGORIES.find(c => c.id === categoryId) || EVENT_CATEGORIES[4];
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newEvents = [...events];
    const draggedEvent = newEvents[draggedIndex];
    newEvents.splice(draggedIndex, 1);
    newEvents.splice(index, 0, draggedEvent);
    updateField("events", newEvents);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  // Copy schedule to clipboard
  const copySchedule = () => {
    const scheduleText = sortedEvents
      .map(e => `${e.time}${e.endTime ? ` - ${e.endTime}` : ""}: ${e.event}${e.location ? ` @ ${e.location}` : ""}${e.assignees?.length ? ` (${e.assignees.join(", ")})` : ""}`)
      .join("\n");
    
    navigator.clipboard.writeText(scheduleText);
    toast.success("Schedule copied to clipboard!");
  };

  // Calculate total time span
  const firstEventTime = sortedEvents[0]?.time;
  const lastEventTime = sortedEvents[sortedEvents.length - 1]?.time;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow-lg p-8 md:p-12">
        {/* Page Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-light tracking-wide">
            {page.title}
          </h2>
          <div className="w-10 h-px bg-warm-400 mx-auto mt-4" />
          {firstEventTime && lastEventTime && (
            <p className="text-warm-500 mt-4 text-sm">
              {firstEventTime} — {lastEventTime}
            </p>
          )}
        </div>

        {/* Category Summary */}
        <div className="grid grid-cols-5 gap-2 mb-8">
          {EVENT_CATEGORIES.map(cat => {
            const count = eventsByCategory[cat.id]?.length || 0;
            const Icon = cat.icon;
            return (
              <div 
                key={cat.id}
                className={`text-center p-3 rounded-lg border ${cat.color}`}
              >
                <Icon className="w-5 h-5 mx-auto mb-1" />
                <p className="text-xs font-medium">{count}</p>
                <p className="text-[10px] uppercase tracking-wider opacity-75">{cat.label}</p>
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-6">
          <Button variant="outline" onClick={() => setShowTemplates(!showTemplates)}>
            <Sparkles className="w-4 h-4 mr-2" />
            {showTemplates ? "Hide Templates" : "Add from Template"}
          </Button>
          <Button variant="outline" onClick={addEvent}>
            <Plus className="w-4 h-4 mr-2" />
            Add Custom Event
          </Button>
          {events.length > 0 && (
            <Button variant="outline" onClick={copySchedule}>
              <Copy className="w-4 h-4 mr-2" />
              Copy Schedule
            </Button>
          )}
        </div>

        {/* Templates */}
        {showTemplates && (
          <div className="mb-8 p-4 border border-warm-200 rounded-lg bg-warm-50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-warm-700">Common Wedding Events</h3>
              <Button size="sm" onClick={addAllTemplates}>
                Add All ({COMMON_EVENTS.length})
              </Button>
            </div>
            <div className="grid md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {COMMON_EVENTS.map((template, idx) => {
                const cat = getCategoryInfo(template.category);
                const Icon = cat.icon;
                const alreadyAdded = events.some(e => 
                  e.event.toLowerCase() === template.event.toLowerCase()
                );
                
                return (
                  <button
                    key={idx}
                    onClick={() => !alreadyAdded && addFromTemplate(template)}
                    disabled={alreadyAdded}
                    className={`flex items-center gap-3 p-2 rounded border text-left transition-colors ${
                      alreadyAdded 
                        ? "bg-warm-100 border-warm-200 opacity-50 cursor-not-allowed"
                        : "bg-white border-warm-200 hover:border-warm-400"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-warm-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-warm-700 truncate">
                        {template.event}
                      </p>
                      <p className="text-xs text-warm-500">{template.time}</p>
                    </div>
                    {alreadyAdded && (
                      <span className="text-xs text-warm-400">Added</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline */}
        {events.length > 0 ? (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[72px] top-0 bottom-0 w-0.5 bg-warm-200" />

            <div className="space-y-4">
              {sortedEvents.map((event, index) => {
                const cat = getCategoryInfo(event.category);
                const Icon = cat.icon;
                const isExpanded = expandedEvent === event.id;
                const originalIndex = events.findIndex(e => e.id === event.id);

                return (
                  <div
                    key={event.id}
                    draggable
                    onDragStart={() => handleDragStart(originalIndex)}
                    onDragOver={(e) => handleDragOver(e, originalIndex)}
                    onDragEnd={handleDragEnd}
                    className={`relative flex gap-4 ${draggedIndex === originalIndex ? "opacity-50" : ""}`}
                  >
                    {/* Time */}
                    <div className="w-16 text-right flex-shrink-0 pt-3">
                      <Input
                        value={event.time || ""}
                        onChange={(e) => updateEvent(originalIndex, "time", e.target.value)}
                        className="text-sm text-right px-1 h-7 border-0 bg-transparent focus:bg-white focus:border-warm-300"
                        placeholder="Time"
                      />
                    </div>

                    {/* Timeline dot */}
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${cat.color} border-2`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Event Card */}
                    <div className="flex-1 border border-warm-200 rounded-lg overflow-hidden bg-white hover:border-warm-300 transition-colors">
                      <div className="p-3">
                        <div className="flex items-start gap-3">
                          {/* Drag handle */}
                          <div className="cursor-grab pt-1 text-warm-300 hover:text-warm-500">
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Event content */}
                          <div className="flex-1 min-w-0">
                            <Input
                              value={event.event || ""}
                              onChange={(e) => updateEvent(originalIndex, "event", e.target.value)}
                              className="font-medium border-0 px-0 text-warm-800 focus:ring-0"
                              placeholder="Event name"
                            />
                            
                            <div className="flex flex-wrap items-center gap-3 mt-1">
                              {/* Category selector */}
                              <select
                                value={event.category || "other"}
                                onChange={(e) => updateEvent(originalIndex, "category", e.target.value)}
                                className="text-xs px-2 py-1 border border-warm-200 rounded bg-white"
                              >
                                {EVENT_CATEGORIES.map(c => (
                                  <option key={c.id} value={c.id}>{c.label}</option>
                                ))}
                              </select>

                              {/* Location */}
                              {(event.location || isExpanded) && (
                                <div className="flex items-center gap-1 text-sm text-warm-500">
                                  <MapPin className="w-3 h-3" />
                                  <Input
                                    value={event.location || ""}
                                    onChange={(e) => updateEvent(originalIndex, "location", e.target.value)}
                                    className="h-6 text-xs border-0 px-1 w-32 bg-transparent focus:bg-white"
                                    placeholder="Location"
                                  />
                                </div>
                              )}

                              {/* Assignees preview */}
                              {event.assignees && event.assignees.length > 0 && (
                                <div className="flex items-center gap-1 text-xs text-warm-500">
                                  <Users className="w-3 h-3" />
                                  <span>{event.assignees.slice(0, 2).join(", ")}</span>
                                  {event.assignees.length > 2 && (
                                    <span className="text-warm-400">+{event.assignees.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Expand/collapse */}
                          <button
                            onClick={() => setExpandedEvent(isExpanded ? null : event.id)}
                            className="p-1 hover:bg-warm-100 rounded"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-warm-400" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-warm-400" />
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => removeEvent(originalIndex)}
                            className="p-1 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="p-3 bg-warm-50 border-t border-warm-200">
                          <div className="grid md:grid-cols-2 gap-4">
                            {/* End time & Location */}
                            <div className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Label className="text-xs w-20">End Time</Label>
                                <Input
                                  value={event.endTime || ""}
                                  onChange={(e) => updateEvent(originalIndex, "endTime", e.target.value)}
                                  placeholder="End time"
                                  className="text-sm flex-1"
                                />
                              </div>
                              <div className="flex items-center gap-2">
                                <Label className="text-xs w-20">Location</Label>
                                <Input
                                  value={event.location || ""}
                                  onChange={(e) => updateEvent(originalIndex, "location", e.target.value)}
                                  placeholder="Where does this happen?"
                                  className="text-sm flex-1"
                                />
                              </div>
                              <div className="space-y-1">
                                <Label className="text-xs">Notes</Label>
                                <Textarea
                                  value={event.notes || ""}
                                  onChange={(e) => updateEvent(originalIndex, "notes", e.target.value)}
                                  placeholder="Additional details..."
                                  rows={2}
                                  className="text-sm"
                                />
                              </div>
                            </div>

                            {/* Assignees */}
                            <div>
                              <Label className="text-xs mb-2 block">Who&apos;s Involved?</Label>
                              <div className="space-y-2 max-h-40 overflow-y-auto">
                                {assigneeSuggestions.map(group => (
                                  group.names.length > 0 && (
                                    <div key={group.group}>
                                      <p className="text-[10px] uppercase tracking-wider text-warm-400 mb-1">
                                        {group.group}
                                      </p>
                                      <div className="flex flex-wrap gap-1">
                                        {group.names.map(name => {
                                          const isSelected = event.assignees?.includes(name);
                                          return (
                                            <button
                                              key={name}
                                              onClick={() => toggleAssignee(originalIndex, name)}
                                              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                                                isSelected
                                                  ? "bg-warm-600 text-white border-warm-600"
                                                  : "bg-white border-warm-300 hover:border-warm-400"
                                              }`}
                                            >
                                              {name}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 bg-warm-50 rounded-lg">
            <Clock className="w-12 h-12 mx-auto text-warm-300 mb-4" />
            <p className="text-warm-500 mb-2">No events scheduled yet</p>
            <p className="text-sm text-warm-400 mb-4">
              Start with our templates or add your own events
            </p>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setShowTemplates(true)}>
                <Sparkles className="w-4 h-4 mr-2" />
                Use Templates
              </Button>
              <Button onClick={addEvent}>
                <Plus className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
