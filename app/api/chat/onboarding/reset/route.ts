import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { db } from "@/lib/db";
import { conciergeConversations, tenants } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * Reset onboarding - clears conversation history
 * DELETE /api/chat/onboarding/reset
 */

export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Delete all conversations for this tenant
    await db.delete(conciergeConversations)
      .where(eq(conciergeConversations.tenantId, tenantId));

    // Reset onboarding status
    await db.update(tenants)
      .set({ onboardingComplete: false, updatedAt: new Date() })
      .where(eq(tenants.id, tenantId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset error:", error);
    return NextResponse.json({ error: "Failed to reset" }, { status: 500 });
  }
}
