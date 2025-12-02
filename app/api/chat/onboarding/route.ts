import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { weddingKernels, tenants, conciergeConversations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Onboarding Chat API
 * π-ID: 3.14159.7
 * 
 * Conversational onboarding that builds the wedding kernel.
 * Each step extracts specific information while feeling natural.
 */

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface KernelUpdate {
  names?: string[];
  weddingDate?: string;
  planningPhase?: string;
  guestCount?: number;
  budgetTotal?: number;
  vibe?: string[];
  decisions?: Record<string, { name: string; locked: boolean }>;
  stressors?: string[];
}

const ONBOARDING_SYSTEM_PROMPT = `You are Aisle, an AI wedding planner having your first conversation with a new couple. Your goal is to get to know them and understand where they are in their wedding planning journey.

You're warm, calm, and genuinely interested. You ask one question at a time and respond naturally to what they share. Never feel like a form or checklist.

CURRENT ONBOARDING STEP: {step}
WHAT WE KNOW SO FAR: {kernel}

ONBOARDING FLOW:
Step 0: Greet them warmly and ask who's getting married (names)
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
- If they give short answers, that's fine, move on
- If they share a lot, reflect that back briefly
- Keep responses concise, 2-3 sentences usually
- Be warm but not over-the-top

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

Only include fields you actually learned. Set moveToNextStep to true when you've gotten enough info for the current step.`;

function buildKernelContext(kernel: Record<string, unknown> | null): string {
  if (!kernel) return "Nothing yet, this is the start.";
  
  const parts: string[] = [];
  
  if (kernel.names && Array.isArray(kernel.names) && kernel.names.length > 0) {
    parts.push(`Names: ${(kernel.names as string[]).join(" & ")}`);
  }
  if (kernel.weddingDate) {
    parts.push(`Wedding date: ${kernel.weddingDate}`);
  }
  if (kernel.guestCount) {
    parts.push(`Guest count: ~${kernel.guestCount}`);
  }
  if (kernel.budgetTotal) {
    parts.push(`Budget: $${((kernel.budgetTotal as number) / 100).toLocaleString()}`);
  }
  if (kernel.vibe && Array.isArray(kernel.vibe) && kernel.vibe.length > 0) {
    parts.push(`Vibe: ${(kernel.vibe as string[]).join(", ")}`);
  }
  if (kernel.decisions && typeof kernel.decisions === 'object') {
    const decisions = kernel.decisions as Record<string, { name: string }>;
    const booked = Object.entries(decisions)
      .filter(([, v]) => v?.name)
      .map(([k, v]) => `${k}: ${v.name}`);
    if (booked.length > 0) {
      parts.push(`Already booked: ${booked.join(", ")}`);
    }
  }
  if (kernel.stressors && Array.isArray(kernel.stressors) && kernel.stressors.length > 0) {
    parts.push(`Worried about: ${(kernel.stressors as string[]).join(", ")}`);
  }
  
  return parts.length > 0 ? parts.join("\n") : "Nothing yet, this is the start.";
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { message, conversationId } = await request.json();
    const tenantId = session.user.tenantId;

    // Get or create wedding kernel
    let kernel = await db.query.weddingKernels.findFirst({
      where: eq(weddingKernels.tenantId, tenantId),
    });

    if (!kernel) {
      const [newKernel] = await db.insert(weddingKernels).values({
        tenantId,
        onboardingStep: 0,
      }).returning();
      kernel = newKernel;
    }

    // Get or create conversation
    let conversation = conversationId 
      ? await db.query.conciergeConversations.findFirst({
          where: eq(conciergeConversations.id, conversationId),
        })
      : null;

    if (!conversation) {
      const [newConversation] = await db.insert(conciergeConversations).values({
        tenantId,
        title: "Getting started",
        messages: [],
      }).returning();
      conversation = newConversation;
    }

    // Build conversation history
    const history: Message[] = Array.isArray(conversation.messages) 
      ? conversation.messages as Message[]
      : [];
    
    // Add user message if provided (not for initial load)
    if (message) {
      history.push({ role: "user", content: message });
    }

    // Build system prompt with current context
    const systemPrompt = ONBOARDING_SYSTEM_PROMPT
      .replace("{step}", String(kernel.onboardingStep))
      .replace("{kernel}", buildKernelContext(kernel as unknown as Record<string, unknown>));

    // If no message and no history, this is first load - generate greeting
    const messagesToSend = history.length === 0
      ? [{ role: "user" as const, content: "[User just opened the app for the first time. Greet them warmly and ask who's getting married.]" }]
      : history;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: systemPrompt,
      messages: messagesToSend,
    });

    const assistantMessage = response.content[0].type === "text" 
      ? response.content[0].text 
      : "I'm having trouble responding right now.";

    // Parse extraction
    const extractMatch = assistantMessage.match(/<extract>([\s\S]*?)<\/extract>/);
    let cleanMessage = assistantMessage.replace(/<extract>[\s\S]*?<\/extract>/, "").trim();
    
    let updates: KernelUpdate = {};
    let moveToNextStep = false;
    
    if (extractMatch) {
      try {
        const extracted = JSON.parse(extractMatch[1]);
        moveToNextStep = extracted.moveToNextStep || false;
        delete extracted.moveToNextStep;
        updates = extracted;
      } catch {
        // Ignore parsing errors
      }
    }

    // Update kernel with extracted info
    const kernelUpdates: Record<string, unknown> = { updatedAt: new Date() };
    
    if (updates.names && updates.names.length > 0) {
      kernelUpdates.names = updates.names;
    }
    if (updates.weddingDate) {
      kernelUpdates.weddingDate = new Date(updates.weddingDate);
    }
    if (updates.planningPhase) {
      kernelUpdates.planningPhase = updates.planningPhase;
    }
    if (updates.guestCount) {
      kernelUpdates.guestCount = updates.guestCount;
    }
    if (updates.budgetTotal) {
      kernelUpdates.budgetTotal = updates.budgetTotal;
    }
    if (updates.vibe && updates.vibe.length > 0) {
      kernelUpdates.vibe = updates.vibe;
    }
    if (updates.decisions) {
      kernelUpdates.decisions = { ...(kernel.decisions as object || {}), ...updates.decisions };
    }
    if (updates.stressors && updates.stressors.length > 0) {
      kernelUpdates.stressors = updates.stressors;
    }
    if (moveToNextStep) {
      kernelUpdates.onboardingStep = kernel.onboardingStep + 1;
    }

    // Check if onboarding is complete
    const isOnboardingComplete = (kernelUpdates.onboardingStep as number || kernel.onboardingStep) >= 7;
    
    if (isOnboardingComplete) {
      // Mark tenant as onboarding complete
      await db.update(tenants)
        .set({ onboardingComplete: true, updatedAt: new Date() })
        .where(eq(tenants.id, tenantId));
    }

    // Save kernel updates
    await db.update(weddingKernels)
      .set(kernelUpdates)
      .where(eq(weddingKernels.id, kernel.id));

    // Save conversation
    const newHistory = message 
      ? [...history, { role: "assistant" as const, content: cleanMessage }]
      : [{ role: "assistant" as const, content: cleanMessage }];
    
    await db.update(conciergeConversations)
      .set({ 
        messages: newHistory,
        updatedAt: new Date(),
      })
      .where(eq(conciergeConversations.id, conversation.id));

    return NextResponse.json({ 
      message: cleanMessage,
      conversationId: conversation.id,
      onboardingStep: kernelUpdates.onboardingStep || kernel.onboardingStep,
      isOnboardingComplete,
    });
  } catch (error) {
    console.error("Onboarding chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
