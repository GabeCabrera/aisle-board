import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { approveShowcaseTagging } from "@/lib/data/stem";

/**
 * POST /api/showcases/[showcaseId]/approve
 * Approve being tagged in a showcase (couples only)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ showcaseId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { showcaseId } = await params;
    const updated = await approveShowcaseTagging(showcaseId, session.user.tenantId);

    return NextResponse.json({
      message: "Showcase tagging approved",
      showcase: updated,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to approve tagging";
    console.error("Error approving showcase tagging:", error);
    return NextResponse.json(
      { error: message },
      { status: message === "Unauthorized" ? 403 : 500 }
    );
  }
}
