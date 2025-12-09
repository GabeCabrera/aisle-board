"use client";

import { useState, useEffect, useCallback, useRef } from "react";

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
  kernel: {
    names?: string[];
    weddingDate?: string;
    guestCount?: number;
    budgetTotal?: number;
    vibe?: string[];
    vendorsBooked?: string[];
    location?: string;
    formality?: string;
    colorPalette?: string[];
  } | null;
  
  budget: {
    total: number;
    spent: number;
    paid: number;
    remaining: number;
    items: BudgetItem[];
    percentUsed: number;
  };
  
  guests: {
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

  seating: {
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
  
  vendors: {
    list: Vendor[];
    stats: {
      total: number;
      booked: number;
      researching: number;
      totalCost: number;
      totalDeposits: number;
    };
  };
  
  timeline: {
    events: TimelineEvent[];
  };
  
  tasks: {
    list: Task[];
    completed: number;
    pending: number;
  };
  
  decisions: {
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
  
  summary: {
    daysUntil: number | null;
    coupleNames: string | null;
    weddingDate: string | null;
    vibe: string[];
    vendorsBooked: string[];
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function usePlannerData() {
  const [data, setData] = useState<PlannerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const channelRef = useRef<BroadcastChannel | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      // Add cache: 'no-store' to prevent browser caching of old data
      // Append timestamp to force fresh data from server
      const res = await fetch(`/api/planner/data?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error("Failed to load data");
      const json = await res.json();
      setData(json);
      setError(null);
      setLastRefresh(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Listen for real-time updates via CustomEvent (same-tab) and BroadcastChannel (cross-tab)
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Handler for data change events
    const handleDataChange = () => {
      // Debounce: only refetch if it's been at least 500ms since last refresh
      const now = Date.now();
      if (now - lastRefresh > 500) {
        console.log("[PlannerData] Received sync signal, refreshing...");
        fetchData();
      }
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
  }, [fetchData, lastRefresh]);

  return { 
    data, 
    loading, 
    error, 
    refetch: fetchData,
    lastRefresh 
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
