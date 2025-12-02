import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { 
  conciergeConversations, 
  vibeProfiles, 
  tenants, 
  pages, 
  planners 
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================
// SYSTEM PROMPT - The soul of the AI concierge
// ============================================================================

function buildSystemPrompt(context: {
  coupleNames: string;
  weddingDate: string | null;
  daysUntil: number | null;
  guestCount: number;
  budget: number;
  vibeProfile: {
    keywords: string[];
    colorPalette: string[];
    aestheticStyle: string | null;
    description: string | null;
  } | null;
  bookedVendors: string[];
  location: string | null;
}) {
  const { coupleNames, weddingDate, daysUntil, guestCount, budget, vibeProfile, bookedVendors, location } = context;

  return `You are the AIsle wedding concierge — a warm, knowledgeable, and genuinely helpful wedding planning assistant. You're like a best friend who happens to be an expert wedding planner.

## Your Personality
- Warm and conversational, never robotic or formal
- Genuinely excited about their wedding without being over-the-top
- Calm and reassuring when they're stressed
- Opinionated when asked (you have good taste!) but never pushy
- You use their names naturally in conversation
- You remember details they've shared and reference them

## About This Couple
- Names: ${coupleNames || "Not yet shared"}
- Wedding Date: ${weddingDate ? new Date(weddingDate).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Not yet set"}
${daysUntil !== null ? `- Days until wedding: ${daysUntil}` : ""}
- Guest count: ${guestCount > 0 ? guestCount : "Not yet determined"}
- Budget: ${budget > 0 ? `$${budget.toLocaleString()}` : "Not yet set"}
- Location: ${location || "Not yet decided"}

## Their Vibe
${vibeProfile ? `
- Style: ${vibeProfile.aestheticStyle || "Still discovering"}
- Keywords: ${vibeProfile.keywords.length > 0 ? vibeProfile.keywords.join(", ") : "Not yet defined"}
- Colors: ${vibeProfile.colorPalette.length > 0 ? vibeProfile.colorPalette.join(", ") : "Not yet chosen"}
${vibeProfile.description ? `- Description: ${vibeProfile.description}` : ""}
` : "Still getting to know their style — help them discover it!"}

## Vendors Booked
${bookedVendors.length > 0 ? bookedVendors.map(v => `- ${v}`).join("\n") : "None yet"}

## Your Capabilities
1. **Vibe Discovery** — Help them articulate their wedding aesthetic through questions and conversation. When they describe something, reflect it back and help crystallize it.

2. **Planning Guidance** — Answer questions about timelines, etiquette, traditions, and logistics. Be practical and specific.

3. **Vendor Recommendations** — When they're looking for vendors, understand what they need and (eventually) recommend options that match their vibe. For now, help them think through what to look for.

4. **Budget Advice** — Help them think through budget allocation, where to splurge vs save, and how to get the most from their budget.

5. **Emotional Support** — Wedding planning is stressful. Be a calming presence. Validate their feelings. Help them remember why they're doing this.

## Vibe Discovery Mode
When a conversation feels like they're exploring their style, gently ask questions like:
- "When you picture the moment you walk in, what do you see?"
- "Are you drawn more to candlelit and intimate, or bright and airy?"
- "If your wedding were a movie, what would it look like?"
- "Is there a color that feels like 'your wedding'?"

When they share Pinterest boards or describe inspiration, identify patterns and reflect them back: "It sounds like you're drawn to romantic, moody aesthetics with lots of texture and warm lighting. Does that resonate?"

## Important Guidelines
- Keep responses concise unless they ask for detail. This is a chat, not an essay.
- Ask one question at a time, not a barrage.
- If they seem overwhelmed, acknowledge it and help them focus on just one thing.
- Celebrate their wins, even small ones ("You booked the venue! That's huge!")
- Never be preachy or lecture them.
- If you don't know something specific (like a vendor's availability), say so honestly.
- You're based in Utah and especially knowledgeable about the Utah County / Provo / Salt Lake area wedding scene.

## Conversation Style
- Use natural, warm language
- Okay to use light emoji occasionally (💕 ✨) but don't overdo it
- Short paragraphs, easy to read on mobile
- Feel free to be a little playful

Remember: You're not just answering questions. You're helping them feel excited and capable of planning the wedding of their dreams. Every interaction should leave them feeling better than before.`;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

async function getWeddingContext(tenantId: string) {
  // Get tenant info
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, tenantId));

  if (!tenant) return null;

  // Get vibe profile
  const [vibe] = await db
    .select()
    .from(vibeProfiles)
    .where(eq(vibeProfiles.tenantId, tenantId));

  // Get planner pages for context
  const [planner] = await db
    .select()
    .from(planners)
    .where(eq(planners.tenantId, tenantId));

  let guestCount = 0;
  let budget = 0;
  let bookedVendors: string[] = [];

  if (planner) {
    const allPages = await db
      .select()
      .from(pages)
      .where(eq(pages.plannerId, planner.id));

    // Extract guest count
    const guestPage = allPages.find(p => p.templateId === "guest-list");
    if (guestPage) {
      const fields = guestPage.fields as Record<string, unknown>;
      const guests = Array.isArray(fields?.guests) ? fields.guests : [];
      guestCount = guests.length;
    }

    // Extract budget
    const budgetPage = allPages.find(p => p.templateId === "budget");
    if (budgetPage) {
      const fields = budgetPage.fields as Record<string, unknown>;
      budget = Number(fields?.totalBudget) || 0;
      
      // Extract booked vendors
      const items = Array.isArray(fields?.items) ? fields.items : [];
      bookedVendors = items
        .filter((item: Record<string, unknown>) => item?.name && item?.category)
        .map((item: Record<string, unknown>) => `${item.category}: ${item.name}`);
    }
  }

  // Calculate days until
  let daysUntil: number | null = null;
  if (tenant.weddingDate) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const wedding = new Date(tenant.weddingDate);
    wedding.setHours(0, 0, 0, 0);
    daysUntil = Math.ceil((wedding.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  return {
    coupleNames: tenant.displayName || "",
    weddingDate: tenant.weddingDate?.toISOString() || null,
    daysUntil,
    guestCount,
    budget,
    vibeProfile: vibe ? {
      keywords: (vibe.keywords as string[]) || [],
      colorPalette: (vibe.colorPalette as string[]) || [],
      aestheticStyle: vibe.aestheticStyle,
      description: vibe.description,
    } : null,
    bookedVendors,
    location: null, // TODO: Add location to tenant or vibe profile
  };
}

async function getOrCreateConversation(tenantId: string) {
  // Try to get active conversation
  const [existing] = await db
    .select()
    .from(conciergeConversations)
    .where(
      and(
        eq(conciergeConversations.tenantId, tenantId),
        eq(conciergeConversations.isActive, true)
      )
    )
    .orderBy(desc(conciergeConversations.updatedAt))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Create new conversation
  const [newConvo] = await db
    .insert(conciergeConversations)
    .values({
      tenantId,
      messages: [],
      isActive: true,
    })
    .returning();

  return newConvo;
}

// ============================================================================
// API HANDLERS
// ============================================================================

// GET - Fetch conversation history
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await getOrCreateConversation(session.user.tenantId);
    const context = await getWeddingContext(session.user.tenantId);

    return NextResponse.json({
      conversationId: conversation.id,
      messages: conversation.messages || [],
      context: {
        coupleNames: context?.coupleNames,
        hasVibeProfile: !!context?.vibeProfile?.aestheticStyle,
      },
    });
  } catch (error) {
    console.error("Get conversation error:", error);
    return NextResponse.json(
      { error: "Failed to get conversation" },
      { status: 500 }
    );
  }
}

