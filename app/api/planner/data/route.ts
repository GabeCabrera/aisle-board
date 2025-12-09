import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { getPlannerData } from "@/lib/data/planner";

export const dynamic = "force-dynamic";

/**
 * GET /api/planner/data
 * 
 * Returns wedding planning data for the current user.
 * Accepts an optional 'sections' query parameter (comma-separated) to fetch specific data subsets.
 * Example: /api/planner/data?sections=budget,guests,kernel
 */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    const requestedSections = searchParams.get("sections")?.split(",").map(s => s.trim());

    const data = await getPlannerData(tenantId, requestedSections);

    return NextResponse.json(data);

  } catch (error) {
    console.error("Planner data error:", error);
    return NextResponse.json(
      { error: "Failed to load planner data" },
      { status: 500 }
    );
  }
}