"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { type Page } from "@/lib/db/schema";

// ============================================================================
// TYPES - Single source of truth for all wedding data structures
// ============================================================================

export interface WeddingInfo {
  coupleNames: string;
  weddingDate: string | null;
  daysUntil: number | null;
  isToday: boolean;
  isPast: boolean;
}

export interface Guest {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  rsvp: boolean;
  meal?: string;
  dietaryRestrictions?: string;
  plusOne?: boolean;
  plusOneName?: string;
  giftReceived?: boolean;
  thankYouSent?: boolean;
}

export interface GuestStats {
  total: number;
  confirmed: number;
  pending: number;
  declined: number;
  withMeals: number;
  withDietaryRestrictions: number;
}

export interface BudgetItem {
  id: string;
  category: string;
  vendor: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  totalCost: number;
  amountPaid: number;
  remaining: number;
  notes?: string;
  contractStatus: "none" | "pending" | "signed" | "completed";
  depositDueDate?: string;
  finalPaymentDueDate?: string;
}

export interface BudgetStats {
  totalBudget: number;
  totalAllocated: number;
  totalPaid: number;
  totalRemaining: number;
  underBudget: number;
  itemCount: number;
  paidInFull: number;
  pendingPayments: BudgetItem[];
  upcomingPayments: BudgetItem[];
}

export interface PartyMember {
  id?: string;
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface WeddingParty {
  bridesmaids: PartyMember[];
  groomsmen: PartyMember[];
  others: PartyMember[];
  total: number;
  maidOfHonor?: PartyMember;
  bestMan?: PartyMember;
}

export interface Task {
  id: string;
  title: string;
  assignee: "partner1" | "partner2" | "both" | "unassigned";
  status: "todo" | "in-progress" | "done";
  color: string;
  dueDate?: string;
  isOverdue: boolean;
}

export interface TaskStats {
  total: number;
  todo: Task[];
  inProgress: Task[];
  done: Task[];
  overdue: Task[];
  upcoming: Task[];
  completionPercent: number;
}

export interface Vendor {
  id: string;
  category: string;
  company: string;
  contactName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  contractStatus: "none" | "pending" | "signed" | "completed";
  depositPaid: boolean;
  notes?: string;
  totalCost?: number;
  amountPaid?: number;
}

export interface VendorStats {
  total: number;
  booked: number;
  pending: number;
  withContracts: number;
}

export interface ScheduleEvent {
  id: string;
  time: string;
  endTime?: string;
  event: string;
  location?: string;
  assignees: string[];
  notes?: string;
  category: "prep" | "ceremony" | "reception" | "photos" | "other";
}

export interface Table {
  id: string;
  name: string;
  shape: "round" | "rectangle" | "square" | "oval";
  capacity: number;
  guests: SeatedGuest[];
  guestCount: number;
  isFull: boolean;
}

export interface SeatedGuest {
  id: string;
  name: string;
  meal?: string;
  dietaryRestrictions?: string;
}

export interface SeatingStats {
  totalTables: number;
  totalSeats: number;
  seatedGuests: number;
  unseatedGuests: number;
}

export interface VenueInfo {
  ceremonyVenue?: string;
  ceremonyAddress?: string;
  ceremonyTime?: string;
  receptionVenue?: string;
  receptionAddress?: string;
  receptionTime?: string;
}

export interface ThemeInfo {
  theme?: string;
  colorPalette: { color: string; hex: string }[];
}

export interface EmergencyContact {
  name: string;
  role: string;
  phone: string;
}

// ============================================================================
// MAIN DATA INTERFACE
// ============================================================================

// Internal type for extracted data (without userPlan)
interface ExtractedWeddingData {
  // Core info
  wedding: WeddingInfo;
  venues: VenueInfo;
  theme: ThemeInfo;
  emergencyContacts: EmergencyContact[];
  notes: string;

  // People
  guests: Guest[];
  guestStats: GuestStats;
  weddingParty: WeddingParty;

  // Planning
  budget: BudgetItem[];
  budgetStats: BudgetStats;
  tasks: Task[];
  taskStats: TaskStats;
  vendors: Vendor[];
  vendorStats: VendorStats;

  // Day-of
  schedule: ScheduleEvent[];
  tables: Table[];
  seatingStats: SeatingStats;

  // Raw page access (for updates)
  pages: Page[];
  getPage: (templateId: string) => Page | undefined;
  getPageFields: (templateId: string) => Record<string, unknown>;
}

// Full type exposed to consumers (includes userPlan)
export interface WeddingData extends ExtractedWeddingData {
  userPlan: "free" | "complete";
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function safeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value : [];
}

function safeNumber(value: unknown, defaultValue = 0): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? defaultValue : parsed;
  }
  return defaultValue;
}

function safeString(value: unknown, defaultValue = ""): string {
  return typeof value === "string" ? value : defaultValue;
}

