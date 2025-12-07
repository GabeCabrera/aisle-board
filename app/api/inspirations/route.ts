import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants, planners, pages, rsvpResponses } from "@/lib/db/schema";
import { count, eq, sql, avg } from "drizzle-orm";
import { getTenantById, getPlannerByTenantId, getPagesByPlannerId } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

// ============================================================================
// TYPES
// ============================================================================

interface CommunityInsight {
  type: "stat" | "trend" | "tip";
  icon: string;
  title: string;
  description: string;
  source: "community"; // Data from all Aisle users
}

interface PersonalizedNudge {
  type: "action" | "milestone" | "reminder";
  icon: string;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
  priority: "high" | "medium" | "low";
}

interface SeasonalIdea {
  month: number;
  theme: string;
  ideas: string[];
  colorPalette: string[];
}

interface MoodBoard {
  id: string;
  name: string;
  description: string;
  colors: string[];
  keywords: string[];
  imageUrl?: string; // For future use with actual images
}

// ============================================================================
// STATIC DATA - Curated Content
// ============================================================================

const MOOD_BOARDS: MoodBoard[] = [
  {
    id: "garden-romance",
    name: "Garden Romance",
    description: "Soft florals, flowing fabrics, and natural greenery",
    colors: ["#E8D5D5", "#9CAF88", "#F5F0E8", "#D4A5A5", "#7D8471"],
    keywords: ["outdoor", "florals", "organic", "romantic", "soft"],
  },
  {
    id: "modern-minimalist",
    name: "Modern Minimalist",
    description: "Clean lines, neutral palette, architectural elements",
    colors: ["#FFFFFF", "#1A1A1A", "#E5E5E5", "#C9B99A", "#4A4A4A"],
    keywords: ["sleek", "simple", "contemporary", "elegant", "refined"],
  },
  {
    id: "rustic-elegance",
    name: "Rustic Elegance",
    description: "Warm woods, candlelight, and vintage touches",
    colors: ["#8B7355", "#F5E6D3", "#6B4423", "#D4C4B0", "#2F2F2F"],
    keywords: ["barn", "farmhouse", "cozy", "warm", "natural"],
  },
  {
    id: "coastal-breeze",
    name: "Coastal Breeze",
    description: "Ocean blues, sandy neutrals, and breezy vibes",
    colors: ["#87CEEB", "#F5F5DC", "#4682B4", "#FFFFFF", "#D4AF37"],
    keywords: ["beach", "nautical", "relaxed", "seaside", "fresh"],
  },
  {
    id: "bohemian-dream",
    name: "Bohemian Dream",
    description: "Rich textures, eclectic patterns, and free-spirited charm",
    colors: ["#CD853F", "#8B4513", "#DEB887", "#F4A460", "#2E8B57"],
    keywords: ["boho", "eclectic", "artistic", "colorful", "whimsical"],
  },
  {
    id: "classic-timeless",
    name: "Classic Timeless",
    description: "Traditional elegance with black, white, and gold accents",
    colors: ["#FFFFFF", "#000000", "#D4AF37", "#F5F5F5", "#333333"],
    keywords: ["traditional", "formal", "elegant", "sophisticated", "timeless"],
  },
  {
    id: "moody-romantic",
    name: "Moody Romantic",
    description: "Deep jewel tones, candlelit ambiance, and drama",
    colors: ["#4A0E0E", "#2C1810", "#8B0000", "#D4AF37", "#1A1A1A"],
    keywords: ["dramatic", "dark", "luxurious", "intimate", "bold"],
  },
  {
    id: "whimsical-garden",
    name: "Whimsical Garden",
    description: "Fairytale vibes with pastels and enchanted details",
    colors: ["#FFB6C1", "#E6E6FA", "#98FB98", "#FFDAB9", "#DDA0DD"],
    keywords: ["fairytale", "playful", "pastel", "magical", "dreamy"],
  },
];

