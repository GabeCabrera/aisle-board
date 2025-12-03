/**
 * Artifact Components
 * 
 * Visual displays that render inline in the chat.
 * These show the user's wedding data in interactive formats.
 */

"use client";

import { useState } from "react";

// ============================================================================
// TYPES
// ============================================================================

export interface ArtifactProps {
  type: string;
  data: unknown;
}

interface BudgetItem {
  id: string;
  category: string;
  vendor: string;
  totalCost: number;
  amountPaid: number;
  notes: string;
}

interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  side: string;
  group?: string;
  rsvp: string;
  plusOne?: boolean;
}

interface TimelineEvent {
  id: string;
  time: string;
  event: string;
  duration?: number;
  location?: string;
  notes?: string;
}

interface Task {
  id: string;
  title: string;
  dueDate?: string;
  assignee: string;
  priority: string;
  status: string;
}

interface Vendor {
  id: string;
  category: string;
  name: string;
  status: string;
  price?: number;
  depositPaid?: boolean;
}

interface Decision {
  id: string;
  name: string;
  displayName: string;
  category: string;
  status: string;
  isRequired: boolean;
  isSkipped: boolean;
  choiceName?: string;
  choiceAmount?: number;
  lockReason?: string;
  lockDetails?: string;
}

interface DecisionProgress {
  total: number;
  locked: number;
  decided: number;
  researching: number;
  notStarted: number;
  skipped: number;
  percentComplete: number;
}

// ============================================================================
// HELPERS
// ============================================================================

// Safely convert cents to dollars, handling edge cases
function centsToDollars(cents: unknown): number {
  const num = Number(cents);
  if (!Number.isFinite(num) || num < 0 || num > 100000000000) { // Max 1 billion dollars
    return 0;
  }
  return num / 100;
}

