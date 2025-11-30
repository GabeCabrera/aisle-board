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
    description: "Your wedding dashboard with live stats and key details",
    category: "essentials",
    timelineFilters: ["12-months", "9-months", "6-months", "3-months", "1-month", "week-of"],
    icon: "LayoutDashboard",
    suggestedInStarterPack: true,
    isFree: false,
    fields: [
      // Venue details
      { key: "ceremonyVenue", label: "Ceremony Venue", type: "text" },
      { key: "ceremonyAddress", label: "Ceremony Address", type: "text" },
      { key: "ceremonyTime", label: "Ceremony Time", type: "text" },
      { key: "receptionVenue", label: "Reception Venue", type: "text" },
      { key: "receptionAddress", label: "Reception Address", type: "text" },
      { key: "receptionTime", label: "Reception Time", type: "text" },
      // Style
      { key: "theme", label: "Theme / Style", type: "text" },
      { key: "colorPalette", label: "Color Palette", type: "array", arrayItemSchema: [
        { key: "color", label: "Color", type: "text" },
        { key: "hex", label: "Hex Code", type: "text" },
      ]},
      // Contacts
      { key: "emergencyContacts", label: "Day-Of Contacts", type: "array", arrayItemSchema: [
        { key: "name", label: "Name", type: "text" },
        { key: "role", label: "Role", type: "text" },
        { key: "phone", label: "Phone", type: "text" },
      ]},
      // Notes
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
      { key: "totalBudget", label: "Total Budget", type: "number" },
      {
        key: "items",
        label: "Budget Items",
        type: "array",
        arrayItemSchema: [
          { 
            key: "category", 
            label: "Category", 
            type: "select", 
            required: true,
            options: [
              "Venue",
              "Catering",
              "Photography",
              "Videography",
              "Florist",
              "Music / DJ",
              "Wedding Attire",
              "Hair & Makeup",
              "Invitations & Stationery",
              "Wedding Cake",
              "Decorations",
              "Transportation",
              "Officiant",
              "Wedding Rings",
              "Favors & Gifts",
              "Honeymoon",
              "Other",
            ],
          },
          { key: "vendor", label: "Vendor Name", type: "text" },
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
    description: "Track invitations, RSVPs, and collect addresses",
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
          { key: "email", label: "Email", type: "text" },
          { key: "phone", label: "Phone", type: "text" },
          { key: "address", label: "Address", type: "text" },
          { key: "rsvp", label: "RSVP", type: "checkbox" },
          { key: "meal", label: "Meal", type: "text" },
          { key: "giftReceived", label: "Gift", type: "checkbox" },
          { key: "thankYouSent", label: "Thank You", type: "checkbox" },
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
    description: "Bridesmaids, groomsmen, and special roles with messaging",
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
          { key: "role", label: "Role", type: "select", options: ["Maid of Honor", "Bridesmaid", "Junior Bridesmaid"] },
          { key: "email", label: "Email", type: "text" },
          { key: "phone", label: "Phone", type: "text" },
        ],
      },
      {
        key: "groomsmen",
        label: "Groomsmen",
        type: "array",
        arrayItemSchema: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "role", label: "Role", type: "select", options: ["Best Man", "Groomsman", "Junior Groomsman"] },
          { key: "email", label: "Email", type: "text" },
          { key: "phone", label: "Phone", type: "text" },
        ],
      },
      {
        key: "others",
        label: "Other Party Members",
        type: "array",
        arrayItemSchema: [
          { key: "name", label: "Name", type: "text", required: true },
          { key: "role", label: "Role", type: "text" },
          { key: "email", label: "Email", type: "text" },
          { key: "phone", label: "Phone", type: "text" },
        ],
      },
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

  // Planning - Task Board
  {
    id: "task-board",
    name: "Task Board",
    description: "Post-it style tasks to track who's doing what",
    category: "planning",
    timelineFilters: ["12-months", "9-months", "6-months", "3-months", "1-month", "week-of"],
    icon: "Kanban",
    suggestedInStarterPack: false,
    isFree: false,
    fields: [
      { key: "partner1Name", label: "Partner 1 Name", type: "text" },
      { key: "partner2Name", label: "Partner 2 Name", type: "text" },
      {
        key: "tasks",
        label: "Tasks",
        type: "array",
        arrayItemSchema: [
          { key: "title", label: "Task", type: "text", required: true },
          { key: "assignee", label: "Assignee", type: "select", options: ["partner1", "partner2", "both", "unassigned"] },
          { key: "status", label: "Status", type: "select", options: ["todo", "in-progress", "done"] },
          { key: "color", label: "Color", type: "select", options: ["yellow", "pink", "blue", "green", "purple"] },
          { key: "dueDate", label: "Due Date", type: "date" },
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

  // Registry & Gifts
  {
    id: "registry-tracker",
    name: "Registry Tracker",
    description: "Track gifts across all your registries",
    category: "planning",
    timelineFilters: ["12-months", "9-months", "6-months", "3-months", "1-month"],
    icon: "Gift",
    isFree: false,
    fields: [
      {
        key: "registries",
        label: "Registries",
        type: "array",
        arrayItemSchema: [
          { key: "store", label: "Store", type: "text", required: true },
          { key: "url", label: "Registry URL", type: "text" },
        ],
      },
      {
        key: "items",
        label: "Registry Items",
        type: "array",
        arrayItemSchema: [
          { key: "item", label: "Item", type: "text", required: true },
          { key: "store", label: "Store", type: "text" },
          { key: "price", label: "Price", type: "number" },
          { key: "quantity", label: "Qty Wanted", type: "number" },
          { key: "received", label: "Qty Received", type: "number" },
          { key: "priority", label: "Priority", type: "select", options: ["High", "Medium", "Low"] },
        ],
      },
    ],
  },
  {
    id: "gift-log",
    name: "Gift Log",
    description: "Track gifts received and thank-you notes",
    category: "planning",
    timelineFilters: ["3-months", "1-month", "week-of"],
    icon: "Package",
    isFree: false,
    fields: [
      {
        key: "gifts",
        label: "Gifts",
        type: "array",
        arrayItemSchema: [
          { key: "from", label: "From", type: "text", required: true },
          { key: "item", label: "Gift", type: "text", required: true },
          { key: "event", label: "Event", type: "select", options: ["Wedding", "Bridal Shower", "Engagement Party", "Other"] },
          { key: "dateReceived", label: "Date Received", type: "date" },
          { key: "thankYouSent", label: "Thank You Sent", type: "checkbox" },
          { key: "notes", label: "Notes", type: "text" },
        ],
      },
    ],
  },

  // Honeymoon
  {
    id: "honeymoon-planner",
    name: "Honeymoon Planner",
    description: "Plan your perfect getaway",
    category: "extras",
    timelineFilters: ["6-months", "3-months", "1-month", "week-of"],
    icon: "Plane",
    isFree: false,
    fields: [
      { key: "destination", label: "Destination", type: "text" },
      { key: "departureDate", label: "Departure Date", type: "date" },
      { key: "returnDate", label: "Return Date", type: "date" },
      { key: "budget", label: "Budget", type: "number" },
      {
        key: "flights",
        label: "Flights",
        type: "array",
        arrayItemSchema: [
          { key: "airline", label: "Airline", type: "text" },
          { key: "flightNumber", label: "Flight #", type: "text" },
          { key: "departure", label: "Departure", type: "text" },
          { key: "arrival", label: "Arrival", type: "text" },
          { key: "date", label: "Date", type: "date" },
          { key: "confirmationCode", label: "Confirmation", type: "text" },
        ],
      },
      {
        key: "accommodations",
        label: "Accommodations",
        type: "array",
        arrayItemSchema: [
          { key: "name", label: "Hotel/Resort", type: "text", required: true },
          { key: "checkIn", label: "Check In", type: "date" },
          { key: "checkOut", label: "Check Out", type: "date" },
          { key: "confirmationCode", label: "Confirmation", type: "text" },
          { key: "address", label: "Address", type: "text" },
        ],
      },
      {
        key: "activities",
        label: "Activities & Reservations",
        type: "array",
        arrayItemSchema: [
          { key: "activity", label: "Activity", type: "text", required: true },
          { key: "date", label: "Date", type: "date" },
          { key: "time", label: "Time", type: "text" },
          { key: "confirmationCode", label: "Confirmation", type: "text" },
          { key: "notes", label: "Notes", type: "text" },
        ],
      },
      {
        key: "packingList",
        label: "Packing List",
        type: "array",
        arrayItemSchema: [
          { key: "item", label: "Item", type: "text", required: true },
          { key: "packed", label: "Packed", type: "checkbox" },
        ],
      },
      {
        key: "documents",
        label: "Travel Documents",
        type: "array",
        arrayItemSchema: [
          { key: "document", label: "Document", type: "text", required: true },
          { key: "status", label: "Status", type: "select", options: ["Have it", "Need to get", "Applied", "Expired"] },
          { key: "expirationDate", label: "Expiration", type: "date" },
        ],
      },
      { key: "notes", label: "Notes", type: "textarea" },
    ],
  },

  // Music
  {
    id: "music-playlist",
    name: "Music & Playlist",
    description: "Plan all the music for your wedding",
    category: "day-of",
    timelineFilters: ["3-months", "1-month", "week-of"],
    icon: "Music",
    isFree: false,
    fields: [
      // Special moments
      { key: "firstDanceSong", label: "First Dance", type: "text" },
      { key: "firstDanceArtist", label: "First Dance Artist", type: "text" },
      { key: "parentDance1Song", label: "Parent Dance 1", type: "text" },
      { key: "parentDance1Artist", label: "Parent Dance 1 Artist", type: "text" },
      { key: "parentDance2Song", label: "Parent Dance 2", type: "text" },
      { key: "parentDance2Artist", label: "Parent Dance 2 Artist", type: "text" },
      { key: "cakeCuttingSong", label: "Cake Cutting", type: "text" },
      { key: "lastDanceSong", label: "Last Dance", type: "text" },
      // Ceremony music
      { key: "guestArrivalMusic", label: "Guest Arrival", type: "text" },
      { key: "processionalSong", label: "Processional", type: "text" },
      { key: "brideEntranceSong", label: "Bride Entrance", type: "text" },
      { key: "recessionalSong", label: "Recessional", type: "text" },
      // Playlists
      {
        key: "mustPlaySongs",
        label: "Must Play",
        type: "array",
        arrayItemSchema: [
          { key: "song", label: "Song", type: "text", required: true },
          { key: "artist", label: "Artist", type: "text" },
          { key: "notes", label: "Notes", type: "text" },
        ],
      },
      {
        key: "doNotPlaySongs",
        label: "Do Not Play",
        type: "array",
        arrayItemSchema: [
          { key: "song", label: "Song", type: "text", required: true },
          { key: "artist", label: "Artist", type: "text" },
          { key: "reason", label: "Reason", type: "text" },
        ],
      },
      { key: "djNotes", label: "Notes for DJ/Band", type: "textarea" },
    ],
  },

  // Ceremony
  {
    id: "ceremony-script",
    name: "Ceremony Script",
    description: "Build and customize your ceremony",
    category: "day-of",
    timelineFilters: ["3-months", "1-month", "week-of"],
    icon: "ScrollText",
    isFree: false,
    fields: [
      { key: "officiantName", label: "Officiant Name", type: "text" },
      { key: "ceremonyStyle", label: "Ceremony Style", type: "select", options: ["Traditional", "Modern", "Religious", "Non-denominational", "Spiritual", "Elopement"] },
      { key: "estimatedLength", label: "Estimated Length", type: "select", options: ["15 minutes", "20 minutes", "30 minutes", "45 minutes", "1 hour"] },
      // Ceremony elements
      {
        key: "elements",
        label: "Ceremony Elements",
        type: "array",
        arrayItemSchema: [
          { key: "element", label: "Element", type: "select", required: true, options: [
            "Welcome & Opening",
            "Reading",
            "Musical Performance",
            "Vows - Partner 1",
            "Vows - Partner 2",
            "Ring Exchange",
            "Unity Candle",
            "Sand Ceremony",
            "Handfasting",
            "Wine Ceremony",
            "Ring Warming",
            "Rose Ceremony",
            "Pronouncement",
            "First Kiss",
            "Closing & Introduction",
            "Other",
          ]},
          { key: "person", label: "Person", type: "text" },
          { key: "content", label: "Content/Notes", type: "text" },
          { key: "duration", label: "Duration", type: "text" },
        ],
      },
      // Vows
      { key: "partner1Vows", label: "Partner 1 Vows", type: "textarea" },
      { key: "partner2Vows", label: "Partner 2 Vows", type: "textarea" },
      // Readings
      {
        key: "readings",
        label: "Readings",
        type: "array",
        arrayItemSchema: [
          { key: "title", label: "Title", type: "text", required: true },
          { key: "author", label: "Author", type: "text" },
          { key: "reader", label: "Reader", type: "text" },
          { key: "text", label: "Full Text", type: "textarea" },
        ],
      },
      { key: "officiantScript", label: "Officiant Script", type: "textarea" },
      { key: "notes", label: "Additional Notes", type: "textarea" },
    ],
  },
];

// ============================================================================
// CLIENT-SAFE HELPERS (no database access)
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
