import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPendingClaims, getAllClaims } from "@/lib/data/vendor-claims";
import type { ClaimStatus } from "@/lib/data/vendor-claims";

/**
 * GET /api/admin/vendors/claims
 * List vendor claims for admin review
 *
 * Query params:
 * - status: filter by claim status (pending, verified, approved, rejected)
 * - limit: number of results (default 50)
 * - offset: pagination offset (default 0)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email?.endsWith("@aisle.wedding")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as ClaimStatus | null;
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    // If requesting verified (pending review) claims specifically
    if (status === "verified" || searchParams.get("pending") === "true") {
      const claims = await getPendingClaims();
      return NextResponse.json({
        claims,
        total: claims.length,
      });
    }

    // Otherwise get all claims with optional status filter
    const claims = await getAllClaims({
      status: status || undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      claims,
      total: claims.length,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "Failed to fetch claims" },
      { status: 500 }
    );
  }
}
