import { db } from "@/lib/db";
import { customTemplates as customTemplatesTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// TYPES
// ============================================================================

export type TimelineFilter =
  | "12-months"
  | "9-months"
  | "6-months"
  | "3-months"
  | "1-month"
  | "week-of";

export type TemplateCategory =
  | "essentials"
  | "planning"
  | "people"
  | "day-of"
  | "extras";

export interface TemplateField {
  key: string;
  label: string;
  type: "text" | "date" | "number" | "checkbox" | "select" | "array" | "textarea";
  required?: boolean;
  options?: string[]; // For select type
  arrayItemSchema?: TemplateField[]; // For array type
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  timelineFilters: TimelineFilter[];
  icon: string; // Lucide icon name
  fields: TemplateField[];
  suggestedInStarterPack?: boolean;
  isFree?: boolean; // Available to free users
  isCustom?: boolean; // From database vs built-in
}

// ============================================================================
// FREE TEMPLATE IDS
// ============================================================================

// These 3 templates are available to free users
export const FREE_TEMPLATE_IDS = ["day-of-schedule", "budget", "guest-list"];

// ============================================================================
// BUILT-IN TEMPLATE REGISTRY
// ============================================================================

export const templates: TemplateDefinition[] = [
  // Cover page (always first, not in marketplace - available to all)
  {
    id: "cover",
    name: "Cover Page",
    description: "Your wedding planner cover",
    category: "essentials",
    timelineFilters: ["12-months", "9-months", "6-months", "3-months", "1-month", "week-of"],
    icon: "Book",
    suggestedInStarterPack: true,
    isFree: true,
    fields: [
      { key: "names", label: "Names", type: "text", required: true },
      { key: "weddingDate", label: "Wedding Date", type: "date", required: true },
    ],
  },

  // Essentials
  {
    id: "overview",
    name: "Wedding Overview",
    description: "Key details about your wedding at a glance",
    category: "essentials",
    timelineFilters: ["12-months", "9-months", "6-months"],
    icon: "LayoutDashboard",
    suggestedInStarterPack: true,
    isFree: false,
    fields: [
      { key: "weddingDate", label: "Wedding Date", type: "date", required: true },
      { key: "ceremonyTime", label: "Ceremony Time", type: "text" },
      { key: "ceremonyVenue", label: "Ceremony Venue", type: "text" },
      { key: "receptionVenue", label: "Reception Venue", type: "text" },
      { key: "colorPalette", label: "Color Palette", type: "text" },
      { key: "theme", label: "Theme / Style", type: "text" },
      { key: "partySize", label: "Wedding Party Size", type: "number" },
      { key: "primaryContact", label: "Primary Contact", type: "text" },
      { key: "phone", label: "Phone", type: "text" },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },

  // Planning
  {
    id: "budget",
    name: "Budget Tracker",
    description: "Track costs, payments, and remaining balances",
    category: "planning",
    timelineFilters: ["12-months", "9-months", "6-months", "3-months"],
    icon: "DollarSign",
    suggestedInStarterPack: true,
    isFree: true, // FREE TEMPLATE
    fields: [
      {
        key: "items",
        label: "Budget Items",
        type: "array",
        arrayItemSchema: [
          { key: "category", label: "Category", type: "text", required: true },
          { key: "vendor", label: "Vendor", type: "text" },
          { key: "estimated", label: "Estimated Cost", type: "number" },
          { key: "totalCost", label: "Total Cost", type: "number" },
          { key: "amountPaid", label: "Amount Paid", type: "number" },
          { key: "notes", label: "Notes", type: "text" },
        ],
      },
    ],
  },
  {
    id: "guest-list",
    name: "Guest List",
    description: "Track invitations, RSVPs, and thank yous",
    category: "planning",
    timelineFilters: ["12-months", "9-months", "6-months", "3-months", "1-month"],
    icon: "Users",
    suggestedInStarterPack: true,
    isFree: true, // FREE TEMPLATE
    fields: [
      {
        key: "guests",
        label: "Guests",
        type: "array",
        arrayItemSchema: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "rsvp", label: "RSVP", type: "checkbox" },
          { key: "meal", label: "Meal Choice", type: "text" },
          { key: "address", label: "Address", type: "text" },
          { key: "giftReceived", label: "Gift Received", type: "checkbox" },
          { key: "thankYouSent", label: "Thank You Sent", type: "checkbox" },
        ],
      },
    ],
  },
  {
    id: "vendor-contacts",
    name: "Vendor Contacts",
    description: "All your vendor information in one place",
    category: "planning",
    timelineFilters: ["12-months", "9-months", "6-months", "3-months"],
    icon: "Contact",
    suggestedInStarterPack: true,
    isFree: false,
    fields: [
      {
        key: "vendors",
        label: "Vendors",
        type: "array",
        arrayItemSchema: [
          { key: "service", label: "Service", type: "text", required: true },
          { key: "company", label: "Company / Name", type: "text" },
          { key: "phone", label: "Phone", type: "text" },
          { key: "email", label: "Email", type: "text" },
          { key: "depositPaid", label: "Deposit Paid", type: "checkbox" },
        ],
      },
    ],
  },
  {
    id: "timeline",
    name: "Planning Timeline",
    description: "Checklist organized by time until wedding",
    category: "planning",
    timelineFilters: ["12-months", "9-months"],
    icon: "CalendarCheck",
    suggestedInStarterPack: true,
    isFree: false,
    fields: [
      {
        key: "sections",
        label: "Timeline Sections",
        type: "array",
        arrayItemSchema: [
          { key: "title", label: "Section Title", type: "text", required: true },
          {
            key: "tasks",
            label: "Tasks",
            type: "array",
            arrayItemSchema: [
              { key: "task", label: "Task", type: "text", required: true },
              { key: "completed", label: "Completed", type: "checkbox" },
            ],
          },
        ],
      },
    ],
  },

  // People
  {
    id: "wedding-party",
    name: "Wedding Party",
    description: "Bridesmaids, groomsmen, and special roles",
    category: "people",
    timelineFilters: ["12-months", "9-months", "6-months"],
    icon: "Heart",
    suggestedInStarterPack: true,
    isFree: false,
    fields: [
      {
        key: "bridesmaids",
        label: "Bridesmaids",
        type: "array",
        arrayItemSchema: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "contact", label: "Phone / Email", type: "text" },
        ],
      },
      {
        key: "groomsmen",
        label: "Groomsmen",
        type: "array",
        arrayItemSchema: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "contact", label: "Phone / Email", type: "text" },
        ],
      },
      { key: "flowerGirl", label: "Flower Girl", type: "text" },
      { key: "ringBearer", label: "Ring Bearer", type: "text" },
      { key: "officiant", label: "Officiant", type: "text" },
      { key: "reader", label: "Reader / Speaker", type: "text" },
    ],
  },
  {
    id: "seating-chart",
    name: "Seating Chart",
    description: "Organize table assignments",
    category: "people",
    timelineFilters: ["3-months", "1-month", "week-of"],
    icon: "Circle",
    isFree: false,
    fields: [
      {
        key: "tables",
        label: "Tables",
        type: "array",
        arrayItemSchema: [
          { key: "tableNumber", label: "Table Number", type: "number", required: true },
          {
            key: "guests",
            label: "Guests",
            type: "array",
            arrayItemSchema: [
              { key: "name", label: "Guest Name", type: "text", required: true },
            ],
          },
        ],
      },
    ],
  },

  // Day-of
  {
    id: "day-of-schedule",
    name: "Day-Of Schedule",
    description: "Hour-by-hour timeline for the big day",
    category: "day-of",
    timelineFilters: ["1-month", "week-of"],
    icon: "Clock",
    suggestedInStarterPack: true,
    isFree: true, // FREE TEMPLATE
    fields: [
      {
        key: "events",
        label: "Schedule",
        type: "array",
        arrayItemSchema: [
          { key: "time", label: "Time", type: "text", required: true },
          { key: "event", label: "Event", type: "text", required: true },
        ],
      },
    ],
  },

  // Extras
  {
    id: "notes",
    name: "Notes",
    description: "Free-form notes and ideas",
    category: "extras",
    timelineFilters: ["12-months", "9-months", "6-months", "3-months", "1-month", "week-of"],
    icon: "StickyNote",
    isFree: false,
    fields: [
      { key: "content", label: "Notes", type: "textarea" },
    ],
  },
];

