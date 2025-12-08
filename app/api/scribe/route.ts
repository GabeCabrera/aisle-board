import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import {
  scribeConversations,
  vibeProfiles,
  tenants,
  pages,
  planners
} from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { getTenantAccess, incrementAIUsage, FREE_AI_MESSAGE_LIMIT } from "@/lib/subscription";
import { executeToolCall } from "@/lib/ai/executor"; // Import executeToolCall

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ============================================================================ 
// SYSTEM PROMPTS
// ============================================================================ 

function buildOnboardingSystemPrompt(plannerName: string) {
  return `You are ${plannerName}, a warm and friendly wedding planner. You're meeting a new couple for the first time.

## Your Goal
Get to know them naturally through conversation. You want to learn:
1. Their names (your first question should be asking their names)
2. When they're getting married (or if they haven't set a date)
3. What they're most excited about
4. What feels overwhelming

## Your Personality
- Warm, genuine, excited to meet them
- Like a friend who happens to be great at planning weddings
- Calm and reassuring
- Ask ONE question at a time
- Keep responses short and conversational (2-3 sentences max)
- Use their names once you know them

## Conversation Flow
1. First message from you asked for their names
2. When they share names, respond warmly and naturally, then ask about their wedding date
3. Continue getting to know them naturally

## Important
- Be genuinely interested, not robotic
- Don't ask multiple questions at once
- Celebrate what they share
- If they seem stressed, acknowledge it warmly
- Light emoji use is fine (✨ 💕) but don't overdo it

## Extracting Information
When you learn their names, include this at the END of your response on its own line:
[NAMES: Person1 & Person2]

For example if they say "I'm Sarah and my fiance is Mike", include:
[NAMES: Sarah & Mike]

Only include this tag when you first learn their names, not in subsequent messages.`;
}

