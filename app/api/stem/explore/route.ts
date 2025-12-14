import { NextRequest, NextResponse } from "next/server";
import { getExploreFeed, type BoardCategory, type ExploreSortOption } from "@/lib/data/stem";

/**
 * GET /api/stem/explore
 * Get explore feed with categories and sorting (public endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const category = (searchParams.get("category") as BoardCategory) || "all";
    const sortBy = (searchParams.get("sortBy") as ExploreSortOption) || "trending";
    const region = searchParams.get("region") || undefined;
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Validate category
    const validCategories: BoardCategory[] = [
      "all", "venues", "dresses", "decor", "flowers",
      "cakes", "photography", "invitations", "rings", "hair-makeup"
    ];
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: "Invalid category" },
        { status: 400 }
      );
    }

    // Validate sortBy
    const validSortOptions: ExploreSortOption[] = ["trending", "recent", "popular"];
    if (!validSortOptions.includes(sortBy)) {
      return NextResponse.json(
        { error: "Invalid sortBy option" },
        { status: 400 }
      );
    }

    const result = await getExploreFeed({
      category,
      sortBy,
      region,
      limit: Math.min(limit, 50), // Cap at 50
      offset,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching explore feed:", error);
    return NextResponse.json(
      { error: "Failed to fetch explore feed" },
      { status: 500 }
    );
  }
}
