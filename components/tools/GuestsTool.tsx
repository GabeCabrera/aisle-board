"use client";

import { useState, useEffect } from "react";
import { usePlannerData, Guest } from "@/lib/hooks/usePlannerData";
import { RefreshCw, Clock } from "lucide-react";

function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 10) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export default function GuestsTool() {
  const { data, loading, refetch, lastRefresh } = usePlannerData();
  const [filter, setFilter] = useState<"all" | "confirmed" | "pending" | "declined">("all");
  const [search, setSearch] = useState("");
  const [groupBy, setGroupBy] = useState<"none" | "side" | "group">("none");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [timeAgo, setTimeAgo] = useState("just now");

  // Update "time ago" display every 10 seconds
  useEffect(() => {
    const updateTimeAgo = () => setTimeAgo(formatTimeAgo(lastRefresh));
    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 10000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  // Refresh when tab becomes visible
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && Date.now() - lastRefresh > 30000) {
        refetch();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [lastRefresh, refetch]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

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

  const guests = data?.guests;
  const stats = guests?.stats;
  const hasData = guests && guests.list.length > 0;

  // Filter and search
  let filteredGuests = guests?.list || [];
  
  if (filter !== "all") {
    filteredGuests = filteredGuests.filter(g => {
      if (filter === "confirmed") return g.rsvp === "confirmed" || g.rsvp === "attending";
      if (filter === "declined") return g.rsvp === "declined";
      if (filter === "pending") return g.rsvp === "pending" || !g.rsvp;
      return true;
    });
  }
  
  if (search) {
    const q = search.toLowerCase();
    filteredGuests = filteredGuests.filter(g => 
      g.name.toLowerCase().includes(q) ||
      g.email?.toLowerCase().includes(q) ||
      g.group?.toLowerCase().includes(q)
    );
  }

  // Group guests
  const groupedGuests = (): Record<string, Guest[]> => {
    if (groupBy === "none") return { "All Guests": filteredGuests };
    
    return filteredGuests.reduce((acc, guest) => {
      let key: string;
      if (groupBy === "side") {
        key = guest.side === "bride" ? "Bride's Side" 
            : guest.side === "groom" ? "Groom's Side" 
            : "Both Sides";
      } else {
        key = guest.group || "No Group";
      }
      if (!acc[key]) acc[key] = [];
      acc[key].push(guest);
      return acc;
    }, {} as Record<string, Guest[]>);
  };

  const groups = groupedGuests();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="font-serif text-3xl text-ink mb-1">Guest List</h1>
          <p className="text-ink-soft">Manage your wedding guests</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-ink-faint">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated {timeAgo}</span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-ink-soft hover:text-ink hover:bg-stone-100 transition-all disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {!hasData ? (
        /* Empty state */
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          </div>
          <h2 className="font-medium text-ink text-xl mb-2">No guests yet</h2>
          <p className="text-ink-soft mb-6">
            Tell me about your guests in chat and I&apos;ll add them to your list.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
          >
            Go to chat
          </a>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Total Guests</p>
              <p className="text-2xl font-serif text-ink">{stats?.total || 0}</p>
              {stats?.withPlusOnes ? (
                <p className="text-xs text-ink-faint mt-1">+{stats.withPlusOnes} plus ones</p>
              ) : null}
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Confirmed</p>
              <p className="text-2xl font-serif text-green-600">{stats?.confirmed || 0}</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Pending</p>
              <p className="text-2xl font-serif text-amber-600">{stats?.pending || 0}</p>
            </div>

            <div className="bg-white rounded-2xl border border-stone-200 p-5">
              <p className="text-sm text-ink-soft mb-1">Declined</p>
              <p className="text-2xl font-serif text-stone-400">{stats?.declined || 0}</p>
            </div>
          </div>

          {/* Side breakdown */}
          {(stats?.brideSide || stats?.groomSide) ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-5 mb-6">
              <div className="flex items-center gap-6">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink-soft">Bride&apos;s side</span>
                    <span className="text-ink">{stats?.brideSide || 0}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-400 rounded-full"
                      style={{ width: `${stats?.total ? ((stats.brideSide || 0) / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-ink-soft">Groom&apos;s side</span>
                    <span className="text-ink">{stats?.groomSide || 0}</span>
                  </div>
                  <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-400 rounded-full"
                      style={{ width: `${stats?.total ? ((stats.groomSide || 0) / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* Search and filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 relative">
              <svg 
                className="w-5 h-5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2"
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search guests..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-200 rounded-xl text-ink placeholder:text-ink-faint focus:outline-none focus:border-rose-300"
              />
            </div>

            {/* RSVP Filter */}
            <div className="flex gap-2">
              {(["all", "confirmed", "pending", "declined"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    filter === f
                      ? "bg-rose-500 text-white"
                      : "bg-white border border-stone-200 text-ink-soft hover:border-rose-300"
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Group by */}
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-ink-soft">Group by:</span>
            {(["none", "side", "group"] as const).map(g => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  groupBy === g
                    ? "bg-stone-200 text-ink"
                    : "text-ink-soft hover:bg-stone-100"
                }`}
              >
                {g === "none" ? "None" : g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>

          {/* Guest List */}
          {Object.entries(groups).map(([groupName, groupGuests]) => (
            <div key={groupName} className="mb-6">
              {groupBy !== "none" && (
                <h3 className="font-medium text-ink mb-3 flex items-center gap-2">
                  {groupName}
                  <span className="text-xs text-ink-faint font-normal">({groupGuests.length})</span>
                </h3>
              )}
              <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
                <div className="divide-y divide-stone-100">
                  {groupGuests.map((guest) => (
                    <GuestRow key={guest.id} guest={guest} />
                  ))}
                </div>
              </div>
            </div>
          ))}

          {filteredGuests.length === 0 && (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200">
              <p className="text-ink-soft">No guests match your search</p>
            </div>
          )}

          {/* Help prompt */}
          <div className="mt-6 p-4 bg-stone-50 rounded-xl text-center">
            <p className="text-sm text-ink-soft">
              Need to add or update guests?{" "}
              <a href="/" className="text-rose-600 hover:text-rose-700 font-medium">
                Tell me in chat
              </a>
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function GuestRow({ guest }: { guest: Guest }) {
  const rsvpStyle = () => {
    switch (guest.rsvp) {
      case "confirmed":
      case "attending":
        return "bg-green-50 text-green-700";
      case "declined":
        return "bg-stone-100 text-stone-500";
      default:
        return "bg-amber-50 text-amber-700";
    }
  };

  const rsvpLabel = () => {
    switch (guest.rsvp) {
      case "confirmed":
      case "attending":
        return "Confirmed";
      case "declined":
        return "Declined";
      default:
        return "Pending";
    }
  };

  return (
    <div className="px-6 py-4 flex items-center gap-4">
      {/* Avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-medium">
        {guest.name.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-ink truncate">
          {guest.name}
          {guest.plusOne && (
            <span className="ml-2 text-xs text-ink-faint">+1</span>
          )}
        </p>
        <div className="flex items-center gap-2 text-xs text-ink-faint">
          {guest.group && <span>{guest.group}</span>}
          {guest.email && (
            <>
              {guest.group && <span>•</span>}
              <span className="truncate">{guest.email}</span>
            </>
          )}
        </div>
      </div>

      {/* Side indicator */}
      {guest.side && guest.side !== "both" && (
        <span className={`text-xs px-2 py-1 rounded-full ${
          guest.side === "bride" ? "bg-rose-50 text-rose-600" : "bg-blue-50 text-blue-600"
        }`}>
          {guest.side === "bride" ? "Bride" : "Groom"}
        </span>
      )}

      {/* Dietary restrictions */}
      {guest.dietaryRestrictions && (
        <span className="text-xs px-2 py-1 rounded-full bg-orange-50 text-orange-600">
          {guest.dietaryRestrictions}
        </span>
      )}

      {/* RSVP status */}
      <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${rsvpStyle()}`}>
        {rsvpLabel()}
      </span>
    </div>
  );
}