function buildSystemPrompt(plannerName: string, context: {
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

  return `You are ${plannerName}, a warm, knowledgeable, and genuinely helpful wedding planning assistant. You're like a best friend who happens to be an expert wedding planner.

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

3. **Vendor Recommendations** — When they're looking for vendors, understand what they need and help them think through what to look for.

4. **Budget Advice** — Help them think through budget allocation, where to splurge vs save, and how to get the most from their budget.

5. **Emotional Support** — Wedding planning is stressful. Be a calming presence. Validate their feelings. Help them remember why they're doing this.

## Vibe Discovery Mode
When a conversation feels like they're exploring their style, gently ask questions like:
- "When you picture the moment you walk in, what do you see?"
- "Are you drawn more to candlelit and intimate, or bright and airy?"
- "If your wedding were a movie, what would it look like?"
- "Is there a color that feels like 'your wedding'?"

When they share Pinterest boards or describe inspiration, identify patterns and reflect them back.

## Important Guidelines
- Keep responses concise unless they ask for detail. This is a chat, not an essay.
- Ask one question at a time, not a barrage.
- If they seem overwhelmed, acknowledge it and help them focus on just one thing.
- Celebrate their wins, even small ones ("You booked the venue! That's huge!")
- Never be preachy or lecture them.
- If you don't know something specific (like a vendor's availability), say so honestly.

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
    location: null,
    plannerName: tenant.plannerName || "Planner",
  };
}

async function getOrCreateConversation(tenantId: string) {
  // Try to get active conversation
  const [existing] = await db
    .select()
    .from(scribeConversations)
    .where(
      and(
        eq(scribeConversations.tenantId, tenantId),
        eq(scribeConversations.isActive, true)
      )
    )
    .orderBy(desc(scribeConversations.updatedAt))
    .limit(1);

  if (existing) {
    return existing;
  }

  // Create new conversation
  const [newConvo] = await db
    .insert(scribeConversations)
    .values({
      tenantId,
      messages: [],
      isActive: true,
    })
    .returning();

  return newConvo;
}

function extractNames(text: string): string | null {
  const match = text.match(/\\\[NAMES:\\s*(.+?)\\\]/);
  if (match) {
    return match[1].trim();
  }
  return null;
}

function stripNameTag(text: string): string {
  return text.replace(/\\n?\\\[NAMES:\\s*.+?\\\]/g, "").trim();
}

// ============================================================================ 
// API HANDLERS
// ============================================================================ 

export const dynamic = "force-dynamic";

// GET - Fetch conversation history and AI access status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const conversation = await getOrCreateConversation(session.user.tenantId);
    const context = await getWeddingContext(session.user.tenantId);
    const access = await getTenantAccess(session.user.tenantId);

    return NextResponse.json({
      conversationId: conversation.id,
      messages: [], // Return empty messages for UI, context is still loaded for AI
      context: {
        coupleNames: context?.coupleNames,
        hasVibeProfile: !!context?.vibeProfile?.aestheticStyle,
        plannerName: context?.plannerName,
      },
      // AI access info
      aiAccess: {
        hasAccess: access?.hasAIAccess ?? false,
        hasFullAccess: access?.hasFullAccess ?? false,
        messagesUsed: access?.aiMessagesUsed ?? 0,
        messagesRemaining: access?.aiMessagesRemaining ?? 0,
        limit: FREE_AI_MESSAGE_LIMIT,
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

    const { message, isOnboarding, plannerName: providedPlannerName } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      );
    }

    // Check AI access before proceeding
    const usageResult = await incrementAIUsage(session.user.tenantId);
    
    if (!usageResult.allowed) {
      return NextResponse.json(
        {
          error: "AI message limit reached",
          limitReached: true,
          messagesUsed: usageResult.newCount,
          limit: FREE_AI_MESSAGE_LIMIT,
        },
        { status: 403 }
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

    const plannerName = providedPlannerName || context.plannerName || "Planner";

    // Build messages for Claude
    const existingMessages = (conversation.messages as Message[]) || [];
    const claudeMessages = [
      ...existingMessages.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      { role: "user" as const, content: message },
    ];

    // Use different system prompt for onboarding
    const systemPrompt = isOnboarding 
      ? buildOnboardingSystemPrompt(plannerName)
      : buildSystemPrompt(plannerName, context);

    // Call Claude
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      messages: claudeMessages,
      tools: [ // Define tools available to Claude
        {
          name: "update_decision",
          description: "Update the status or details of a specific wedding decision on the checklist.",
          input_schema: {
            type: "object",
            properties: {
              decisionName: { type: "string", description: "The internal name of the decision (e.g., 'ceremony_venue', 'photographer', 'guest_count')." },
              status: { type: "string", enum: ["not_started", "researching", "decided", "locked"], description: "The new status of the decision." },
              choiceName: { type: "string", description: "The name of the chosen option (e.g., 'Alpine Arts Center', 'John Smith Photography')." },
              choiceAmount: { type: "number", description: "The monetary amount associated with the choice, in USD." },
              choiceNotes: { type: "string", description: "Any specific notes about the choice." },
              estimatedCost: { type: "number", description: "The estimated cost for this decision, in USD." },
              depositAmount: { type: "number", description: "The amount of deposit paid, in USD." },
              depositPaidAt: { type: "string", format: "date-time", description: "Timestamp when deposit was paid." },
              contractSigned: { type: "boolean", description: "Whether a contract has been signed." },
              contractSignedAt: { type: "string", format: "date-time", description: "Timestamp when contract was signed." },
              isSkipped: { type: "boolean", description: "Whether this required decision is being skipped." },
              force: { type: "boolean", description: "Set to true to force update a locked decision after user confirmation." },
            },
            required: ["decisionName"],
          },
        },
        {
          name: "web_search",
          description: "Search the web for information about wedding vendors, venues, etiquette, or inspiration. Use this when the user asks a question that requires current or specific external knowledge.",
          input_schema: {
            type: "object",
            properties: {
              query: { type: "string", description: "The search query" }
            },
            required: ["query"]
          }
        },
        /* Temporarily disabled for debugging
        {
          name: "lock_decision",
          // ...
        },
        // ... other tools ...
        */
      ],
    });

    let assistantMessage = "";
    let shouldRefreshPlannerData = false; // Flag to indicate if planner data might have changed
    let namesExtracted = false;
    let displayName: string | null = null;
    
    // Process Claude's response content blocks
    for (const contentBlock of response.content) {
      if (contentBlock.type === "text") {
        assistantMessage += contentBlock.text;
      } else if (contentBlock.type === "tool_use") {
        const toolName = contentBlock.name;
        const toolParameters = (contentBlock.input || {}) as Record<string, unknown>;

        // Execute the tool call using our executor
        const toolContext = { tenantId: session.user.tenantId, userId: session.user.id };
        const toolResult = await executeToolCall(toolName, toolParameters, toolContext);

        // Add tool execution result to the messages
        // Claude might want to see this output in the next turn
        // For now, we'll just append a simplified message to the assistant's response
        assistantMessage += `\n\n(Executed tool: ${toolName}) Result: ${toolResult.message}`;
        
        if (toolResult.success) {
            shouldRefreshPlannerData = true; // Data changed, refresh frontend
        } else {
            // If tool failed, inform the user or try to recover
            assistantMessage += `\n\n(Tool execution failed: ${toolResult.message})`;
        }
        
        // IMPORTANT: If Claude expects a tool_output block before its final text,
        // this logic needs to be extended to make another API call to Claude
        // with the tool_output. For simplicity, we are assuming Claude provides
        // final text after tool_use in a single response.
      }
    }

    // Check if names were extracted (only if no tool_use for onboarding)
    if (isOnboarding && !shouldRefreshPlannerData) { // Only extract names if no tool use happened
      displayName = extractNames(assistantMessage);
      if (displayName) {
        namesExtracted = true;
        assistantMessage = stripNameTag(assistantMessage);
      }
    }

    // If message is still empty but we did something, give a fallback
    if (!assistantMessage.trim()) {
        assistantMessage = shouldRefreshPlannerData ? "Done! I've updated your plan." : "I'm not sure how to help with that.";
    }

    // Update conversation with new messages
    const updatedMessages: Message[] = [
      ...existingMessages,
      { role: "user", content: message, timestamp: new Date().toISOString() },
      { role: "assistant", content: assistantMessage, timestamp: new Date().toISOString() },
    ];

    await db
      .update(scribeConversations)
      .set({
        messages: updatedMessages,
        updatedAt: new Date(),
      })
      .where(eq(scribeConversations.id, conversation.id));

    return NextResponse.json({
      message: assistantMessage,
      conversationId: conversation.id,
      namesExtracted,
      displayName,
      // Include updated usage info
      aiAccess: {
        messagesUsed: usageResult.newCount,
        messagesRemaining: usageResult.remaining,
        hasFullAccess: usageResult.remaining === "unlimited",
      },
      shouldRefreshPlannerData, // Include the refresh flag
    });
  } catch (error) {
    console.error("Scribe error:", error);
    if (error instanceof Error) {
        console.error("Error stack:", error.stack);
    }
    return NextResponse.json(
      { error: "Failed to get response", details: error instanceof Error ? error.message : String(error) },
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
      .update(scribeConversations)
      .set({ isActive: false })
      .where(
        and(
          eq(scribeConversations.tenantId, session.user.tenantId),
          eq(scribeConversations.isActive, true)
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
