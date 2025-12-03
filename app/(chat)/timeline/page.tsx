"use client";

import { usePlannerData, TimelineEvent } from "@/lib/hooks/usePlannerData";

export default function TimelinePage() {
  const { data, loading } = usePlannerData();

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex items-center gap-2 text-ink-soft">
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "150ms" }} />
          <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    );
  }

  const events = data?.timeline?.events || [];
  const hasData = events.length > 0;
  const weddingDate = data?.summary?.weddingDate;

  // Sort events by time
  const sortedEvents = [...events].sort((a, b) => {
    const timeA = a.time || "00:00";
    const timeB = b.time || "00:00";
    return timeA.localeCompare(timeB);
  });

  // Group by category (prep, ceremony, reception, etc.)
  const groupedEvents = sortedEvents.reduce((acc, event) => {
    const category = event.category || "Other";
    if (!acc[category]) acc[category] = [];
    acc[category].push(event);
    return acc;
  }, {} as Record<string, TimelineEvent[]>);

  const categoryOrder = ["Prep", "Ceremony", "Cocktail Hour", "Reception", "Other"];
  const orderedCategories = categoryOrder.filter(cat => groupedEvents[cat]?.length > 0);
  // Add any categories not in the predefined order
  Object.keys(groupedEvents).forEach(cat => {
    if (!orderedCategories.includes(cat)) orderedCategories.push(cat);
  });

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="font-serif text-3xl text-ink mb-1">Wedding Day Timeline</h1>
        <p className="text-ink-soft">
          {weddingDate 
            ? `Your schedule for ${new Date(weddingDate).toLocaleDateString("en-US", { 
                weekday: "long", 
                month: "long", 
                day: "numeric", 
                year: "numeric" 
              })}`
            : "Your day-of schedule"
          }
        </p>
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="font-medium text-ink text-xl mb-2">No timeline events yet</h2>
          <p className="text-ink-soft mb-6">
            Tell me about your wedding day schedule in chat and I&apos;ll build your timeline.
          </p>
          <a 
            href="/c" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
          >
            Go to chat
          </a>

          {/* Sample timeline hint */}
          <div className="mt-8 p-4 bg-stone-50 rounded-xl text-left">
            <p className="text-sm font-medium text-ink mb-2">Example things to tell me:</p>
            <ul className="text-sm text-ink-soft space-y-1">
              <li>&quot;Ceremony starts at 4pm&quot;</li>
              <li>&quot;Hair and makeup from 10am to 1pm&quot;</li>
              <li>&quot;First dance right after dinner&quot;</li>
              <li>&quot;We want to do a sparkler exit at 10pm&quot;</li>
            </ul>
          </div>
        </div>
      ) : (
        <>
          {/* Timeline view */}
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[23px] top-0 bottom-0 w-0.5 bg-stone-200" />

            {orderedCategories.map((category) => (
              <div key={category} className="mb-8">
                {/* Category header */}
                <div className="flex items-center gap-3 mb-4 relative">
                  <div className="w-12 h-12 rounded-full bg-rose-100 border-4 border-white flex items-center justify-center z-10">
                    {getCategoryIcon(category)}
                  </div>
                  <h2 className="font-medium text-lg text-ink">{category}</h2>
                </div>

                {/* Events in this category */}
                <div className="ml-14 space-y-3">
                  {groupedEvents[category].map((event) => (
                    <TimelineEventCard key={event.id} event={event} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Help prompt */}
          <div className="mt-6 p-4 bg-stone-50 rounded-xl text-center">
            <p className="text-sm text-ink-soft">
              Need to add or adjust your timeline?{" "}
              <a href="/c" className="text-rose-600 hover:text-rose-700 font-medium">
                Tell me in chat
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function getCategoryIcon(category: string) {
  switch (category.toLowerCase()) {
    case "prep":
      return <span className="text-lg">💄</span>;
    case "ceremony":
      return <span className="text-lg">💒</span>;
    case "cocktail hour":
      return <span className="text-lg">🥂</span>;
    case "reception":
      return <span className="text-lg">🎉</span>;
    default:
      return <span className="text-lg">⏰</span>;
  }
}

function TimelineEventCard({ event }: { event: TimelineEvent }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-4 hover:border-stone-300 transition-colors">
      <div className="flex items-start gap-4">
        {/* Time */}
        <div className="flex-shrink-0 w-16 text-right">
          <p className="font-medium text-ink">{formatTime(event.time)}</p>
          {event.duration && (
            <p className="text-xs text-ink-faint">{event.duration} min</p>
          )}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-ink">{event.title}</h3>
          {event.description && (
            <p className="text-sm text-ink-soft mt-1">{event.description}</p>
          )}
          <div className="flex flex-wrap gap-2 mt-2">
            {event.location && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {event.location}
              </span>
            )}
            {event.vendor && (
              <span className="inline-flex items-center gap-1 text-xs text-ink-faint">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {event.vendor}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(time: string): string {
  if (!time) return "";
  
  // Handle already formatted times
  if (time.includes("AM") || time.includes("PM") || time.includes("am") || time.includes("pm")) {
    return time;
  }
  
  // Parse 24h format
  const [hours, minutes] = time.split(":").map(Number);
  if (isNaN(hours)) return time;
  
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes?.toString().padStart(2, "0") || "00";
  
  return `${displayHours}:${displayMinutes} ${period}`;
}
