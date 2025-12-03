import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants, conciergeConversations, weddingKernels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Onboarding Chat API
 * π-ID: 3.14159.7
 */

function getAnthropicClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }
  return new Anthropic({ apiKey });
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface WeddingKernelData {
  // People
  names?: string[];
  location?: string;
  occupations?: string[];
  
  // Their story
  howTheyMet?: string;
  howLongTogether?: string;
  engagementStory?: string;
  
  // Wedding basics
  weddingDate?: string;
  guestCount?: number;
  budgetTotal?: number;
  vibe?: string[];
  
  // Planning state
  venueStatus?: string;
  venueInfo?: string;
  vendorsBooked?: string[];
  
  // Concerns & priorities
  biggestConcern?: string;
  priorities?: string[];
  
  // Meta
  onboardingStep?: number;
}

const ONBOARDING_SYSTEM_PROMPT = `You are Aisle, a wedding planner. You're having a first conversation with someone who just found your service. Talk to them like you're meeting a new friend at a coffee shop, not like you're running them through a checklist.

Your goal is to get to know them as people first. The wedding planning stuff will come naturally.

TODAY'S DATE: {today}

WHAT YOU KNOW SO FAR:
{kernel}

CONVERSATION FLOW (let this unfold naturally, don't rush):

1. FIRST, get to know them as people:
   - Start casual. "Hi, how are you? I'm Aisle."
   - Ask their name. When they tell you, ask about their partner.
   - Ask where they're based, what they do, what they're into.
   - Be curious about them as humans, not just as "engaged couple."

2. THEN, get curious about their story:
   - "So how did you two meet?" (genuinely interested)
   - React to their story. Ask follow ups if it's interesting.
   - "And how did the proposal happen?" or "Who popped the question?"
   - Let them share. Don't rush past the good stuff.

3. ONLY THEN, ease into wedding planning:
   - "So have you two set a date yet, or still figuring that out?"
   - "Any idea how big you're thinking? Intimate or big party?"
   - "Have you started looking at venues or anything yet?"
   - "What's the vibe you're going for?"

4. FINALLY, wrap up and offer to help:
   - "What's feeling most overwhelming right now?"
   - "I'd love to help you figure this out. Where should we start?"

STYLE RULES (these are strict):
- NEVER use emojis. Ever.
- NEVER use emdashes (--). Use commas or periods instead.
- NEVER say "Ha," - if you want to laugh, say "Haha" instead.
- One question at a time. Let them answer.
- Short responses. 1-3 sentences usually. This is a conversation, not a speech.
- Use their names once you know them.
- React like a human. "Oh that's so sweet." "Haha, I love that." "Oh wow."
- If they give short answers, that's fine. Don't push.
- If they share something meaningful, acknowledge it before moving on.
- Sound like a real person, not a customer service bot.
- Contractions are good. "I'm" not "I am." "You're" not "you are."
- Be warm but not saccharine. No "I'm SO excited for you!!!"

EXTRACTION:
After your response, include a JSON block with any NEW information you learned in THIS message.
Only include fields that the user just told you. Don't repeat things you already knew.

<extract>
{
  "names": ["Name1", "Name2"] or null,
  "location": "City, State" or null,
  "occupations": ["Job1", "Job2"] or null,
  "howTheyMet": "brief summary" or null,
  "howLongTogether": "duration" or null,
  "engagementStory": "brief summary" or null,
  "weddingDate": "YYYY-MM-DD" or null,
  "guestCount": number or null,
  "budgetTotal": number_in_cents or null,
  "vibe": ["keyword", "keyword"] or null,
  "venueStatus": "none|looking|booked" or null,
  "venueInfo": "venue name or details" or null,
  "vendorsBooked": ["photographer", "caterer"] or null,
  "biggestConcern": "what's stressing them" or null,
  "priorities": ["photography", "food"] or null
}
</extract>

Only include fields you JUST learned. If they didn't mention something, don't include it.`;