// ============================================================================
// HELPERS
// ============================================================================

export function getTemplateById(id: string): TemplateDefinition | undefined {
  return templates.find((t) => t.id === id);
}

export function getTemplatesByCategory(
  category: TemplateCategory
): TemplateDefinition[] {
  return templates.filter((t) => t.category === category);
}

export function getTemplatesByTimeline(
  timeline: TimelineFilter
): TemplateDefinition[] {
  return templates.filter((t) => t.timelineFilters.includes(timeline));
}

export function getStarterPackTemplates(): TemplateDefinition[] {
  return templates.filter((t) => t.suggestedInStarterPack);
}

export function getMarketplaceTemplates(): TemplateDefinition[] {
  // Exclude cover page from marketplace
  return templates.filter((t) => t.id !== "cover");
}

export function getFreeTemplates(): TemplateDefinition[] {
  return templates.filter((t) => t.isFree);
}

export function isTemplateFree(templateId: string): boolean {
  return FREE_TEMPLATE_IDS.includes(templateId) || templateId === "cover";
}

export function getTemplatesForPlan(plan: "free" | "complete"): TemplateDefinition[] {
  if (plan === "complete") {
    return templates.filter((t) => t.id !== "cover");
  }
  // Free plan only gets free templates (excluding cover which is added automatically)
  return templates.filter((t) => t.isFree && t.id !== "cover");
}

