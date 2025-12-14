import { NextRequest, NextResponse } from "next/server";
import { getVendorsWithSearch, getVendorCategories, getVendorStates } from "@/lib/data/stem";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get("category") || undefined;
    const state = searchParams.get("state") || undefined;
    const city = searchParams.get("city") || undefined;
    const priceRange = searchParams.get("priceRange") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = (searchParams.get("sortBy") as "featured" | "rating" | "reviews" | "saves" | "newest") || "featured";
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // Check if requesting filter options
    if (searchParams.get("filters") === "true") {
      const [categories, states] = await Promise.all([
        getVendorCategories(),
        getVendorStates(),
      ]);
      return NextResponse.json({ categories, states });
    }

    const vendors = await getVendorsWithSearch({
      category,
      state,
      city,
      priceRange,
      search,
      sortBy,
      limit,
      offset,
    });

    return NextResponse.json(vendors);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
