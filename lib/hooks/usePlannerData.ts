"use client";

import { useState, useEffect } from "react";

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/planner/data");
      if (!res.ok) throw new Error("Failed to load data");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { data, loading, error, refetch: fetchData };
}

// ============================================================================
// HELPERS
// ============================================================================

export function formatCurrency(amount: number): string {
  // Values are stored in dollars, not cents
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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
