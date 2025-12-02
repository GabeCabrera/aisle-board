import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants, conciergeConversations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Onboarding Chat API
 * π-ID: 3.14159.7
 */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface KernelData {
  names?: string[];
  weddingDate?: string;
  planningPhase?: string;
  guestCount?: number;
  budgetTotal?: number;
  vibe?: string[];
  decisions?: Record<string, { name: string; locked: boolean }>;
  stressors?: string[];
  onboardingStep?: number;
}

const ONBOARDING_SYSTEM_PROMPT = `You are Aisle, an AI wedding planner having your first conversation with someone planning their wedding. Your goal is to get to know them and understand where they are in their wedding planning journey.

You're warm, calm, and genuinely interested. You ask one question at a time and respond naturally to what they share. Never feel like a form or checklist.

CURRENT ONBOARDING STEP: {step}
WHAT WE KNOW SO FAR: {kernel}

ONBOARDING FLOW:
Step 0: Greet them warmly and ask for their name and their partner's name
Step 1: Ask when the wedding is (or if they've set a date yet)
Step 2: Ask roughly how many guests they're thinking
Step 3: Gently ask about budget range (make it comfortable to skip)
Step 4: Ask what vibe or feeling they want for their day
Step 5: Ask what they've already figured out (venue, photographer, etc.)
Step 6: Ask what's on their mind or stressing them out
Step 7: Summarize what you learned and transition to planning mode

STYLE:
- Never use emojis
- Never use emdashes, use commas or periods
- One question at a time
- Acknowledge what they share before asking the next thing
- If they only give one name, ask for their partner's name too
- If they give short answers, that's fine, move on
- If they share a lot, reflect that back briefly
- Keep responses concise, 2-3 sentences usually
- Be warm but not over-the-top
- Address them by name once you know it

EXTRACTION:
After your response, include a JSON block with any information you learned:
<extract>
{
  "names": ["Name1", "Name2"] or null,
  "weddingDate": "YYYY-MM-DD" or null,
  "planningPhase": "dreaming|early|mid|final|week_of" or null,
  "guestCount": number or null,
  "budgetTotal": number_in_cents or null,
  "vibe": ["keyword", "keyword"] or null,
  "decisions": {"venue": {"name": "...", "locked": true}} or null,
  "stressors": ["thing", "thing"] or null,
  "moveToNextStep": true or false
}
</extract>

Only include fields you actually learned. Set moveToNextStep to true when you've gotten enough info for the current step. For names, only set moveToNextStep to true once you have BOTH names.`;

