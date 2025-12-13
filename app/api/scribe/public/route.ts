import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit, publicRateLimiter, getRateLimitIdentifier } from "@/lib/rate-limit";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const SYSTEM_PROMPT = `You are Scribe, an AI wedding planner. You help couples plan their wedding with warmth and expertise.

Your goal is to be helpful, encouraging, and knowledgeable. You are not a sales bot. You are a wedding expert.

RULES:
- Your name is Scribe`;

// Sanitize user input to prevent prompt injection
function sanitizeCoupleNames(input: unknown): string | null {
  if (!input || typeof input !== "string") return null;

  // Limit length to 100 characters
  let sanitized = input.slice(0, 100);

  // Remove newlines, control characters, and common injection patterns
  sanitized = sanitized
    .replace(/[\n\r\t\x00-\x1F\x7F]/g, " ") // Remove control characters
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  // Block patterns that look like prompt injections
  const injectionPatterns = [
    /ignore\s*(previous|above|all)/i,
    /forget\s*(previous|above|all)/i,
    /disregard/i,
    /new\s*instructions?/i,
    /system\s*prompt/i,
    /you\s*are\s*now/i,
    /instead\s*(of|,)/i,
    /\bRULES?\s*:/i,
    /\bINSTRUCTIONS?\s*:/i,
  ];

  for (const pattern of injectionPatterns) {
    if (pattern.test(sanitized)) {
      return null; // Reject suspicious input
    }
  }

  // Only allow letters, numbers, spaces, ampersands, and basic punctuation
  if (!/^[a-zA-Z0-9\s&',.-]+$/.test(sanitized)) {
    return null;
  }

  return sanitized || null;
}

export async function POST(request: NextRequest) {
  try {
    // Rate limit using Redis (or in-memory fallback)
    const identifier = getRateLimitIdentifier(request);
    const rateLimit = await checkRateLimit(
      `public:${identifier}`,
      publicRateLimiter,
      10, // 10 requests per hour for anonymous users (fallback)
      60 * 60 * 1000
    );

    if (!rateLimit.success) {
      return NextResponse.json(
        {
          requiresAuth: true,
          message: "You've reached the limit for anonymous chats. Create a free account to continue."
        },
        { status: 200 }
      );
    }

    const { message, coupleNames } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "Message required" }, { status: 400 });
    }

    // Sanitize couple names to prevent prompt injection
    const sanitizedNames = sanitizeCoupleNames(coupleNames);

    const contextualPrompt = sanitizedNames
      ? `${SYSTEM_PROMPT}\n\nYou're helping ${sanitizedNames} plan their wedding.`
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
    console.error("Public scribe error:", error);
    return NextResponse.json(
      { error: "Failed to get response" },
      { status: 500 }
    );
  }
}