// ============================================================================
// DATABASE HELPERS - For custom templates
// ============================================================================

export async function getCustomTemplates(): Promise<TemplateDefinition[]> {
  const dbTemplates = await db
    .select()
    .from(customTemplatesTable)
    .where(eq(customTemplatesTable.isPublished, true));
  
  return dbTemplates.map((t) => ({
    id: t.templateId,
    name: t.name,
    description: t.description,
    category: t.category as TemplateCategory,
    timelineFilters: (t.timelineFilters as TimelineFilter[]) || [],
    icon: t.icon,
    fields: (t.fields as TemplateField[]) || [],
    isFree: t.isFree,
    isCustom: true,
  }));
}

export async function getAllTemplatesWithCustom(): Promise<TemplateDefinition[]> {
  const customTemplates = await getCustomTemplates();
  return [...templates, ...customTemplates];
}

export async function getMarketplaceTemplatesWithCustom(): Promise<TemplateDefinition[]> {
  const customTemplates = await getCustomTemplates();
  const builtIn = templates.filter((t) => t.id !== "cover");
  return [...builtIn, ...customTemplates];
}

export async function isTemplateFreeDynamic(templateId: string): Promise<boolean> {
  // Check built-in templates first
  if (FREE_TEMPLATE_IDS.includes(templateId) || templateId === "cover") {
    return true;
  }
  
  // Check custom templates
  const customTemplates = await getCustomTemplates();
  const customTemplate = customTemplates.find((t) => t.id === templateId);
  return customTemplate?.isFree ?? false;
}

export const categoryLabels: Record<TemplateCategory, string> = {
  essentials: "Essentials",
  planning: "Planning & Tracking",
  people: "People & Seating",
  "day-of": "Day Of",
  extras: "Extras",
};

export const timelineLabels: Record<TimelineFilter, string> = {
  "12-months": "12+ Months Out",
  "9-months": "9-12 Months Out",
  "6-months": "6-9 Months Out",
  "3-months": "3-6 Months Out",
  "1-month": "1-3 Months Out",
  "week-of": "Week Of",
};
