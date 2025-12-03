import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants, conciergeConversations, weddingKernels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAnthropicTools } from "@/lib/ai/tools";
import { executeToolCall, ToolResult } from "@/lib/ai/executor";
import { buildSystemPrompt, getFirstMessagePrompt, getReturningUserPrompt } from "@/lib/ai/prompt";

/**
 * Aisle Chat API
 * 
 * A conversational wedding planner that:
 * - Feels like talking to a version of yourself who knows weddings
 * - Mirrors the user's communication style
 * - Takes actions through tools
 * - Makes users feel heard and understood
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
  artifact?: {
    type: string;
    data: unknown;
  };
}

interface WeddingKernel {
  id: string;
  names?: string[];
  location?: string;
  occupations?: string[];
  howTheyMet?: string;
  howLongTogether?: string;
  engagementStory?: string;
  weddingDate?: Date;
  guestCount?: number;
  budgetTotal?: number;
  vibe?: string[];
  formality?: string;
  colorPalette?: string[];
  priorities?: string[];
  stressors?: string[];
  biggestConcern?: string;
  decisions?: Record<string, unknown>;
  vendorsBooked?: string[];
  planningPhase?: string;
}

interface UserProfile {
  usesEmojis: boolean;
  usesSwearing: boolean;
  messageLength: "short" | "medium" | "long";
  knowledgeLevel: "beginner" | "intermediate" | "experienced";
  communicationStyle: "casual" | "balanced" | "formal";
}

interface ConversationMeta {
  userProfile?: UserProfile;
  messageCount?: number;
}

// ============================================================================
// ANALYZE USER MESSAGE
// ============================================================================

function analyzeUserMessage(message: string, existingProfile: UserProfile | null): Partial<UserProfile> {
  const updates: Partial<UserProfile> = {};
  
  // Check for emojis
  const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u;
  if (emojiRegex.test(message)) {
    updates.usesEmojis = true;
  }
  
  // Check for swearing (common mild swears)
  const swearRegex = /\b(damn|hell|shit|fuck|crap|ass|bullshit|dammit)\b/i;
  if (swearRegex.test(message)) {
    updates.usesSwearing = true;
  }
  
  // Analyze message length
  const wordCount = message.split(/\s+/).length;
  if (wordCount < 10) {
    updates.messageLength = "short";
  } else if (wordCount > 50) {
    updates.messageLength = "long";
  } else {
    updates.messageLength = "medium";
  }
  
  // If we already have a profile, only update if we're seeing new signals
  // (e.g., first emoji usage should flip the flag, but don't flip it back)
  if (existingProfile) {
    if (existingProfile.usesEmojis) delete updates.usesEmojis;
    if (existingProfile.usesSwearing) delete updates.usesSwearing;
    // Message length can update based on recent behavior
  }
  
  return updates;
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const body = await request.json();
    const { message, conversationId: inputConversationId } = body;

    // Get or create kernel
    let kernel = await db.query.weddingKernels.findFirst({
      where: eq(weddingKernels.tenantId, tenantId),
    });
    
    if (!kernel) {
      const [newKernel] = await db.insert(weddingKernels).values({
        tenantId,
        names: [],
        occupations: [],
        vibe: [],
        priorities: [],
        dealbreakers: [],
        stressors: [],
        decisions: {},
        recentTopics: [],
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
    }
    if (!conversation) {
      const [newConv] = await db.insert(conciergeConversations).values({
        tenantId,
        title: "Chat",
        messages: [],
        meta: { userProfile: null, messageCount: 0 },
      }).returning();
      conversation = newConv;
    }

    // Build message history
    const existingMessages: Message[] = Array.isArray(conversation.messages)
      ? (conversation.messages as Message[]).filter(m => m?.role && m?.content)
      : [];
    
    // Get conversation meta (user profile)
    const meta = (conversation.meta as ConversationMeta) || {};
    let userProfile: UserProfile | null = meta.userProfile || null;
    
    // Analyze the new message for communication style signals
    if (message) {
      const profileUpdates = analyzeUserMessage(message, userProfile);
      if (Object.keys(profileUpdates).length > 0) {
        userProfile = { 
          ...(userProfile || {
            usesEmojis: false,
            usesSwearing: false,
            messageLength: "medium",
            knowledgeLevel: "intermediate",
            communicationStyle: "balanced"
          }),
          ...profileUpdates 
        };
      }
    }
    
    const history = existingMessages.map(m => ({ role: m.role, content: m.content }));
    if (message) {
      history.push({ role: "user" as const, content: message });
    }

    // Build prompt
    const today = new Date().toLocaleDateString('en-US', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const systemPrompt = buildSystemPrompt(kernel as WeddingKernel, userProfile, today);

    // Handle first message vs returning user
    const isFirstMessage = history.length === 0;
    const isReturningUser = !isFirstMessage && existingMessages.length === 0 && kernel.names && kernel.names.length > 0;
    
    let messagesToSend;
    if (isFirstMessage) {
      messagesToSend = [{ role: "user" as const, content: getFirstMessagePrompt() }];
    } else if (isReturningUser && !message) {
      messagesToSend = [{ role: "user" as const, content: getReturningUserPrompt(kernel as WeddingKernel) }];
    } else {
      messagesToSend = history;
    }

    // Call Anthropic
    const anthropic = getAnthropicClient();
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 1024,
      system: systemPrompt,
      tools: getAnthropicTools(),
      messages: messagesToSend,
    });

    // Process tool calls
    const toolResults: ToolResult[] = [];
    let artifact: { type: string; data: unknown } | undefined;

    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
      );

      const toolResultContents: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        const result = await executeToolCall(
          toolUse.name,
          toolUse.input as Record<string, unknown>,
          { tenantId }
        );
        toolResults.push(result);

        // Capture artifact from show_artifact or analyze_planning_gaps
        if ((toolUse.name === "show_artifact" || toolUse.name === "analyze_planning_gaps") && result.artifact) {
          artifact = result.artifact;
        }

        toolResultContents.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(result),
        });
      }

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 1024,
        system: systemPrompt,
        tools: getAnthropicTools(),
        messages: [
          ...messagesToSend,
          { role: "assistant", content: response.content },
          { role: "user", content: toolResultContents },
        ],
      });
    }

    // Extract text
    const textBlock = response.content.find(
      (block): block is Anthropic.TextBlock => block.type === "text"
    );
    const finalText = textBlock?.text || "I'm having trouble responding.";

    // Clean extraction tags
    const extractMatch = finalText.match(/<extract>([\s\S]*?)<\/extract>/);
    const cleanMessage = finalText.replace(/<extract>[\s\S]*?<\/extract>/, "").trim();

    // Update kernel and profile from extraction
    if (extractMatch) {
      try {
        const extracted = JSON.parse(extractMatch[1]);
        await updateKernelFromExtraction(kernel.id, tenantId, extracted);
        
        // Update user profile from extraction
        if (extracted.knowledgeLevel || extracted.usesEmojis !== undefined || extracted.usesSwearing !== undefined) {
          userProfile = {
            ...(userProfile || {
              usesEmojis: false,
              usesSwearing: false,
              messageLength: "medium",
              knowledgeLevel: "intermediate",
              communicationStyle: "balanced"
            }),
            ...(extracted.knowledgeLevel && { knowledgeLevel: extracted.knowledgeLevel }),
            ...(extracted.usesEmojis !== undefined && { usesEmojis: extracted.usesEmojis }),
            ...(extracted.usesSwearing !== undefined && { usesSwearing: extracted.usesSwearing }),
          };
        }
      } catch (e) {
        console.error("Extraction parse error:", e);
      }
    }

    // Save messages and updated meta
    const newMessages: Message[] = message
      ? [...existingMessages, { role: "user", content: message }, { role: "assistant", content: cleanMessage, artifact }]
      : [...existingMessages, { role: "assistant", content: cleanMessage, artifact }];

    await db.update(conciergeConversations)
      .set({ 
        messages: newMessages, 
        meta: { 
          ...meta, 
          userProfile,
          messageCount: (meta.messageCount || 0) + (message ? 2 : 1)
        },
        updatedAt: new Date() 
      })
      .where(eq(conciergeConversations.id, conversation.id));

    return NextResponse.json({ 
      message: cleanMessage,
      conversationId: conversation.id,
      artifact,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}

// ============================================================================
// KERNEL UPDATE
// ============================================================================

async function updateKernelFromExtraction(
  kernelId: string,
  tenantId: string,
  extracted: Record<string, unknown>
): Promise<void> {
  const kernel = await db.query.weddingKernels.findFirst({
    where: eq(weddingKernels.id, kernelId)
  });
  if (!kernel) return;

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (extracted.names && Array.isArray(extracted.names)) {
    const current = (kernel.names as string[]) || [];
    updates.names = [...new Set([...current, ...extracted.names])];
    const names = updates.names as string[];
    if (names.length >= 2) {
      await db.update(tenants)
        .set({ displayName: `${names[0]} & ${names[1]}` })
        .where(eq(tenants.id, tenantId));
    }
  }

  if (extracted.location) updates.location = extracted.location;
  if (extracted.howTheyMet) updates.howTheyMet = extracted.howTheyMet;
  if (extracted.engagementStory) updates.engagementStory = extracted.engagementStory;
  if (extracted.biggestConcern) updates.biggestConcern = extracted.biggestConcern;

  if (extracted.weddingDate) {
    const date = new Date(extracted.weddingDate as string);
    if (!isNaN(date.getTime())) {
      updates.weddingDate = date;
      await db.update(tenants).set({ weddingDate: date }).where(eq(tenants.id, tenantId));
    }
  }

  if (extracted.guestCount) updates.guestCount = extracted.guestCount;
  if (extracted.budgetTotal) updates.budgetTotal = extracted.budgetTotal;

  // Merge arrays
  const arrayFields = ['occupations', 'vibe', 'priorities', 'stressors'] as const;
  for (const field of arrayFields) {
    if (extracted[field] && Array.isArray(extracted[field])) {
      const current = (kernel[field] as string[]) || [];
      updates[field] = [...new Set([...current, ...(extracted[field] as string[])])];
    }
  }

  if (Object.keys(updates).length > 1) {
    await db.update(weddingKernels).set(updates).where(eq(weddingKernels.id, kernelId));
  }
}
