"use client";

import { isSharedField } from "@/lib/state";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Field label component with shared field indicator
export function FieldLabel({ label, fieldKey }: { label: string; fieldKey: string }) {
  const isShared = isSharedField(fieldKey);

  return (
    <div className="flex items-center gap-2 mb-2">
      <Label>{label}</Label>
      {isShared && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center">
                <LinkIcon className="w-3 h-3 text-warm-400" />
              </span>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="text-xs">Synced across all pages</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// ============================================================================
// UPGRADE PROMPT COMPONENT
// ============================================================================

interface UpgradePromptProps {
  title: string;
  description: string;
  featureName: string;
  icon?: React.ReactNode;
  variant?: "inline" | "card" | "banner";
}

export function UpgradePrompt({ 
  title, 
  description, 
  featureName,
  icon,
  variant = "card" 
}: UpgradePromptProps) {
  if (variant === "inline") {
    return (
      <Link 
        href="/settings?tab=plan"
        className="inline-flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 transition-colors group"
      >
        <Sparkles className="w-4 h-4" />
        <span>{title}</span>
        <ArrowRight className="w-3 h-3 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
      </Link>
    );
  }

  if (variant === "banner") {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              {icon || <Sparkles className="w-5 h-5 text-purple-600" />}
            </div>
            <div>
              <p className="font-medium text-purple-900">{title}</p>
              <p className="text-sm text-purple-600">{description}</p>
            </div>
          </div>
          <Link 
            href="/settings?tab=plan"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap"
          >
            Upgrade
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Default card variant
  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-100 rounded-lg p-6 text-center">
      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {icon || <Sparkles className="w-6 h-6 text-purple-600" />}
      </div>
      <h3 className="font-medium text-purple-900 mb-2">{title}</h3>
      <p className="text-sm text-purple-600 mb-4 max-w-xs mx-auto">{description}</p>
      <Link 
        href="/settings?tab=plan"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Upgrade to Complete
        <ArrowRight className="w-4 h-4" />
      </Link>
      <p className="text-xs text-purple-400 mt-3">
        One-time payment • Lifetime access
      </p>
    </div>
  );
}

// Contextual upgrade suggestions for specific features
export const UPGRADE_SUGGESTIONS = {
  seatingChart: {
    title: "Visual Seating Chart",
    description: "Drag and drop guests to tables with our interactive seating chart.",
    featureName: "Seating Chart",
  },
  vendorContacts: {
    title: "Vendor Contact Manager",
    description: "Keep all your vendor info, contracts, and payments in one place.",
    featureName: "Vendor Contacts",
  },
  weddingParty: {
    title: "Wedding Party Manager",
    description: "Organize your bridesmaids, groomsmen, and assign responsibilities.",
    featureName: "Wedding Party",
  },
  overview: {
    title: "Wedding Dashboard",
    description: "See your entire wedding at a glance with live stats and countdown.",
    featureName: "Wedding Overview",
  },
  taskBoard: {
    title: "Task Board",
    description: "Visual post-it style task management with assignments and due dates.",
    featureName: "Task Board",
  },
  timeline: {
    title: "Planning Timeline",
    description: "Month-by-month checklist to keep you on track.",
    featureName: "Planning Timeline",
  },
  honeymoon: {
    title: "Honeymoon Planner",
    description: "Plan flights, hotels, activities, and packing lists for your getaway.",
    featureName: "Honeymoon Planner",
  },
  music: {
    title: "Music & Playlist",
    description: "Plan your first dance, must-plays, and do-not-plays.",
    featureName: "Music & Playlist",
  },
  ceremony: {
    title: "Ceremony Script Builder",
    description: "Build your ceremony with readings, vows, and special moments.",
    featureName: "Ceremony Script",
  },
  gifts: {
    title: "Gift & Registry Tracker",
    description: "Track gifts received and thank-you notes sent.",
    featureName: "Gift Log",
  },
};

// ============================================================================
// EXISTING EXPORTS
// ============================================================================

// Currency formatter
export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Date formatter
export const formatDate = (dateStr: string) => {
  if (!dateStr) return "Not set";
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// Month names
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

// Days of week
export const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Budget categories
export const BUDGET_CATEGORIES = [
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
];

// RSVP field options
export const RSVP_FIELD_OPTIONS = [
  { key: "name", label: "Name", description: "Guest's full name", required: true },
  { key: "email", label: "Email", description: "Email address" },
  { key: "phone", label: "Phone", description: "Phone number" },
  { key: "address", label: "Address", description: "Mailing address for invitations" },
  { key: "attending", label: "RSVP Status", description: "Will they be attending?" },
  { key: "mealChoice", label: "Meal Choice", description: "Dinner selection (requires meal options)" },
  { key: "dietaryRestrictions", label: "Dietary Restrictions", description: "Allergies or dietary needs" },
  { key: "plusOne", label: "Plus One", description: "Are they bringing a guest?" },
  { key: "plusOneName", label: "Plus One Name", description: "Name of their guest" },
  { key: "plusOneMeal", label: "Plus One Meal", description: "Meal choice for their guest" },
  { key: "songRequest", label: "Song Request", description: "What song gets them dancing?" },
  { key: "notes", label: "Notes", description: "Additional comments or well-wishes" },
];

// Ceremony elements
export const CEREMONY_ELEMENTS = [
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
];

// Suggested tasks by budget category
export const SUGGESTED_TASKS_BY_CATEGORY: Record<string, string[]> = {
  "Venue": [
    "Schedule venue tour",
    "Review and sign venue contract",
    "Confirm venue capacity",
    "Discuss layout and floor plan",
    "Confirm parking arrangements",
  ],
  "Catering": [
    "Schedule tasting appointment",
    "Finalize menu selections",
    "Confirm dietary accommodations",
    "Decide on bar package",
    "Review catering contract",
  ],
  "Photography": [
    "Review photographer portfolio",
    "Create shot list",
    "Schedule engagement photos",
    "Discuss timeline for day-of",
    "Confirm delivery timeline",
  ],
  "Videography": [
    "Review videographer samples",
    "Discuss highlight reel length",
    "Confirm audio requirements",
  ],
  "Florist": [
    "Create flower inspiration board",
    "Schedule floral consultation",
    "Finalize bouquet design",
    "Confirm centerpiece arrangements",
    "Discuss ceremony arch/decor",
  ],
  "Music / DJ": [
    "Create must-play song list",
    "Create do-not-play list",
    "Discuss ceremony music",
    "Plan first dance song",
    "Confirm MC announcements",
  ],
  "Wedding Attire": [
    "Shop for wedding dress/suit",
    "Schedule fittings",
    "Choose accessories",
    "Plan rehearsal dinner outfit",
    "Coordinate wedding party attire",
  ],
  "Hair & Makeup": [
    "Schedule hair/makeup trial",
    "Create inspiration photos",
    "Confirm day-of timeline",
    "Book wedding party appointments",
  ],
  "Invitations & Stationery": [
    "Design save-the-dates",
    "Send save-the-dates",
    "Design wedding invitations",
    "Order invitations",
    "Send invitations",
    "Design programs and menus",
  ],
  "Wedding Cake": [
    "Schedule cake tasting",
    "Choose cake flavor and filling",
    "Finalize cake design",
    "Confirm delivery/setup",
  ],
  "Decorations": [
    "Create decoration mood board",
    "Order table numbers",
    "Plan photo booth props",
    "Order signage",
  ],
  "Transportation": [
    "Book wedding party transportation",
    "Arrange guest shuttle if needed",
    "Plan getaway car",
  ],
  "Officiant": [
    "Meet with officiant",
    "Discuss ceremony structure",
    "Write/finalize vows",
    "Schedule rehearsal",
  ],
  "Wedding Rings": [
    "Shop for wedding bands",
    "Order rings (allow time for sizing)",
    "Pick up rings before wedding",
  ],
  "Favors & Gifts": [
    "Choose wedding favors",
    "Order wedding party gifts",
    "Get parent thank-you gifts",
  ],
  "Honeymoon": [
    "Research honeymoon destinations",
    "Book flights",
    "Book accommodations",
    "Plan activities",
    "Check passport expiration",
  ],
};

// Post-it colors
export const POST_IT_COLORS = {
  yellow: "bg-yellow-100 border-yellow-300 hover:bg-yellow-50",
  pink: "bg-pink-100 border-pink-300 hover:bg-pink-50",
  blue: "bg-blue-100 border-blue-300 hover:bg-blue-50",
  green: "bg-green-100 border-green-300 hover:bg-green-50",
  purple: "bg-purple-100 border-purple-300 hover:bg-purple-50",
};

export const POST_IT_SHADOWS = {
  yellow: "shadow-yellow-200/50",
  pink: "shadow-pink-200/50",
  blue: "shadow-blue-200/50",
  green: "shadow-green-200/50",
  purple: "shadow-purple-200/50",
};