function buildKernelContext(kernel: WeddingKernelData | null): string {
  if (!kernel) return "Nothing yet, this is the start of the conversation.";
  
  const parts: string[] = [];
  
  // People
  if (kernel.names && kernel.names.length > 0) {
    parts.push(`Names: ${kernel.names.join(" & ")}`);
  }
  if (kernel.location) {
    parts.push(`Location: ${kernel.location}`);
  }
  if (kernel.occupations && kernel.occupations.length > 0) {
    parts.push(`Jobs: ${kernel.occupations.join(", ")}`);
  }
  
  // Story
  if (kernel.howTheyMet) {
    parts.push(`How they met: ${kernel.howTheyMet}`);
  }
  if (kernel.howLongTogether) {
    parts.push(`Together: ${kernel.howLongTogether}`);
  }
  if (kernel.engagementStory) {
    parts.push(`Engagement: ${kernel.engagementStory}`);
  }
  
  // Wedding basics
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
  
  // Planning state
  if (kernel.venueStatus) {
    const venueText = kernel.venueInfo 
      ? `Venue: ${kernel.venueStatus} (${kernel.venueInfo})`
      : `Venue: ${kernel.venueStatus}`;
    parts.push(venueText);
  }
  if (kernel.vendorsBooked && kernel.vendorsBooked.length > 0) {
    parts.push(`Vendors booked: ${kernel.vendorsBooked.join(", ")}`);
  }
  
  // Concerns
  if (kernel.biggestConcern) {
    parts.push(`Main concern: ${kernel.biggestConcern}`);
  }
  if (kernel.priorities && kernel.priorities.length > 0) {
    parts.push(`Priorities: ${kernel.priorities.join(", ")}`);
  }
  
  return parts.length > 0 ? parts.join("\n") : "Nothing yet, this is the start of the conversation.";
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

    // Get or create wedding kernel
    let kernel = await db.query.weddingKernels.findFirst({
      where: eq(weddingKernels.tenantId, tenantId),
    });
    
    if (!kernel) {
      console.log("Onboarding: Creating new wedding kernel");
      const [newKernel] = await db.insert(weddingKernels).values({
        tenantId,
        names: [],
        vibe: [],
        priorities: [],
        dealbreakers: [],
        stressors: [],
        decisions: {},
        recentTopics: [],
        onboardingStep: 0,
      }).returning();
      kernel = newKernel;
    }

    // Get or create conversation
    let conversation;
    
    if (inputConversationId) {
      conversation = await db.query.conciergeConversations.findFirst({
        where: and(
          eq(conciergeConversations.id, inputConversationId),
          eq(conciergeConversations.tenantId, tenantId)
        ),
      });
      console.log("Onboarding: Found existing conversation:", !!conversation);
    }

    if (!conversation) {
      console.log("Onboarding: Creating new conversation");
      const [newConversation] = await db.insert(conciergeConversations).values({
        tenantId,
        title: "Getting started",
        messages: [],
      }).returning();
      conversation = newConversation;
      console.log("Onboarding: Created conversation:", conversation.id);
    }

    // Get existing messages and validate them
    let existingMessages: Message[] = [];
    if (Array.isArray(conversation.messages)) {
      existingMessages = (conversation.messages as Message[]).filter(
        (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
      );
    }
    
    console.log("Onboarding: Existing messages count:", existingMessages.length);

    // Build conversation history for API
    const history: Message[] = [...existingMessages];
    
    if (message) {
      history.push({ role: "user", content: message });
    }

    // Build kernel data for context
    const kernelData: WeddingKernelData = {
      names: kernel.names as string[] || [],
      location: kernel.location || undefined,
      occupations: kernel.occupations as string[] || [],
      howTheyMet: kernel.howTheyMet || undefined,
      howLongTogether: kernel.howLongTogether || undefined,
      engagementStory: kernel.engagementStory || undefined,
      weddingDate: kernel.weddingDate?.toISOString().split('T')[0],
      guestCount: kernel.guestCount || undefined,
      budgetTotal: kernel.budgetTotal || undefined,
      vibe: kernel.vibe as string[] || [],
      biggestConcern: (kernel.stressors as string[])?.[0],
      priorities: kernel.priorities as string[] || [],
      onboardingStep: kernel.onboardingStep,
    };

    // Build system prompt with current date
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const systemPrompt = ONBOARDING_SYSTEM_PROMPT
      .replace("{today}", today)
      .replace("{kernel}", buildKernelContext(kernelData));

    // If no message and no history, generate greeting
    const isFirstLoad = history.length === 0;
    const messagesToSend = isFirstLoad
      ? [{ role: "user" as const, content: "[User just opened the app. Say hi casually and ask how they're doing. Keep it simple and warm, like meeting someone new.]" }]
      : history;

    console.log("Onboarding: Calling Anthropic with", messagesToSend.length, "messages");

    let response;
    try {
      const anthropic = getAnthropicClient();
      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 500,
        system: systemPrompt,
        messages: messagesToSend,
      });
    } catch (apiError) {
      console.error("Onboarding: Anthropic API error:", apiError);
      throw apiError;
    }

    console.log("Onboarding: Anthropic responded in", Date.now() - startTime, "ms");

    const assistantMessage = response.content[0].type === "text" 
      ? response.content[0].text 
      : "I'm having trouble responding right now.";

    // Parse extraction and clean message
    const extractMatch = assistantMessage.match(/<extract>([\s\S]*?)<\/extract>/);
    const cleanMessage = assistantMessage.replace(/<extract>[\s\S]*?<\/extract>/, "").trim();
    
    if (extractMatch) {
      try {
        const extracted = JSON.parse(extractMatch[1]);
        console.log("Onboarding: Extracted data:", extracted);
        
        // Build kernel update object
        const kernelUpdate: Record<string, unknown> = {
          updatedAt: new Date(),
        };
        
        // Update names
        if (extracted.names && Array.isArray(extracted.names)) {
          const currentNames = (kernel.names as string[]) || [];
          const newNames = [...new Set([...currentNames, ...extracted.names])];
          kernelUpdate.names = newNames;
          
          // Also update tenant display name
          if (newNames.length >= 2) {
            await db.update(tenants)
              .set({ 
                displayName: `${newNames[0]} & ${newNames[1]}`,
                updatedAt: new Date() 
              })
              .where(eq(tenants.id, tenantId));
          }
        }
        
        // Update location
        if (extracted.location) {
          kernelUpdate.location = extracted.location;
        }
        
        // Update occupations
        if (extracted.occupations && Array.isArray(extracted.occupations)) {
          const currentOccupations = (kernel.occupations as string[]) || [];
          kernelUpdate.occupations = [...new Set([...currentOccupations, ...extracted.occupations])];
        }
        
        // Update how they met
        if (extracted.howTheyMet) {
          kernelUpdate.howTheyMet = extracted.howTheyMet;
        }
        
        // Update how long together
        if (extracted.howLongTogether) {
          kernelUpdate.howLongTogether = extracted.howLongTogether;
        }
        
        // Update engagement story
        if (extracted.engagementStory) {
          kernelUpdate.engagementStory = extracted.engagementStory;
        }
        
        // Update wedding date
        if (extracted.weddingDate) {
          // Add T12:00:00 to parse as noon, avoiding timezone shift to previous day
          const dateStr = extracted.weddingDate as string;
          const date = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00');
          if (!isNaN(date.getTime())) {
            kernelUpdate.weddingDate = date;
            // Also update on tenant for easy access
            await db.update(tenants)
              .set({ weddingDate: date, updatedAt: new Date() })
              .where(eq(tenants.id, tenantId));
          }
        }
        
        // Update guest count
        if (extracted.guestCount && typeof extracted.guestCount === 'number') {
          kernelUpdate.guestCount = extracted.guestCount;
        }
        
        // Update budget
        if (extracted.budgetTotal && typeof extracted.budgetTotal === 'number') {
          kernelUpdate.budgetTotal = extracted.budgetTotal;
        }
        
        // Update vibe (merge with existing)
        if (extracted.vibe && Array.isArray(extracted.vibe)) {
          const currentVibe = (kernel.vibe as string[]) || [];
          kernelUpdate.vibe = [...new Set([...currentVibe, ...extracted.vibe])];
        }
        
        // Update priorities (merge with existing)
        if (extracted.priorities && Array.isArray(extracted.priorities)) {
          const currentPriorities = (kernel.priorities as string[]) || [];
          kernelUpdate.priorities = [...new Set([...currentPriorities, ...extracted.priorities])];
        }
        
        // Update stressors/concerns
        if (extracted.biggestConcern) {
          const currentStressors = (kernel.stressors as string[]) || [];
          if (!currentStressors.includes(extracted.biggestConcern)) {
            kernelUpdate.stressors = [...currentStressors, extracted.biggestConcern];
          }
        }
        
        // Update decisions (venue, vendors)
        const currentDecisions = (kernel.decisions as Record<string, unknown>) || {};
        if (extracted.venueStatus || extracted.venueInfo) {
          currentDecisions.venue = {
            status: extracted.venueStatus || 'none',
            name: extracted.venueInfo || null,
            locked: extracted.venueStatus === 'booked',
          };
          kernelUpdate.decisions = currentDecisions;
        }
        if (extracted.vendorsBooked && Array.isArray(extracted.vendorsBooked)) {
          for (const vendor of extracted.vendorsBooked) {
            currentDecisions[vendor] = { name: vendor, locked: true };
          }
          kernelUpdate.decisions = currentDecisions;
        }
        
        // Save kernel updates
        if (Object.keys(kernelUpdate).length > 1) { // More than just updatedAt
          await db.update(weddingKernels)
            .set(kernelUpdate)
            .where(eq(weddingKernels.id, kernel.id));
          console.log("Onboarding: Updated kernel with:", Object.keys(kernelUpdate));
        }
        
      } catch (e) {
        console.error("Onboarding: Failed to parse extraction:", e);
      }
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
