import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Anthropic from "@anthropic-ai/sdk";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { tenants, scribeConversations, weddingKernels } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { getAnthropicTools } from "@/lib/ai/tools";
import { executeToolCall, ToolResult } from "@/lib/ai/executor";
import { buildSystemPrompt, getFirstMessagePrompt, getReturningUserPrompt } from "@/lib/ai/prompt";
import { updateKernelFromExtraction, WeddingKernel } from "@/lib/ai/kernel-updates";
import { analyzeUserMessage, buildUserProfileFromKernel, UserProfile } from "@/lib/ai/user-profiling"; // Import from new file

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
      conversation = await db.query.scribeConversations.findFirst({
        where: and(
          eq(scribeConversations.id, inputConversationId),
          eq(scribeConversations.tenantId, tenantId)
        ),
      });
      console.log("[CHAT] Found existing conversation:", !!conversation);
    }

    if (!conversation) {
      console.log("[CHAT] Creating new conversation");
      const [newConv] = await db.insert(scribeConversations).values({
        tenantId,
        title: "New Chat",
        messages: [],
      }).returning();
      conversation = newConv;
      console.log("[CHAT] Created conversation:", conversation.id);
    }

    // Build message history
    const existingMessages: Message[] = Array.isArray(conversation.messages)
      ? (conversation.messages as Message[]).filter(m => m?.role && m?.content)
      : [];
    
    // Get user profile from kernel
    let userProfile: UserProfile = buildUserProfileFromKernel(kernel as unknown as WeddingKernel);
    
    // Analyze the new message for communication style signals
    const kernelProfileUpdates: Record<string, unknown> = {};
    if (message) {
      const profileUpdates = analyzeUserMessage(message, userProfile);
      if (Object.keys(profileUpdates).length > 0) {
        userProfile = { ...userProfile, ...profileUpdates };
        // Track what to save to kernel
        if (profileUpdates.usesEmojis !== undefined) kernelProfileUpdates.usesEmojis = profileUpdates.usesEmojis;
        if (profileUpdates.usesSwearing !== undefined) kernelProfileUpdates.usesSwearing = profileUpdates.usesSwearing;
        if (profileUpdates.messageLength !== undefined) kernelProfileUpdates.messageLength = profileUpdates.messageLength;
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
    const systemPrompt = buildSystemPrompt(kernel as unknown as Parameters<typeof buildSystemPrompt>[0], userProfile, today);

    // Handle first message vs returning user
    const isFirstMessage = history.length === 0;
    const isReturningUser = !isFirstMessage && existingMessages.length === 0 && kernel.names && (kernel.names as string[]).length > 0;
    
    let messagesToSend;
    if (isFirstMessage) {
      messagesToSend = [{ role: "user" as const, content: getFirstMessagePrompt() }];
    } else if (isReturningUser && !message) {
      messagesToSend = [{ role: "user" as const, content: getReturningUserPrompt(kernel as unknown as Parameters<typeof getReturningUserPrompt>[0]) }];
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
    let shouldRefreshPlannerData = false;

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

        if (result.success) {
          shouldRefreshPlannerData = true;
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

    // Update kernel from extraction
    if (extractMatch) {
      try {
        const extracted = JSON.parse(extractMatch[1]);
        
        // Merge profile updates from extraction
        if (extracted.knowledgeLevel) kernelProfileUpdates.knowledgeLevel = extracted.knowledgeLevel;
        if (extracted.usesEmojis !== undefined && extracted.usesEmojis !== null) kernelProfileUpdates.usesEmojis = extracted.usesEmojis;
        if (extracted.usesSwearing !== undefined && extracted.usesSwearing !== null) kernelProfileUpdates.usesSwearing = extracted.usesSwearing;
        
        await updateKernelFromExtraction(kernel.id, tenantId, extracted, kernelProfileUpdates);
      } catch (e) {
        console.error("Extraction parse error:", e);
        // Still save profile updates even if extraction parsing fails
        if (Object.keys(kernelProfileUpdates).length > 0) {
          await db.update(weddingKernels)
            .set({ ...kernelProfileUpdates, updatedAt: new Date() })
            .where(eq(weddingKernels.id, kernel.id));
        }
      }
    } else if (Object.keys(kernelProfileUpdates).length > 0) {
      // Save profile updates even without extraction
      await db.update(weddingKernels)
        .set({ ...kernelProfileUpdates, updatedAt: new Date() })
        .where(eq(weddingKernels.id, kernel.id));
    }

    // Save messages
    const newMessages: Message[] = message
      ? [...existingMessages, { role: "user", content: message }, { role: "assistant", content: cleanMessage }]
      : [...existingMessages, { role: "assistant", content: cleanMessage }];

        await db.update(scribeConversations)
          .set({
            messages: newMessages,
            updatedAt: new Date(),
          })
          .where(eq(scribeConversations.id, conversation.id));
    return NextResponse.json({ 
      message: cleanMessage,
      conversationId: conversation.id,
      toolResults: toolResults.length > 0 ? toolResults : undefined,
      shouldRefreshPlannerData
    });

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to get response", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
