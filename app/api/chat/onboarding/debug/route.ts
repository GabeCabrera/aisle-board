import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

/**
 * Debug endpoint to check environment variables
 * GET /api/chat/onboarding/debug
 */

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
    const keyPrefix = process.env.ANTHROPIC_API_KEY?.substring(0, 10) || "NOT SET";
    
    return NextResponse.json({
      hasAnthropicKey,
      keyPrefix: hasAnthropicKey ? keyPrefix + "..." : "NOT SET",
      hasSession: !!session,
      tenantId: session?.user?.tenantId || null,
      nodeEnv: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : "Unknown" 
    }, { status: 500 });
  }
}
