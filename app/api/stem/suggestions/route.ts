import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getFollowerSuggestions } from "@/lib/data/stem";

/**
 * GET /api/stem/suggestions
 * Get follower suggestions for the current user
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    const suggestions = await getFollowerSuggestions(
      session.user.tenantId,
      Math.min(limit, 20) // Cap at 20
    );

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error("Error fetching follower suggestions:", error);
    return NextResponse.json(
      { error: "Failed to fetch suggestions" },
      { status: 500 }
    );
  }
}
