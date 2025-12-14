import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import {
  searchGooglePlaces,
  enrichVendorFromGoogle,
  findGooglePlaceForVendor,
} from "@/lib/services/google-places";

/**
 * GET /api/admin/vendors/enrich?query=xxx&location=xxx
 * Search Google Places for a vendor
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");
    const location = searchParams.get("location") || undefined;

    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    const results = await searchGooglePlaces(query, location);

    return NextResponse.json({
      results: results.map((r) => ({
        placeId: r.place_id,
        name: r.name,
        address: r.formatted_address,
        types: r.types,
      })),
    });
  } catch (error) {
    console.error("Error searching Google Places:", error);
    return NextResponse.json(
      { error: "Failed to search Google Places" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/vendors/enrich
 * Enrich a vendor from Google Places
 * Body: { vendorId, placeId?, tier? }
 * If placeId is not provided, will auto-search for the vendor
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email || session.user.email !== process.env.ADMIN_EMAIL) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { vendorId, placeId, tier = "free", vendorName, location } = body;

    if (!vendorId) {
      return NextResponse.json(
        { error: "vendorId is required" },
        { status: 400 }
      );
    }

    let googlePlaceId = placeId;

    // If no placeId provided, auto-search
    if (!googlePlaceId && vendorName) {
      const match = await findGooglePlaceForVendor(vendorName, location);
      if (match) {
        googlePlaceId = match.place_id;
      } else {
        return NextResponse.json(
          { error: "No Google Places match found for this vendor" },
          { status: 404 }
        );
      }
    }

    if (!googlePlaceId) {
      return NextResponse.json(
        { error: "placeId or vendorName is required" },
        { status: 400 }
      );
    }

    const result = await enrichVendorFromGoogle(
      vendorId,
      googlePlaceId,
      tier as "free" | "premium"
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to enrich vendor" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      enrichedData: result.data,
      placeId: googlePlaceId,
    });
  } catch (error) {
    console.error("Error enriching vendor:", error);
    return NextResponse.json(
      { error: "Failed to enrich vendor" },
      { status: 500 }
    );
  }
}
