import { NextRequest, NextResponse } from "next/server";
import { getVendorsWithSearch, getVendorCategories, getVendorStates } from "@/lib/data/stem";
import { searchAndEnrichWebVendors, type EnrichedWebVendor } from "@/lib/ai/vendor-enrichment";

const TARGET_RESULT_COUNT = 10;

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
    const includeWeb = searchParams.get("includeWeb") !== "false"; // Default to true

    // Check if requesting filter options
    if (searchParams.get("filters") === "true") {
      const [categories, states] = await Promise.all([
        getVendorCategories(),
        getVendorStates(),
      ]);
      return NextResponse.json({ categories, states });
    }

    // Get directory vendors
    const directoryVendors = await getVendorsWithSearch({
      category,
      state,
      city,
      priceRange,
      search,
      sortBy,
      limit,
      offset,
    });

    // If we have enough results or web search is disabled, return directory only
    if (directoryVendors.length >= TARGET_RESULT_COUNT || !includeWeb || offset > 0) {
      return NextResponse.json(directoryVendors);
    }

    // Calculate how many web results we need
    const neededWebResults = TARGET_RESULT_COUNT - directoryVendors.length;

    // Build location string for web search
    const locationParts = [city, state].filter(Boolean);
    const location = locationParts.length > 0 ? locationParts.join(", ") : "USA";

    // Search category - use the filter category or try to infer from search
    const searchCategory = category || search || "wedding vendors";

    // Fetch web vendors in parallel
    let webVendors: EnrichedWebVendor[] = [];
    try {
      webVendors = await searchAndEnrichWebVendors(
        searchCategory,
        location,
        neededWebResults
      );
    } catch (error) {
      console.error("Web vendor search failed:", error);
      // Continue with directory results only
    }

    // Blend results: directory first, then web
    const blendedResults = [
      ...directoryVendors.map((v) => ({ ...v, isFromWeb: false as const })),
      ...webVendors,
    ];

    return NextResponse.json(blendedResults);
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    );
  }
}