// ============================================================================
// DATA EXTRACTION
// ============================================================================

function extractWeddingData(pages: Page[]): ExtractedWeddingData {
  // Helper to get page by template
  const getPage = (templateId: string) => pages.find(p => p.templateId === templateId);
  const getPageFields = (templateId: string): Record<string, unknown> => {
    const page = getPage(templateId);
    return (page?.fields || {}) as Record<string, unknown>;
  };

  // ---- COVER PAGE ----
  const coverFields = getPageFields("cover");
  const coupleNames = safeString(coverFields.names);
  const weddingDateStr = safeString(coverFields.weddingDate);
  const weddingDate = weddingDateStr || null;
  
  let daysUntil: number | null = null;
  let isToday = false;
  let isPast = false;
  
  if (weddingDate) {
    const weddingDateTime = new Date(weddingDate).getTime();
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    daysUntil = Math.ceil((weddingDateTime - now.getTime()) / (1000 * 60 * 60 * 24));
    isToday = daysUntil === 0;
    isPast = daysUntil < 0;
  }

  // ---- OVERVIEW PAGE ----
  const overviewFields = getPageFields("overview");
  
  const venues: VenueInfo = {
    ceremonyVenue: safeString(overviewFields.ceremonyVenue),
    ceremonyAddress: safeString(overviewFields.ceremonyAddress),
    ceremonyTime: safeString(overviewFields.ceremonyTime),
    receptionVenue: safeString(overviewFields.receptionVenue),
    receptionAddress: safeString(overviewFields.receptionAddress),
    receptionTime: safeString(overviewFields.receptionTime),
  };

  const rawColorPalette = safeArray<{ color?: string; hex?: string }>(overviewFields.colorPalette);
  const theme: ThemeInfo = {
    theme: safeString(overviewFields.theme),
    colorPalette: rawColorPalette.map(c => ({
      color: safeString(c?.color),
      hex: safeString(c?.hex, "#e8e4e0"),
    })),
  };

  const rawEmergencyContacts = safeArray<{ name?: string; role?: string; phone?: string }>(overviewFields.emergencyContacts);
  const emergencyContacts: EmergencyContact[] = rawEmergencyContacts.map(c => ({
    name: safeString(c?.name),
    role: safeString(c?.role),
    phone: safeString(c?.phone),
  }));

  const notes = safeString(overviewFields.notes);

  // ---- GUEST LIST ----
  const guestFields = getPageFields("guest-list");
  const rawGuests = safeArray<Record<string, unknown>>(guestFields.guests);
  
  const guests: Guest[] = rawGuests.map((g, i) => ({
    id: safeString(g?.id, `guest-${i}`),
    name: safeString(g?.name),
    email: safeString(g?.email),
    phone: safeString(g?.phone),
    address: safeString(g?.address),
    rsvp: g?.rsvp === true,
    meal: safeString(g?.meal),
    dietaryRestrictions: safeString(g?.dietaryRestrictions),
    plusOne: g?.plusOne === true,
    plusOneName: safeString(g?.plusOneName),
    giftReceived: g?.giftReceived === true,
    thankYouSent: g?.thankYouSent === true,
  })).filter(g => g.name); // Filter out empty entries

  const guestStats: GuestStats = {
    total: guests.length,
    confirmed: guests.filter(g => g.rsvp).length,
    pending: guests.filter(g => !g.rsvp).length,
    declined: 0, // Could add this field later
    withMeals: guests.filter(g => g.meal).length,
    withDietaryRestrictions: guests.filter(g => g.dietaryRestrictions).length,
  };

  // ---- WEDDING PARTY ----
  const partyFields = getPageFields("wedding-party");
  
  const mapPartyMember = (m: Record<string, unknown>, i: number): PartyMember => ({
    id: safeString(m?.id, `party-${i}`),
    name: safeString(m?.name),
    role: safeString(m?.role),
    email: safeString(m?.email),
    phone: safeString(m?.phone),
  });

  const bridesmaids = safeArray<Record<string, unknown>>(partyFields.bridesmaids)
    .map(mapPartyMember)
    .filter(m => m.name);
  const groomsmen = safeArray<Record<string, unknown>>(partyFields.groomsmen)
    .map(mapPartyMember)
    .filter(m => m.name);
  const others = safeArray<Record<string, unknown>>(partyFields.others)
    .map(mapPartyMember)
    .filter(m => m.name);

  const weddingParty: WeddingParty = {
    bridesmaids,
    groomsmen,
    others,
    total: bridesmaids.length + groomsmen.length + others.length,
    maidOfHonor: bridesmaids.find(b => b.role === "Maid of Honor"),
    bestMan: groomsmen.find(g => g.role === "Best Man"),
  };

  // ---- BUDGET ----
  const budgetFields = getPageFields("budget");
  const totalBudget = safeNumber(budgetFields.totalBudget);
  const rawBudgetItems = safeArray<Record<string, unknown>>(budgetFields.items);

  const budget: BudgetItem[] = rawBudgetItems.map((item, i) => {
    const totalCost = safeNumber(item?.totalCost);
    const amountPaid = safeNumber(item?.amountPaid);
    return {
      id: safeString(item?.id, `budget-${i}`),
      category: safeString(item?.category),
      vendor: safeString(item?.vendor),
      contactName: safeString(item?.contactName),
      contactEmail: safeString(item?.contactEmail),
      contactPhone: safeString(item?.contactPhone),
      totalCost,
      amountPaid,
      remaining: totalCost - amountPaid,
      notes: safeString(item?.notes),
      contractStatus: (item?.contractStatus as BudgetItem["contractStatus"]) || "none",
      depositDueDate: safeString(item?.depositDueDate),
      finalPaymentDueDate: safeString(item?.finalPaymentDueDate),
    };
  }).filter(item => item.category || item.vendor);

  const totalAllocated = budget.reduce((sum, item) => sum + item.totalCost, 0);
  const totalPaid = budget.reduce((sum, item) => sum + item.amountPaid, 0);
  const pendingPayments = budget.filter(item => item.remaining > 0);
  
  const today = new Date();
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const upcomingPayments = budget.filter(item => {
    if (item.remaining <= 0) return false;
    const depositDue = item.depositDueDate ? new Date(item.depositDueDate) : null;
    const finalDue = item.finalPaymentDueDate ? new Date(item.finalPaymentDueDate) : null;
    return (depositDue && depositDue >= today && depositDue <= thirtyDaysFromNow) ||
           (finalDue && finalDue >= today && finalDue <= thirtyDaysFromNow);
  });

  const budgetStats: BudgetStats = {
    totalBudget,
    totalAllocated,
    totalPaid,
    totalRemaining: totalAllocated - totalPaid,
    underBudget: totalBudget - totalAllocated,
    itemCount: budget.length,
    paidInFull: budget.filter(item => item.remaining <= 0).length,
    pendingPayments,
    upcomingPayments,
  };

  // ---- TASKS ----
  const taskFields = getPageFields("task-board");
  const rawTasks = safeArray<Record<string, unknown>>(taskFields.tasks);

  const tasks: Task[] = rawTasks.map((t, i) => {
    const dueDate = safeString(t?.dueDate);
    const status = safeString(t?.status, "todo") as Task["status"];
    const isOverdue = dueDate && status !== "done" && new Date(dueDate) < today;
    
    return {
      id: safeString(t?.id, `task-${i}`),
      title: safeString(t?.title),
      assignee: (t?.assignee as Task["assignee"]) || "unassigned",
      status,
      color: safeString(t?.color, "yellow"),
      dueDate: dueDate || undefined,
      isOverdue: !!isOverdue,
    };
  }).filter(t => t.title);

  const todoTasks = tasks.filter(t => t.status === "todo");
  const inProgressTasks = tasks.filter(t => t.status === "in-progress");
  const doneTasks = tasks.filter(t => t.status === "done");
  const overdueTasks = tasks.filter(t => t.isOverdue);
  const upcomingTasks = [...todoTasks, ...inProgressTasks]
    .filter(t => t.dueDate)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
    .slice(0, 5);

  const taskStats: TaskStats = {
    total: tasks.length,
    todo: todoTasks,
    inProgress: inProgressTasks,
    done: doneTasks,
    overdue: overdueTasks,
    upcoming: upcomingTasks,
    completionPercent: tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0,
  };

  // ---- VENDORS ----
  const vendorFields = getPageFields("vendor-contacts");
  const rawVendors = safeArray<Record<string, unknown>>(vendorFields.vendors);

  const vendors: Vendor[] = rawVendors.map((v, i) => ({
    id: safeString(v?.id, `vendor-${i}`),
    category: safeString(v?.category),
    company: safeString(v?.company),
    contactName: safeString(v?.contactName),
    email: safeString(v?.email),
    phone: safeString(v?.phone),
    website: safeString(v?.website),
    address: safeString(v?.address),
    contractStatus: (v?.contractStatus as Vendor["contractStatus"]) || "none",
    depositPaid: v?.depositPaid === true,
    notes: safeString(v?.notes),
    totalCost: safeNumber(v?.totalCost),
    amountPaid: safeNumber(v?.amountPaid),
  })).filter(v => v.company || v.category);

  const vendorStats: VendorStats = {
    total: vendors.length,
    booked: vendors.filter(v => v.contractStatus === "signed" || v.contractStatus === "completed").length,
    pending: vendors.filter(v => v.contractStatus === "pending").length,
    withContracts: vendors.filter(v => v.contractStatus !== "none").length,
  };

  // ---- SCHEDULE ----
  const scheduleFields = getPageFields("day-of-schedule");
  const rawEvents = safeArray<Record<string, unknown>>(scheduleFields.events);

  const schedule: ScheduleEvent[] = rawEvents.map((e, i) => ({
    id: safeString(e?.id, `event-${i}`),
    time: safeString(e?.time),
    endTime: safeString(e?.endTime) || undefined,
    event: safeString(e?.event),
    location: safeString(e?.location) || undefined,
    assignees: safeArray<string>(e?.assignees),
    notes: safeString(e?.notes) || undefined,
    category: (e?.category as ScheduleEvent["category"]) || "other",
  })).filter(e => e.event);

  // ---- SEATING ----
  const seatingFields = getPageFields("seating-chart");
  const rawTables = safeArray<Record<string, unknown>>(seatingFields.tables);

  const tables: Table[] = rawTables.map((t, i) => {
    const rawTableGuests = safeArray<Record<string, unknown>>(t?.guests);
    const tableGuests: SeatedGuest[] = rawTableGuests.map((g, j) => ({
      id: safeString(g?.id, `seated-${i}-${j}`),
      name: safeString(g?.name),
      meal: safeString(g?.meal) || undefined,
      dietaryRestrictions: safeString(g?.dietaryRestrictions) || undefined,
    })).filter(g => g.name);

    const capacity = safeNumber(t?.capacity, 8);
    return {
      id: safeString(t?.id, `table-${i}`),
      name: safeString(t?.name, `Table ${i + 1}`),
      shape: (t?.shape as Table["shape"]) || "round",
      capacity,
      guests: tableGuests,
      guestCount: tableGuests.length,
      isFull: tableGuests.length >= capacity,
    };
  });

  const totalSeats = tables.reduce((sum, t) => sum + t.capacity, 0);
  const seatedGuests = tables.reduce((sum, t) => sum + t.guestCount, 0);

  const seatingStats: SeatingStats = {
    totalTables: tables.length,
    totalSeats,
    seatedGuests,
    unseatedGuests: guestStats.confirmed - seatedGuests,
  };

  // ---- RETURN COMPLETE DATA ----
  return {
    wedding: { coupleNames, weddingDate, daysUntil, isToday, isPast },
    venues,
    theme,
    emergencyContacts,
    notes,
    guests,
    guestStats,
    weddingParty,
    budget,
    budgetStats,
    tasks,
    taskStats,
    vendors,
    vendorStats,
    schedule,
    tables,
    seatingStats,
    pages,
    getPage,
    getPageFields,
  };
}

