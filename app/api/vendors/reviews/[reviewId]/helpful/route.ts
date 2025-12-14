import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { markReviewHelpful } from "@/lib/data/stem";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = await params;

    await markReviewHelpful(reviewId, session.user.tenantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking review helpful:", error);
    return NextResponse.json(
      { error: "Failed to mark review as helpful" },
      { status: 500 }
    );
  }
}
