import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { weddingKernels, conciergeConversations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export const dynamic = "force-dynamic";

/**
 * Debug endpoint to check kernel and conversation state
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Get kernel
    const kernel = await db.query.weddingKernels.findFirst({
      where: eq(weddingKernels.tenantId, tenantId),
    });

    // Get most recent conversation
    const conversation = await db.query.conciergeConversations.findFirst({
      where: eq(conciergeConversations.tenantId, tenantId),
      orderBy: [desc(conciergeConversations.updatedAt)],
    });

    return NextResponse.json({
      tenantId,
      kernel: kernel ? {
        id: kernel.id,
        names: kernel.names,
        location: kernel.location,
        weddingDate: kernel.weddingDate,
        guestCount: kernel.guestCount,
        budgetTotal: kernel.budgetTotal,
        vibe: kernel.vibe,
        vendorsBooked: kernel.vendorsBooked,
        lastInteraction: kernel.lastInteraction,
      } : null,
      conversation: conversation ? {
        id: conversation.id,
        messageCount: Array.isArray(conversation.messages) ? conversation.messages.length : 0,
        updatedAt: conversation.updatedAt,
      } : null,
    });
  } catch (error) {
    console.error("Debug error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