const SEASONAL_IDEAS: SeasonalIdea[] = [
  {
    month: 1, // January
    theme: "Winter Wonderland",
    ideas: ["Velvet textures", "Candlelit ceremonies", "Hot cocoa bars", "Faux fur wraps"],
    colorPalette: ["#FFFFFF", "#C0C0C0", "#000080", "#8B0000"],
  },
  {
    month: 2, // February
    theme: "Valentine Romance",
    ideas: ["Heart-shaped details", "Rose petal aisles", "Romantic lighting", "Love letter guest books"],
    colorPalette: ["#FF69B4", "#DC143C", "#FFB6C1", "#FFFFFF"],
  },
  {
    month: 3, // March
    theme: "Early Spring",
    ideas: ["Cherry blossoms", "Pastel linens", "Bird nest decor", "Garden-inspired menus"],
    colorPalette: ["#FFB7C5", "#98FB98", "#E6E6FA", "#FFFACD"],
  },
  {
    month: 4, // April
    theme: "Spring Showers",
    ideas: ["Umbrella decor", "Rain boot planters", "Fresh tulips", "Outdoor tents"],
    colorPalette: ["#87CEEB", "#FFFF00", "#98FB98", "#DDA0DD"],
  },
  {
    month: 5, // May
    theme: "Garden Party",
    ideas: ["Peonies everywhere", "Outdoor ceremonies", "Tea party receptions", "Floral arches"],
    colorPalette: ["#FFB6C1", "#98FB98", "#FFFFFF", "#DEB887"],
  },
  {
    month: 6, // June
    theme: "Summer Solstice",
    ideas: ["Sunset ceremonies", "Citrus accents", "Lawn games", "Light & airy fabrics"],
    colorPalette: ["#FFD700", "#FF6347", "#87CEEB", "#FFFFFF"],
  },
  {
    month: 7, // July
    theme: "Tropical Paradise",
    ideas: ["Palm leaf prints", "Tropical flowers", "Outdoor bars", "Bright colors"],
    colorPalette: ["#FF6B6B", "#4ECDC4", "#FFE66D", "#2ECC71"],
  },
  {
    month: 8, // August
    theme: "Late Summer Harvest",
    ideas: ["Sunflower arrangements", "Farm tables", "Fruit centerpieces", "Lemonade stations"],
    colorPalette: ["#FFD700", "#FF8C00", "#8B4513", "#228B22"],
  },
  {
    month: 9, // September
    theme: "Early Autumn",
    ideas: ["Burgundy accents", "Apple cider bars", "Harvest decor", "Transitional florals"],
    colorPalette: ["#8B0000", "#FF8C00", "#DAA520", "#2F4F4F"],
  },
  {
    month: 10, // October
    theme: "Fall Foliage",
    ideas: ["Pumpkin decor", "Cozy blankets", "Warm lighting", "Spiced cocktails"],
    colorPalette: ["#FF4500", "#8B4513", "#FFD700", "#2F4F4F"],
  },
  {
    month: 11, // November
    theme: "Grateful Gathering",
    ideas: ["Family-style dining", "Thankfulness themes", "Autumn leaves", "Warm metallics"],
    colorPalette: ["#8B4513", "#DAA520", "#800000", "#F5DEB3"],
  },
  {
    month: 12, // December
    theme: "Holiday Magic",
    ideas: ["Evergreen garlands", "Twinkling lights", "Velvet ribbons", "Champagne toasts"],
    colorPalette: ["#006400", "#8B0000", "#FFD700", "#FFFFFF"],
  },
];

const CURATED_RESOURCES = [
  {
    title: "Pinterest Wedding Ideas",
    description: "Endless visual inspiration for every wedding style",
    url: "https://www.pinterest.com/search/pins/?q=wedding%20ideas",
    category: "inspiration",
  },
  {
    title: "A Practical Wedding",
    description: "Real talk about wedding planning without the fluff",
    url: "https://apracticalwedding.com",
    category: "advice",
  },
  {
    title: "Green Wedding Shoes",
    description: "Unique and creative wedding inspiration",
    url: "https://greenweddingshoes.com",
    category: "inspiration",
  },
  {
    title: "Zola",
    description: "Registry and wedding website tools",
    url: "https://www.zola.com",
    category: "registry",
  },
];

