import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { reactToShowcase } from "@/lib/data/stem";

/**
 * POST /api/showcases/[showcaseId]/react
 * Toggle reaction on a showcase
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
    const result = await reactToShowcase(showcaseId, session.user.tenantId);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error reacting to showcase:", error);
    return NextResponse.json(
      { error: "Failed to react to showcase" },
      { status: 500 }
    );
  }
}