// POST - Send a message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Get conversation and context
    const conversation = await getOrCreateConversation(session.user.tenantId);
    const context = await getWeddingContext(session.user.tenantId);

    if (!context) {
      return NextResponse.json(
        { error: "Could not load wedding context" },
        { status: 500 }
      );
    }

    // Build messages for Claude
    const existingMessages = (conversation.messages as Message[]) || [];
    const claudeMessages = [
      ...existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: buildSystemPrompt(context),
      messages: claudeMessages,
    });

    const assistantMessage = response.content[0].type === "text" 
      ? response.content[0].text 
      : "";

    // Update conversation with new messages
    const updatedMessages: Message[] = [
      ...existingMessages,
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: assistantMessage, timestamp: new Date().toISOString() },
    ];

    await db
      .update(conciergeConversations)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      })
      .where(eq(conciergeConversations.id, conversation.id));

    return NextResponse.json({
      message: assistantMessage,
      conversationId: conversation.id,
    });
  } catch (error) {
    console.error("Concierge error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}

// DELETE - Clear conversation history
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Mark current conversation as inactive
    await db
      .update(conciergeConversations)
      .set({ isActive: false })
      .where(
        and(
          eq(conciergeConversations.tenantId, session.user.tenantId),
          eq(conciergeConversations.isActive, true)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Clear conversation error:", error);
    return NextResponse.json(
      { error: "Failed to clear conversation" },
      { status: 500 }
    );
  }
}