// Format currency display
function formatCurrency(cents: unknown): string {
  const dollars = centsToDollars(cents);
  return dollars.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

// ============================================================================
// MAIN ARTIFACT RENDERER
// ============================================================================

export function Artifact({ type, data }: ArtifactProps) {
  switch (type) {
    case "budget_overview":
      return <BudgetOverview data={data as { totalBudget: number; items: BudgetItem[] }} />;
    case "guest_list":
      return <GuestList data={data as { guests: Guest[]; stats: { total: number; confirmed: number; pending: number } }} />;
    case "guest_stats":
      return <GuestStats data={data as { stats: { total: number; confirmed: number; declined: number; pending: number } }} />;
    case "timeline":
      return <Timeline data={data as { events: TimelineEvent[] }} />;
    case "checklist":
      return <Checklist data={data as { tasks: Task[] }} />;
    case "checklist_full":
      return <FullChecklist data={data as { progress: DecisionProgress; decisions: Decision[] }} />;
    case "vendor_list":
      return <VendorList data={data as { vendors: Vendor[] }} />;
    case "countdown":
      return <Countdown data={data as { weddingDate: string; daysUntil: number }} />;
    case "wedding_summary":
      return <WeddingSummary data={data} />;
    default:
      return <div className="text-stone-500 text-sm">Unknown artifact type: {type}</div>;
  }
}

// ============================================================================
// BUDGET OVERVIEW
// ============================================================================

function BudgetOverview({ data }: { data: { totalBudget: number; items: BudgetItem[] } }) {
  const { totalBudget, items: rawItems } = data;
  
  // Ensure items is always an array
  const items = Array.isArray(rawItems) ? rawItems : [];
  
  // Group by category
  const byCategory = items.reduce((acc, item) => {
    if (!item?.category) return acc;
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, BudgetItem[]>);

  const totalPaid = items.reduce((sum, item) => sum + centsToDollars(item?.amountPaid), 0);
  const totalEstimated = items.reduce((sum, item) => sum + centsToDollars(item?.totalCost), 0);
  const budget = centsToDollars(totalBudget);
  const remaining = budget - totalEstimated;
  const percentAllocated = budget > 0 ? Math.min((totalEstimated / budget) * 100, 100) : 0;

  const categoryLabels: Record<string, string> = {
    venue: "Venue",
    catering: "Catering",
    photography: "Photography",
    videography: "Videography",
    florist: "Flowers",
    music_dj: "Music/DJ",
    attire: "Wedding Attire",
    hair_makeup: "Hair & Makeup",
    invitations: "Invitations",
    cake: "Cake",
    decorations: "Decor",
    transportation: "Transportation",
    officiant: "Officiant",
    rings: "Wedding Rings",
    favors: "Favors",
    honeymoon: "Honeymoon",
    other: "Other"
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden my-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 border-b border-stone-200">
        <h3 className="font-medium text-stone-800">Budget Overview</h3>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b border-stone-100">
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wide">Total Budget</p>
          <p className="text-xl font-semibold text-stone-800">${formatCurrency(totalBudget)}</p>
        </div>
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wide">Estimated</p>
          <p className="text-xl font-semibold text-stone-800">${totalEstimated.toLocaleString()}</p>
        </div>
        <div>
          <p className="text-xs text-stone-500 uppercase tracking-wide">Remaining</p>
          <p className={`text-xl font-semibold ${remaining >= 0 ? "text-green-600" : "text-red-600"}`}>
            ${Math.abs(remaining).toLocaleString()}{remaining < 0 ? " over" : ""}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      {budget > 0 && (
        <div className="px-4 py-2 border-b border-stone-100">
          <div className="h-2 bg-stone-100 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all ${percentAllocated > 100 ? "bg-red-400" : "bg-rose-400"}`}
              style={{ width: `${Math.min(percentAllocated, 100)}%` }}
            />
          </div>
          <p className="text-xs text-stone-500 mt-1">
            {percentAllocated.toFixed(0)}% allocated
          </p>
        </div>
      )}

      {/* Categories */}
      <div className="divide-y divide-stone-100">
        {Object.entries(byCategory).map(([category, categoryItems]) => {
          const categoryTotal = categoryItems.reduce((sum, i) => sum + centsToDollars(i?.totalCost), 0);
          const categoryPaid = categoryItems.reduce((sum, i) => sum + centsToDollars(i?.amountPaid), 0);
          
          return (
            <div key={category} className="px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors">
              <div>
                <p className="font-medium text-stone-700">{categoryLabels[category] || category}</p>
                {categoryItems[0]?.vendor && (
                  <p className="text-sm text-stone-500">{categoryItems[0].vendor}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-medium text-stone-800">${categoryTotal.toLocaleString()}</p>
                {categoryPaid > 0 && (
                  <p className="text-xs text-green-600">${categoryPaid.toLocaleString()} paid</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {items.length === 0 && (
        <div className="p-4 text-center text-stone-500">
          No budget items yet. Tell me about your vendors and costs!
        </div>
      )}

      {/* Total paid summary */}
      {totalPaid > 0 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-100">
          <div className="flex justify-between items-center">
            <span className="text-sm text-green-700">Total Deposits Paid</span>
            <span className="font-semibold text-green-700">${totalPaid.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// FULL CHECKLIST (Wedding Decisions)
// ============================================================================

function FullChecklist({ data }: { data: { progress: DecisionProgress; decisions: Decision[] } }) {
  const { progress, decisions: rawDecisions } = data;
  
  // Ensure decisions is always an array
  const decisions = Array.isArray(rawDecisions) ? rawDecisions : [];

  const statusIcon = (status: string, isSkipped: boolean) => {
    if (isSkipped) return <span className="text-stone-400">—</span>;
    switch (status) {
      case "locked":
        return (
          <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case "decided":
        return (
          <svg className="w-5 h-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        );
      case "researching":
        return (
          <svg className="w-5 h-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        );
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-stone-300" />;
    }
  };

  const categoryLabels: Record<string, string> = {
    foundation: "Foundation",
    venue: "Venue",
    vendors: "Vendors",
    attire: "Attire",
    ceremony: "Ceremony",
    reception: "Reception",
    guests: "Guests & Invitations",
    logistics: "Logistics",
    legal: "Legal",
    honeymoon: "Honeymoon",
  };

  // Group by category
  const byCategory = decisions.reduce((acc, d) => {
    if (!d?.category) return acc;
    if (!acc[d.category]) acc[d.category] = [];
    acc[d.category].push(d);
    return acc;
  }, {} as Record<string, Decision[]>);

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden my-4">
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 border-b border-stone-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-stone-800">Wedding Checklist</h3>
          <span className="text-sm text-stone-600">{progress?.percentComplete || 0}% complete</span>
        </div>
        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-rose-400 to-amber-400 rounded-full"
            style={{ width: `${progress?.percentComplete || 0}%` }}
          />
        </div>
        <div className="flex gap-4 mt-2 text-xs text-stone-500">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-500" /> {progress?.locked || 0} locked
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-green-300" /> {(progress?.decided || 0) - (progress?.locked || 0)} decided
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-400" /> {progress?.researching || 0} researching
          </span>
        </div>
      </div>

      <div className="divide-y divide-stone-100 max-h-96 overflow-y-auto">
        {Object.entries(byCategory).map(([category, categoryDecisions]) => (
          <div key={category}>
            <div className="px-4 py-2 bg-stone-50">
              <p className="text-xs font-medium text-stone-600 uppercase tracking-wide">
                {categoryLabels[category] || category}
              </p>
            </div>
            <div className="divide-y divide-stone-50">
              {categoryDecisions.map(decision => (
                <div key={decision.id} className={`px-4 py-2 flex items-center gap-3 hover:bg-stone-50 transition-colors ${decision.isSkipped ? "opacity-50" : ""}`}>
                  {statusIcon(decision.status, decision.isSkipped)}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${decision.status === "locked" ? "font-medium" : ""} ${decision.isSkipped ? "line-through text-stone-400" : "text-stone-700"}`}>
                      {decision.displayName}
                      {decision.isRequired && !decision.isSkipped && <span className="text-rose-500 ml-1">*</span>}
                    </p>
                    {decision.choiceName && <p className="text-xs text-stone-500 truncate">{decision.choiceName}</p>}
                    {decision.status === "locked" && decision.lockDetails && <p className="text-xs text-green-600">{decision.lockDetails}</p>}
                  </div>
                  {decision.choiceAmount && decision.choiceAmount > 0 && (
                    <p className="text-sm text-stone-600">${formatCurrency(decision.choiceAmount)}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {decisions.length === 0 && (
        <div className="p-4 text-center text-stone-500">
          No decisions tracked yet. Start chatting to build your checklist!
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GUEST LIST
// ============================================================================

function GuestList({ data }: { data: { guests: Guest[]; stats: { total: number; confirmed: number; pending: number } } }) {
  const { guests: rawGuests, stats } = data;
  const guests = Array.isArray(rawGuests) ? rawGuests : [];
  const [filter, setFilter] = useState<string>("all");

  const filteredGuests = guests.filter(g => {
    if (filter === "all") return true;
    if (filter === "confirmed") return g.rsvp === "yes";
    if (filter === "pending") return g.rsvp === "pending";
    if (filter === "declined") return g.rsvp === "no";
    return true;
  });

  const rsvpColors: Record<string, string> = {
    yes: "bg-green-100 text-green-700",
    no: "bg-red-100 text-red-700",
    pending: "bg-amber-100 text-amber-700",
    maybe: "bg-blue-100 text-blue-700"
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden my-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
        <h3 className="font-medium text-stone-800">Guest List</h3>
        <span className="text-sm text-stone-600">{stats?.total || guests.length} guests</span>
      </div>

      {/* Stats */}
      <div className="flex gap-2 p-3 border-b border-stone-100 overflow-x-auto">
        {[
          { key: "all", label: "All", count: stats?.total || guests.length },
          { key: "confirmed", label: "Confirmed", count: stats?.confirmed || 0 },
          { key: "pending", label: "Pending", count: stats?.pending || 0 },
        ].map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-all ${
              filter === key 
                ? "bg-stone-800 text-white" 
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {label} ({count})
          </button>
        ))}
      </div>

      {/* Guest rows */}
      <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
        {filteredGuests.map(guest => (
          <div key={guest.id} className="px-4 py-2 flex items-center justify-between hover:bg-stone-50 transition-colors">
            <div>
              <p className="font-medium text-stone-700">{guest.name}</p>
              {guest.group && <p className="text-xs text-stone-500">{guest.group}</p>}
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rsvpColors[guest.rsvp] || rsvpColors.pending}`}>
              {guest.rsvp === "yes" ? "Confirmed" : guest.rsvp === "no" ? "Declined" : "Pending"}
            </span>
          </div>
        ))}
      </div>

      {guests.length === 0 && (
        <div className="p-4 text-center text-stone-500">
          No guests yet. Tell me who you&apos;re inviting!
        </div>
      )}
    </div>
  );
}

// ============================================================================
// GUEST STATS (compact version)
// ============================================================================

function GuestStats({ data }: { data: { stats: { total: number; confirmed: number; declined: number; pending: number } } }) {
  const { stats } = data;

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden my-4 p-4">
      <h3 className="font-medium text-stone-800 mb-3">RSVP Status</h3>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-stone-800">{stats?.total || 0}</p>
          <p className="text-xs text-stone-500">Invited</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-green-600">{stats?.confirmed || 0}</p>
          <p className="text-xs text-stone-500">Yes</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-red-600">{stats?.declined || 0}</p>
          <p className="text-xs text-stone-500">No</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</p>
          <p className="text-xs text-stone-500">Pending</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TIMELINE
// ============================================================================

function Timeline({ data }: { data: { events: TimelineEvent[] } }) {
  const { events: rawEvents } = data;
  const events = Array.isArray(rawEvents) ? rawEvents : [];

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden my-4">
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 border-b border-stone-200">
        <h3 className="font-medium text-stone-800">Day-Of Timeline</h3>
      </div>

      <div className="p-4">
        {events.length > 0 ? (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[60px] top-2 bottom-2 w-0.5 bg-rose-200" />

            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={event.id || index} className="flex gap-4">
                  <div className="w-[60px] text-right">
                    <span className="text-sm font-medium text-stone-700">{event.time}</span>
                  </div>
                  <div className="relative">
                    <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-rose-400 -translate-x-[5px]" />
                  </div>
                  <div className="flex-1 pb-2">
                    <p className="font-medium text-stone-800">{event.event}</p>
                    {event.location && (
                      <p className="text-sm text-stone-500">{event.location}</p>
                    )}
                    {event.duration && (
                      <p className="text-xs text-stone-400">{event.duration} min</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-center text-stone-500">
            No timeline yet. Let&apos;s plan your day!
          </p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// CHECKLIST
// ============================================================================

function Checklist({ data }: { data: { tasks: Task[] } }) {
  const { tasks: rawTasks } = data;
  const tasks = Array.isArray(rawTasks) ? rawTasks : [];

  const todoTasks = tasks.filter(t => t.status === "todo");
  const doneTasks = tasks.filter(t => t.status === "done");

  const priorityColors: Record<string, string> = {
    high: "border-l-red-400",
    medium: "border-l-amber-400",
    low: "border-l-green-400"
  };

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden my-4">
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 border-b border-stone-200 flex items-center justify-between">
        <h3 className="font-medium text-stone-800">Tasks</h3>
        <span className="text-sm text-stone-600">
          {doneTasks.length}/{tasks.length} done
        </span>
      </div>

      <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
        {todoTasks.map(task => (
          <div 
            key={task.id} 
            className={`px-4 py-3 border-l-4 hover:bg-stone-50 transition-colors ${priorityColors[task.priority] || priorityColors.medium}`}
          >
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded border-2 border-stone-300 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium text-stone-700">{task.title}</p>
                {task.dueDate && (
                  <p className="text-xs text-stone-500">Due: {task.dueDate}</p>
                )}
              </div>
            </div>
          </div>
        ))}
        
        {doneTasks.length > 0 && (
          <div className="px-4 py-2 bg-stone-50">
            <p className="text-xs text-stone-500 font-medium">Completed ({doneTasks.length})</p>
          </div>
        )}
        
        {doneTasks.map(task => (
          <div key={task.id} className="px-4 py-2 opacity-60">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded bg-green-500 flex items-center justify-center mt-0.5">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-medium text-stone-500 line-through">{task.title}</p>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="p-4 text-center text-stone-500">
          No tasks yet. What needs to get done?
        </div>
      )}
    </div>
  );
}

// ============================================================================
// VENDOR LIST
// ============================================================================

function VendorList({ data }: { data: { vendors: Vendor[] } }) {
  const { vendors: rawVendors } = data;
  const vendors = Array.isArray(rawVendors) ? rawVendors : [];

  const statusLabels: Record<string, { label: string; color: string }> = {
    researching: { label: "Researching", color: "bg-stone-100 text-stone-600" },
    contacted: { label: "Contacted", color: "bg-blue-100 text-blue-700" },
    meeting_scheduled: { label: "Meeting", color: "bg-purple-100 text-purple-700" },
    booked: { label: "Booked", color: "bg-green-100 text-green-700" },
    passed: { label: "Passed", color: "bg-red-100 text-red-700" }
  };

  const categoryLabels: Record<string, string> = {
    venue: "Venue",
    photographer: "Photographer",
    videographer: "Videographer",
    caterer: "Caterer",
    florist: "Florist",
    dj: "DJ",
    band: "Band",
    officiant: "Officiant",
    planner: "Planner",
    hair: "Hair",
    makeup: "Makeup",
    cake: "Cake",
    rentals: "Rentals",
    transportation: "Transportation",
    other: "Other"
  };

  // Group by status
  const booked = vendors.filter(v => v.status === "booked");
  const inProgress = vendors.filter(v => ["contacted", "meeting_scheduled", "researching"].includes(v.status));

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden my-4">
      <div className="bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 border-b border-stone-200">
        <h3 className="font-medium text-stone-800">Vendors</h3>
      </div>

      {booked.length > 0 && (
        <>
          <div className="px-4 py-2 bg-green-50 border-b border-green-100">
            <p className="text-xs font-medium text-green-700">Booked ({booked.length})</p>
          </div>
          <div className="divide-y divide-stone-100">
            {booked.map(vendor => (
              <div key={vendor.id} className="px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors">
                <div>
                  <p className="font-medium text-stone-700">{vendor.name}</p>
                  <p className="text-sm text-stone-500">{categoryLabels[vendor.category] || vendor.category}</p>
                </div>
                {vendor.price && vendor.price > 0 && (
                  <p className="font-medium text-stone-700">${formatCurrency(vendor.price)}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {inProgress.length > 0 && (
        <>
          <div className="px-4 py-2 bg-stone-50 border-b border-stone-100">
            <p className="text-xs font-medium text-stone-600">In Progress ({inProgress.length})</p>
          </div>
          <div className="divide-y divide-stone-100">
            {inProgress.map(vendor => {
              const status = statusLabels[vendor.status] || statusLabels.researching;
              return (
                <div key={vendor.id} className="px-4 py-3 flex items-center justify-between hover:bg-stone-50 transition-colors">
                  <div>
                    <p className="font-medium text-stone-700">{vendor.name}</p>
                    <p className="text-sm text-stone-500">{categoryLabels[vendor.category] || vendor.category}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {vendors.length === 0 && (
        <div className="p-4 text-center text-stone-500">
          No vendors yet. Tell me who you&apos;re considering!
        </div>
      )}
    </div>
  );
}

// ============================================================================
// COUNTDOWN
// ============================================================================

function Countdown({ data }: { data: { weddingDate: string; daysUntil: number } }) {
  const { weddingDate, daysUntil } = data;

  if (!weddingDate || daysUntil === null || daysUntil === undefined) {
    return (
      <div className="bg-white rounded-lg border border-stone-200 p-6 my-4 text-center">
        <p className="text-stone-500">No wedding date set yet!</p>
      </div>
    );
  }

  const formattedDate = new Date(weddingDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <div className="bg-gradient-to-r from-rose-50 to-amber-50 rounded-lg border border-rose-200 p-6 my-4 text-center">
      <p className="text-6xl font-bold text-rose-500 mb-2">{daysUntil}</p>
      <p className="text-lg text-stone-600 mb-1">days until your wedding</p>
      <p className="text-sm text-stone-500">{formattedDate}</p>
    </div>
  );
}

// ============================================================================
// WEDDING SUMMARY
// ============================================================================

function WeddingSummary({ data }: { data: unknown }) {
  const rawData = data as {
    kernel?: Record<string, unknown>;
    budget?: { total: number; items: BudgetItem[] };
    guests?: Guest[];
  };

  const kernel = rawData?.kernel || {};
  const budget = rawData?.budget || { total: 0, items: [] };
  const guests = Array.isArray(rawData?.guests) ? rawData.guests : [];

  const names = Array.isArray(kernel?.names) ? kernel.names as string[] : [];
  const weddingDate = kernel?.weddingDate as string;
  const vibe = Array.isArray(kernel?.vibe) ? kernel.vibe as string[] : [];

  const totalBudget = centsToDollars(budget?.total);
  const budgetAllocated = (budget?.items || []).reduce((sum, i) => sum + centsToDollars(i?.totalCost), 0);
  
  const guestCount = guests?.length || 0;
  const confirmedGuests = guests?.filter(g => g.rsvp === "yes").length || 0;

  return (
    <div className="bg-white rounded-lg border border-stone-200 overflow-hidden my-4">
      <div className="bg-gradient-to-r from-rose-100 to-amber-100 px-4 py-4 border-b border-stone-200 text-center">
        <h3 className="text-xl font-serif text-stone-800">
          {names.length >= 2 ? `${names[0]} & ${names[1]}` : "Your Wedding"}
        </h3>
        {weddingDate && (
          <p className="text-stone-600 mt-1">
            {new Date(weddingDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
      </div>

      <div className="grid grid-cols-2 divide-x divide-stone-100">
        <div className="p-4 text-center">
          <p className="text-2xl font-bold text-stone-800">{guestCount}</p>
          <p className="text-xs text-stone-500">Guests ({confirmedGuests} confirmed)</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-2xl font-bold text-stone-800">${totalBudget.toLocaleString()}</p>
          <p className="text-xs text-stone-500">Budget (${budgetAllocated.toLocaleString()} allocated)</p>
        </div>
      </div>

      {vibe.length > 0 && (
        <div className="px-4 py-3 border-t border-stone-100">
          <p className="text-xs text-stone-500 mb-2">Vibe</p>
          <div className="flex flex-wrap gap-1">
            {vibe.map((v, i) => (
              <span key={i} className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded-full text-xs">
                {v}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
