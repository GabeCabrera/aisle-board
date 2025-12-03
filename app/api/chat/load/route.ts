import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { conciergeConversations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Load the most recent conversation for the current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Get most recent conversation
    const conversation = await db.query.conciergeConversations.findFirst({
      where: eq(conciergeConversations.tenantId, tenantId),
      orderBy: [desc(conciergeConversations.updatedAt)],
    });

    if (!conversation) {
      return NextResponse.json({ 
        conversationId: null,
        messages: [] 
      });
    }

    // Filter to valid messages
    const messages = Array.isArray(conversation.messages)
      ? conversation.messages.filter((m: unknown) => {
          const msg = m as { role?: string; content?: string };
          return msg && (msg.role === "user" || msg.role === "assistant") && typeof msg.content === "string";
        })
      : [];

    return NextResponse.json({
      conversationId: conversation.id,
      messages,
    });
  } catch (error) {
    console.error("Load conversation error:", error);
    return NextResponse.json({ error: "Failed to load conversation" }, { status: 500 });
  }
}