const QUICK_PROMPTS = [
  "What's your signature cocktail going to be?",
  "Have you thought about your processional song?",
  "What childhood photos do you want displayed?",
  "Have you considered a first look?",
  "What's your something borrowed?",
  "Who's giving the toasts?",
  "What's your exit strategy? Sparklers? Bubbles?",
  "Have you planned your honeymoon departure outfit?",
  "What scent do you want people to remember?",
  "Have you written your vows yet?",
  "What's your backup rain plan?",
  "Who's in charge of the rings on the day?",
  "Have you thought about a day-after brunch?",
  "What's your last dance song?",
  "Do you have a getting-ready playlist?",
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getRandomItems<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getDaysUntilWedding(weddingDate: Date | null): number | null {
  if (!weddingDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const wedding = new Date(weddingDate);
  wedding.setHours(0, 0, 0, 0);
  return Math.ceil((wedding.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function getTimelinePhase(daysUntil: number | null): string {
  if (daysUntil === null) return "planning";
  if (daysUntil > 365) return "early";
  if (daysUntil > 180) return "mid";
  if (daysUntil > 90) return "crunch";
  if (daysUntil > 30) return "final";
  if (daysUntil > 0) return "week-of";
  return "post";
}

// ============================================================================
// MAIN API HANDLER
// ============================================================================

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user's data
    const tenant = await getTenantById(session.user.tenantId);
    if (!tenant) {
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    const planner = await getPlannerByTenantId(tenant.id);
    const userPages = planner ? await getPagesByPlannerId(planner.id) : [];

    // Calculate user-specific metrics
    const daysUntil = getDaysUntilWedding(tenant.weddingDate);
    const phase = getTimelinePhase(daysUntil);
    const templateIds = userPages.map(p => p.templateId);

    // ========================================================================
    // COMMUNITY INSIGHTS (Aggregated from all users - anonymized)
    // ========================================================================
    
    const communityInsights: CommunityInsight[] = [];

    // Average guest count across all weddings
    const allGuestPages = await db
      .select({ fields: pages.fields })
      .from(pages)
      .where(eq(pages.templateId, "guest-list"));

    let totalGuests = 0;
    let weddingsWithGuests = 0;
    for (const page of allGuestPages) {
      const fields = page.fields as Record<string, unknown>;
      const guests = Array.isArray(fields?.guests) ? fields.guests : [];
      if (guests.length > 0) {
        totalGuests += guests.length;
        weddingsWithGuests++;
      }
    }
    const avgGuests = weddingsWithGuests > 0 ? Math.round(totalGuests / weddingsWithGuests) : 0;

    if (avgGuests > 0) {
      communityInsights.push({
        type: "stat",
        icon: "Users",
        title: `${avgGuests} guests on average`,
        description: "The average wedding on Aisle has this many guests",
        source: "community",
      });
    }

    // Most popular budget categories
    const allBudgetPages = await db
      .select({ fields: pages.fields })
      .from(pages)
      .where(eq(pages.templateId, "budget"));

    const categoryCount: Record<string, number> = {};
    for (const page of allBudgetPages) {
      const fields = page.fields as Record<string, unknown>;
      const items = Array.isArray(fields?.items) ? fields.items : [];
      for (const item of items) {
        const cat = (item as Record<string, unknown>)?.category as string;
        if (cat) {
          categoryCount[cat] = (categoryCount[cat] || 0) + 1;
        }
      }
    }

    const topCategories = Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([cat]) => cat);

    if (topCategories.length > 0) {
      communityInsights.push({
        type: "trend",
        icon: "TrendingUp",
        title: `Top spending: ${topCategories[0]}`,
        description: `Most couples prioritize ${topCategories.slice(0, 2).join(" and ").toLowerCase()}`,
        source: "community",
      });
    }

    // Average budget (if we have data)
    let totalBudget = 0;
    let budgetCount = 0;
    for (const page of allBudgetPages) {
      const fields = page.fields as Record<string, unknown>;
      const budget = parseFloat(String(fields?.totalBudget || 0));
      if (budget > 0) {
        totalBudget += budget;
        budgetCount++;
      }
    }
    const avgBudget = budgetCount > 0 ? Math.round(totalBudget / budgetCount) : 0;

    if (avgBudget > 0) {
      communityInsights.push({
        type: "stat",
        icon: "DollarSign",
        title: `$${avgBudget.toLocaleString()} average budget`,
        description: "What couples on Aisle typically plan to spend",
        source: "community",
      });
    }

    // RSVP response rate
    const [totalRsvpForms] = await db
      .select({ count: count() })
      .from(pages)
      .where(eq(pages.templateId, "guest-list"));

    const [totalResponses] = await db
      .select({ count: count() })
      .from(rsvpResponses);

    if ((totalResponses?.count || 0) > 10) {
      communityInsights.push({
        type: "tip",
        icon: "Mail",
        title: "RSVP tip",
        description: "Couples who send reminders get 30% more responses",
        source: "community",
      });
    }

    // ========================================================================
    // PERSONALIZED NUDGES
    // ========================================================================

    const nudges: PersonalizedNudge[] = [];

    // Get user's page data for personalization
    const guestPage = userPages.find(p => p.templateId === "guest-list");
    const budgetPage = userPages.find(p => p.templateId === "budget");
    const schedulePage = userPages.find(p => p.templateId === "day-of-schedule");
    const seatingPage = userPages.find(p => p.templateId === "seating-chart");

    const guestFields = (guestPage?.fields || {}) as Record<string, unknown>;
    const guests = Array.isArray(guestFields?.guests) ? guestFields.guests : [];
    const confirmedGuests = guests.filter((g: Record<string, unknown>) => g?.rsvp === true).length;

    const budgetFields = (budgetPage?.fields || {}) as Record<string, unknown>;
    const budgetItems = Array.isArray(budgetFields?.items) ? budgetFields.items : [];

    // Timeline-based nudges
    if (daysUntil !== null) {
      if (daysUntil <= 30 && !templateIds.includes("day-of-schedule")) {
        nudges.push({
          type: "action",
          icon: "Clock",
          title: "Create your day-of schedule",
          description: `Only ${daysUntil} days to go! Time to map out the big day.`,
          action: { label: "Add Schedule", href: "/templates" },
          priority: "high",
        });
      }

      if (daysUntil <= 60 && confirmedGuests > 20 && !templateIds.includes("seating-chart")) {
        nudges.push({
          type: "action",
          icon: "LayoutGrid",
          title: "Start your seating chart",
          description: `You have ${confirmedGuests} confirmed guests - time to figure out who sits where!`,
          action: { label: "Add Seating Chart", href: "/templates" },
          priority: "high",
        });
      }

      if (daysUntil <= 90 && daysUntil > 60) {
        nudges.push({
          type: "reminder",
          icon: "Calendar",
          title: "3 months to go!",
          description: "Now's the time to finalize vendors and send invitations.",
          priority: "medium",
        });
      }

      if (daysUntil <= 7) {
        nudges.push({
          type: "milestone",
          icon: "Heart",
          title: "It's almost here!",
          description: "Take a deep breath. You've got this. 💕",
          priority: "high",
        });
      }
    }

    // Data-based nudges
    if (guests.length > 0 && confirmedGuests === 0) {
      nudges.push({
        type: "action",
        icon: "Send",
        title: "Send your RSVP link",
        description: `You have ${guests.length} guests but no RSVPs yet. Share your link!`,
        action: { label: "Open Guest List", href: "/planner" },
        priority: "medium",
      });
    }

    if (budgetItems.length === 0 && templateIds.includes("budget")) {
      nudges.push({
        type: "action",
        icon: "DollarSign",
        title: "Add your first vendor",
        description: "Start tracking your expenses to stay on budget.",
        action: { label: "Open Budget", href: "/planner" },
        priority: "low",
      });
    }

    // Completion nudge
    if (userPages.length < 3) {
      nudges.push({
        type: "action",
        icon: "Plus",
        title: "Add more pages",
        description: "Most couples use 5-8 templates to plan their wedding.",
        action: { label: "Browse Templates", href: "/templates" },
        priority: "low",
      });
    }

    // ========================================================================
    // SEASONAL CONTENT
    // ========================================================================

    const currentMonth = new Date().getMonth() + 1;
    const seasonalIdea = SEASONAL_IDEAS.find(s => s.month === currentMonth) || SEASONAL_IDEAS[0];

    // Wedding month ideas (if we know their date)
    let weddingMonthIdea: SeasonalIdea | null = null;
    if (tenant.weddingDate) {
      const weddingMonth = new Date(tenant.weddingDate).getMonth() + 1;
      weddingMonthIdea = SEASONAL_IDEAS.find(s => s.month === weddingMonth) || null;
    }

    // ========================================================================
    // RESPONSE
    // ========================================================================

    return NextResponse.json({
      // User context
      displayName: tenant.displayName,
      daysUntil,
      phase,
      weddingDate: tenant.weddingDate,

      // Mood boards (random selection)
      moodBoards: getRandomItems(MOOD_BOARDS, 4),

      // Quick prompts (random selection)
      quickPrompts: getRandomItems(QUICK_PROMPTS, 3),

      // Community insights
      communityInsights: getRandomItems(communityInsights, 3),

      // Personalized nudges (sorted by priority)
      nudges: nudges
        .sort((a, b) => {
          const priority = { high: 0, medium: 1, low: 2 };
          return priority[a.priority] - priority[b.priority];
        })
        .slice(0, 3),

      // Seasonal content
      seasonal: {
        current: seasonalIdea,
        weddingMonth: weddingMonthIdea,
      },

      // Curated resources
      resources: getRandomItems(CURATED_RESOURCES, 3),
    });
  } catch (error) {
    console.error("Inspirations API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inspirations" },
      { status: 500 }
    );
  }
}
