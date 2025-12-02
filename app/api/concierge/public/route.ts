import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are a friendly, knowledgeable wedding planner. You help couples plan their wedding with warmth and expertise.

Keep responses concise but helpful (2-4 sentences for simple questions, more for complex topics).

You can help with:
- Wedding budgets and cost estimates
- Timeline and planning checklists
- Venue selection advice
- Vendor recommendations and questions
- Guest list management
- Seating arrangements
- Wedding day logistics
- Emotional support for planning stress

Be warm, encouraging, and practical. If someone seems stressed, acknowledge their feelings before diving into solutions.

IMPORTANT RULES:
- Never use emojis
- Never use emdashes. Use commas or periods instead.
- Keep a grounded, unhurried tone
- After 2-3 exchanges, you can mention they can create a free account to save their conversation, but don't be pushy`;

// Simple in-memory rate limiting (resets on server restart)
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const limit = rateLimits.get(ip);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60 * 60 * 1000 }); // 1 hour window
    return true;
  }

  if (limit.count >= 10) {
    return false; // Max 10 messages per hour for anonymous users
  }

  limit.count++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get("x-forwarded-for") || "anonymous";
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { 
          requiresAuth: true,
          message: "You've reached the limit for anonymous chats. Create a free account to continue." 
        },
        { status: 200 }
      );
    }

    const { message, plannerName, coupleNames } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    const contextualPrompt = plannerName 
      ? `${SYSTEM_PROMPT}\n\nYour name is ${plannerName}. You're helping ${coupleNames || "a couple"} plan their wedding.`
      : SYSTEM_PROMPT;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      system: contextualPrompt,
      messages: [{ role: "user", content: message }],
    });

    const assistantMessage = response.content[0].type === "text" 
      ? response.content[0].text 
      : "I'm having trouble responding right now.";

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error("Public concierge error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
