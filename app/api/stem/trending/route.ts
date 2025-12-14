import { NextRequest, NextResponse } from "next/server";
import { getTrendingContent } from "@/lib/data/stem";

/**
 * GET /api/stem/trending
 * Get trending boards or ideas (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") as "boards" | "ideas") || "boards";
    const region = searchParams.get("region") || undefined;

    if (type !== "boards" && type !== "ideas") {
      return NextResponse.json(
        { error: "Invalid type. Must be 'boards' or 'ideas'" },
        { status: 400 }
      );
    }

    const trending = await getTrendingContent(type, region);

    return NextResponse.json({ trending });
  } catch (error) {
    console.error("Error fetching trending content:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending content" },
      { status: 500 }
    );
  }
}