function buildKernelContext(kernel: KernelData | null): string {
  if (!kernel) return "Nothing yet, this is the start.";
  
  const parts: string[] = [];
  
  if (kernel.names && kernel.names.length > 0) {
    parts.push(`Names: ${kernel.names.join(" & ")}`);
  }
  if (kernel.weddingDate) {
    parts.push(`Wedding date: ${kernel.weddingDate}`);
  }
  if (kernel.guestCount) {
    parts.push(`Guest count: ~${kernel.guestCount}`);
  }
  if (kernel.budgetTotal) {
    parts.push(`Budget: $${(kernel.budgetTotal / 100).toLocaleString()}`);
  }
  if (kernel.vibe && kernel.vibe.length > 0) {
    parts.push(`Vibe: ${kernel.vibe.join(", ")}`);
  }
  if (kernel.decisions) {
    const booked = Object.entries(kernel.decisions)
      .filter(([, v]) => v?.name)
      .map(([k, v]) => `${k}: ${v.name}`);
    if (booked.length > 0) {
      parts.push(`Already booked: ${booked.join(", ")}`);
    }
  }
  if (kernel.stressors && kernel.stressors.length > 0) {
    parts.push(`Worried about: ${kernel.stressors.join(", ")}`);
  }
  
  return parts.length > 0 ? parts.join("\n") : "Nothing yet, this is the start.";
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      console.log("Onboarding: No session or tenantId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    console.log("Onboarding: tenantId =", tenantId);

    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error("Onboarding: Failed to parse request body:", e);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    
    const { message, conversationId: inputConversationId } = body;
    console.log("Onboarding: message =", message?.substring(0, 50), "conversationId =", inputConversationId);

    // Get tenant
    const tenant = await db.query.tenants.findFirst({
      where: eq(tenants.id, tenantId),
    });

    if (!tenant) {
      console.log("Onboarding: Tenant not found");
      return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
    }

    // Get or create conversation
    let conversation;
    
    if (inputConversationId) {
      // Try to find existing conversation that belongs to this tenant
      conversation = await db.query.conciergeConversations.findFirst({
        where: and(
          eq(conciergeConversations.id, inputConversationId),
          eq(conciergeConversations.tenantId, tenantId)
        ),
      });
      console.log("Onboarding: Found existing conversation:", !!conversation);
    }

    if (!conversation) {
      // Create new conversation
      console.log("Onboarding: Creating new conversation");
      const [newConversation] = await db.insert(conciergeConversations).values({
        tenantId,
        title: "Getting started",
        messages: [],
      }).returning();
      conversation = newConversation;
      console.log("Onboarding: Created conversation:", conversation.id);
    }

    // Get existing messages
    const existingMessages = Array.isArray(conversation.messages) 
      ? conversation.messages as Message[]
      : [];
    
    console.log("Onboarding: Existing messages count:", existingMessages.length);
    
    // Track onboarding step based on conversation length
    const onboardingStep = Math.min(Math.floor(existingMessages.length / 2), 7);

    // Build conversation history for API
    const history: Message[] = [...existingMessages];
    
    // Add user message if provided
    if (message) {
      history.push({ role: "user", content: message });
    }

    // Build system prompt
    const kernelData: KernelData = { onboardingStep };
    const systemPrompt = ONBOARDING_SYSTEM_PROMPT
      .replace("{step}", String(onboardingStep))
      .replace("{kernel}", buildKernelContext(kernelData));

    // If no message and no history, generate greeting
    const isFirstLoad = history.length === 0;
    const messagesToSend = isFirstLoad
      ? [{ role: "user" as const, content: "[User just opened the app for the first time. Greet them warmly and ask who's getting married.]" }]
      : history;

    console.log("Onboarding: Calling Anthropic with", messagesToSend.length, "messages");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: messagesToSend,
    });

    console.log("Onboarding: Anthropic responded in", Date.now() - startTime, "ms");

    const assistantMessage = response.content[0].type === "text" 
      ? response.content[0].text 
      : "I'm having trouble responding right now.";

    // Parse extraction and clean message
    const extractMatch = assistantMessage.match(/<extract>([\s\S]*?)<\/extract>/);
    const cleanMessage = assistantMessage.replace(/<extract>[\s\S]*?<\/extract>/, "").trim();
    
    let moveToNextStep = false;
    
    if (extractMatch) {
      try {
        const extracted = JSON.parse(extractMatch[1]);
        moveToNextStep = extracted.moveToNextStep || false;
        
        // Update tenant display name if we got names
        if (extracted.names && extracted.names.length >= 2) {
          await db.update(tenants)
            .set({ 
              displayName: `${extracted.names[0]} & ${extracted.names[1]}`,
              updatedAt: new Date() 
            })
            .where(eq(tenants.id, tenantId));
        }
        
        // Update wedding date if provided
        if (extracted.weddingDate) {
          await db.update(tenants)
            .set({ 
              weddingDate: new Date(extracted.weddingDate),
              updatedAt: new Date() 
            })
            .where(eq(tenants.id, tenantId));
        }
      } catch (e) {
        console.error("Onboarding: Failed to parse extraction:", e);
      }
    }

    // Calculate new step
    const newStep = moveToNextStep ? onboardingStep + 1 : onboardingStep;
    const isOnboardingComplete = newStep >= 7;

    // Update onboarding status if complete
    if (isOnboardingComplete && !tenant.onboardingComplete) {
      await db.update(tenants)
        .set({ onboardingComplete: true, updatedAt: new Date() })
        .where(eq(tenants.id, tenantId));
    }

    // Save conversation with new messages
    const newHistory: Message[] = message 
      ? [...existingMessages, { role: "user", content: message }, { role: "assistant", content: cleanMessage }]
      : [...existingMessages, { role: "assistant", content: cleanMessage }];
    
    await db.update(conciergeConversations)
      .set({ 
        messages: newHistory,
        updatedAt: new Date(),
      })
      .where(eq(conciergeConversations.id, conversation.id));

    console.log("Onboarding: Saved conversation, total messages:", newHistory.length);

    return NextResponse.json({ 
      message: cleanMessage,
      conversationId: conversation.id,
      onboardingStep: newStep,
      isOnboardingComplete,
    });
  } catch (error) {
    console.error("Onboarding chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error("Error details:", { message: errorMessage, stack: errorStack });
    
    return NextResponse.json(
      { error: "Failed to get response", details: errorMessage },
      { status: 500 }
    );
  }
}
