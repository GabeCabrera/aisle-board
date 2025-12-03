import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { 
  getAllDecisions, 
  getDecisionProgress, 
  initializeDecisionsForTenant 
} from "@/lib/ai/decisions";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;

    // Initialize decisions if they don't exist
    await initializeDecisionsForTenant(tenantId);

    // Get all decisions
    const decisions = await getAllDecisions(tenantId);
    const progress = await getDecisionProgress(tenantId);

    return NextResponse.json({
      decisions,
      progress,
    });
  } catch (error) {
    console.error("Decisions API error:", error);
    return NextResponse.json({ error: "Failed to load decisions" }, { status: 500 });
  }
}
