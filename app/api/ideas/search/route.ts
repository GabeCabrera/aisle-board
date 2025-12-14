import { NextRequest, NextResponse } from "next/server";
import { searchIdeas } from "@/lib/data/stem";

export const dynamic = "force-dynamic";

/**
 * GET /api/ideas/search?query=xxx
 * Search for ideas across public boards (no auth required)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    if (!query || !query.trim()) {
      return NextResponse.json([]);
    }

    const results = await searchIdeas(query, Math.min(limit, 50));

    return NextResponse.json(results);
  } catch (error) {
    console.error("Error searching ideas:", error);
    return NextResponse.json(
      { error: "Failed to search ideas" },
      { status: 500 }
    );
  }
}
