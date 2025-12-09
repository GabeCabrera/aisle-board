"use client";

import { useEffect, useCallback, useRef } from "react";
import { useQuery, useQueryClient } from '@tanstack/react-query'; // Import useQuery and useQueryClient
import { useSession } from "next-auth/react"; // Assuming useSession is available for tenantId

// Channel name for real-time sync between chat and tools
export const PLANNER_SYNC_CHANNEL = "planner-data-changed";

// Custom event name for same-tab communication
export const PLANNER_DATA_CHANGED_EVENT = "planner-data-changed-event";

// Broadcast that planner data has changed (call from chat after tool calls)
// This handles both cross-tab (BroadcastChannel) and same-tab (CustomEvent) scenarios
export function broadcastPlannerDataChanged() {
  if (typeof window === "undefined") return;
  
  console.log("[PlannerData] Broadcasting data change signal...");
  
  // Same-tab: Dispatch a CustomEvent that components in the same tab can listen for
  window.dispatchEvent(new CustomEvent(PLANNER_DATA_CHANGED_EVENT, {
    detail: { timestamp: Date.now() }
  }));
  
  // Cross-tab: Use BroadcastChannel for other tabs
  if ("BroadcastChannel" in window) {
    const channel = new BroadcastChannel(PLANNER_SYNC_CHANNEL);
    channel.postMessage({ type: "data-changed", timestamp: Date.now() });
    channel.close();
  }
}

// ============================================================================
// TYPES
// ============================================================================

export interface BudgetItem {
  id: string;
  category: string;
  vendor?: string;
  totalCost: number;
  amountPaid: number;
  notes?: string;
  createdAt?: string;
}

export interface Guest {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  side?: "bride" | "groom" | "both";
  group?: string;
  plusOne?: boolean;
  plusOneName?: string;
  rsvp?: "pending" | "confirmed" | "attending" | "declined";
  dietaryRestrictions?: string;
  tableNumber?: number;
  createdAt?: string;
}

export interface Vendor {
  id: string;
  name: string;
  category: string;
  status?: "researching" | "contacted" | "booked" | "confirmed" | "paid";
  cost?: number;
  depositPaid?: number;
  phone?: string;
  email?: string;
  website?: string;
  notes?: string;
  contractSigned?: boolean;
  createdAt?: string;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description?: string;
  duration?: number;
  location?: string;
  vendor?: string;
  category?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  status?: "todo" | "in_progress" | "done";
  priority?: "low" | "medium" | "high";
  category?: string;
}

export interface Decision {
  id: string;
  name: string;
  displayName: string;
  category: string;
  status: "not_started" | "researching" | "decided" | "locked";
  isRequired: boolean;
  isSkipped: boolean;
  choiceName?: string;
  choiceAmount?: number;
  lockReason?: string;
  lockDetails?: string;
}

export interface PlannerData {
  kernel?: { // Changed to optional as not always fetched
    names?: string[];
    weddingDate?: string;
    guestCount?: number;
    budgetTotal?: number;
    vibe?: string[];
    vendorsBooked?: string[];
    location?: string;
    formality?: string;
    colorPalette?: string[];
  };
  
  budget?: { // Changed to optional as not always fetched
    total: number;
    spent: number;
    paid: number;
    remaining: number;
    items: BudgetItem[];
    percentUsed: number;
  };
  
  guests?: { // Changed to optional as not always fetched
    list: Guest[];
    stats: {
      total: number;
      confirmed: number;
      declined: number;
      pending: number;
      withPlusOnes: number;
      brideSide: number;
      groomSide: number;
      both: number;
    };
  };

  seating?: { // Changed to optional as not always fetched
    tables: Array<{
      id: string;
      name: string;
      capacity: number;
      tableNumber: number;
      guests: any[];
      count: number;
      isFull: boolean;
    }>;
    unseated: any[];
    stats: {
      totalGuests: number;
      seatedCount: number;
      unseatedCount: number;
      tableCount: number;
    };
  };
  
  vendors?: { // Changed to optional as not always fetched
    list: Vendor[];
    stats: {
      total: number;
      booked: number;
      researching: number;
      totalCost: number;
      totalDeposits: number;
    };
  };
  
  timeline?: { // Changed to optional as not always fetched
    events: TimelineEvent[];
  };
  
  tasks?: { // Changed to optional as not always fetched
    list: Task[];
    completed: number;
    pending: number;
  };
  
  decisions?: { // Changed to optional as not always fetched
    list: Decision[];
    progress: {
      total: number;
      locked: number;
      decided: number;
      researching: number;
      notStarted: number;
      percentComplete: number;
    };
  };
  
  summary?: { // Changed to optional as not always fetched
    daysUntil: number | null;
    coupleNames: string | null;
    weddingDate: string | null;
    vibe: string[];
    vendorsBooked: string[];
  };
}

// ============================================================================
// QUERY FUNCTION
// ============================================================================

const fetchPlannerData = async (tenantId: string, sections: string[]): Promise<PlannerData> => {
  if (!tenantId) {
    throw new Error("Tenant ID is required to fetch planner data.");
  }
  const sectionsParam = sections.join(',');
  const res = await fetch(`/api/planner/data?sections=${sectionsParam}`);
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Failed to load planner data");
  }
  return res.json();
};

// ============================================================================
// HOOK
// ============================================================================

export function usePlannerData(
  sections: string[] = ["kernel", "budget", "guests", "seating", "vendors", "timeline", "tasks", "decisions", "summary"],
  options?: { initialData?: PlannerData }
) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;
  const channelRef = useRef<BroadcastChannel | null>(null);

  const queryKey = ['plannerData', tenantId, sections.sort().join('-')];

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: queryKey,
    queryFn: () => fetchPlannerData(tenantId!, sections),
    enabled: !!tenantId, // Only run query if tenantId is available
    staleTime: 5 * 60 * 1000, // Keep data fresh for 5 minutes
    refetchOnWindowFocus: true, // Re-fetch when window regains focus
    initialData: options?.initialData,
  });

  // Listen for real-time updates via CustomEvent (same-tab) and BroadcastChannel (cross-tab)
  useEffect(() => {
    if (typeof window === "undefined" || !tenantId) return;

    // Handler for data change events
    const handleDataChange = () => {
      console.log("[PlannerData] Received sync signal, invalidating queries...");
      queryClient.invalidateQueries({ queryKey: ['plannerData', tenantId] }); // Invalidate all plannerData queries for this tenant
    };

    // Same-tab: Listen for CustomEvent
    const customEventHandler = () => handleDataChange();
    window.addEventListener(PLANNER_DATA_CHANGED_EVENT, customEventHandler);

    // Cross-tab: Listen via BroadcastChannel
    if ("BroadcastChannel" in window) {
      channelRef.current = new BroadcastChannel(PLANNER_SYNC_CHANNEL);
      channelRef.current.onmessage = (event) => {
        if (event.data?.type === "data-changed") {
          handleDataChange();
        }
      };
    }

    return () => {
      window.removeEventListener(PLANNER_DATA_CHANGED_EVENT, customEventHandler);
      channelRef.current?.close();
      channelRef.current = null;
    };
  }, [queryClient, tenantId]);

  return { 
    data, 
    loading: isLoading, 
    error, 
    refetch,
    isFetching // isFetching indicates background refreshes
  };
}

// ============================================================================
// HELPERS
// ============================================================================

export function formatCurrency(amount: number): string {
  // Values are normalized to dollars by the API
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