// ============================================================================
// CONTEXT
// ============================================================================

const WeddingDataContext = createContext<WeddingData | null>(null);

export function WeddingDataProvider({ 
  pages,
  userPlan = "free",
  children 
}: { 
  pages: Page[];
  userPlan?: "free" | "complete";
  children: ReactNode;
}) {
  const data = useMemo(() => ({
    ...extractWeddingData(pages),
    userPlan,
  }), [pages, userPlan]);

  return (
    <WeddingDataContext.Provider value={data}>
      {children}
    </WeddingDataContext.Provider>
  );
}

export function useWeddingData(): WeddingData {
  const context = useContext(WeddingDataContext);
  if (!context) {
    throw new Error("useWeddingData must be used within a WeddingDataProvider");
  }
  return context;
}

// ============================================================================
// CONVENIENCE HOOKS
// ============================================================================

export function useWeddingInfo() {
  const { wedding, venues, theme } = useWeddingData();
  return { wedding, venues, theme };
}

export function useGuests() {
  const { guests, guestStats } = useWeddingData();
  return { guests, stats: guestStats };
}

export function useBudget() {
  const { budget, budgetStats } = useWeddingData();
  return { items: budget, stats: budgetStats };
}

export function useTasks() {
  const { tasks, taskStats } = useWeddingData();
  return { tasks, stats: taskStats };
}

export function useVendors() {
  const { vendors, vendorStats, budget } = useWeddingData();
  // Also return budget items that have vendor info for cross-reference
  const budgetVendors = budget.filter(b => b.vendor);
  return { vendors, stats: vendorStats, budgetVendors };
}

export function useWeddingParty() {
  const { weddingParty } = useWeddingData();
  return weddingParty;
}

export function useSchedule() {
  const { schedule } = useWeddingData();
  return schedule;
}

export function useSeating() {
  const { tables, seatingStats, guests, guestStats } = useWeddingData();
  const confirmedGuests = guests.filter(g => g.rsvp);
  return { tables, stats: seatingStats, confirmedGuests, guestStats };
}

export function useUserPlan() {
  const { userPlan } = useWeddingData();
  return {
    plan: userPlan,
    isFree: userPlan === "free",
    isComplete: userPlan === "complete",
  };
}
